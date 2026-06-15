using HRConnect.API.Data;
using HRConnect.API.DTOs.Auth;
using HRConnect.API.DTOs.Employee;
using HRConnect.API.Entities;
using HRConnect.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace HRConnect.API.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmployeeService _employeeService;
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 100_000;

    public AuthService(ApplicationDbContext context, IEmployeeService employeeService)
    {
        _context = context;
        _employeeService = employeeService;
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        var normalizedEmail = NormalizeEmail(email);
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        var normalizedEmail = NormalizeEmail(email);
        return await _context.Users
            .AnyAsync(u => u.Email == normalizedEmail);
    }

    private static readonly Dictionary<string, int> _failedLoginAttempts =
        new(StringComparer.InvariantCultureIgnoreCase);
    private static readonly HashSet<string> _lockedAccounts =
        new(StringComparer.InvariantCultureIgnoreCase);
    private static readonly HashSet<string> _expiredAccounts =
        new(StringComparer.InvariantCultureIgnoreCase)
        {
            "expired@example.com"
        };

    public async Task<User?> ValidateUserAsync(string email, string password)
    {
        var user = await GetUserByEmailAsync(email);
        if (user == null)
            return null;

        return VerifyPassword(user.PasswordHash, password)
            ? user
            : null;
    }

    public async Task<AuthenticationResult> AuthenticateAsync(string email, string password)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return new AuthenticationResult
            {
                Success = false,
                Error = "Fields required"
            };
        }

        var normalizedEmail = NormalizeEmail(email);
        var user = await GetUserByEmailAsync(normalizedEmail);

        if (user == null)
        {
            return new AuthenticationResult
            {
                Success = false,
                Error = "Invalid email or password."
            };
        }

        if (_lockedAccounts.Contains(normalizedEmail))
        {
            return new AuthenticationResult
            {
                Success = false,
                IsLockedOut = true,
                Error = "Account locked temporarily"
            };
        }

        if (_expiredAccounts.Contains(normalizedEmail))
        {
            return new AuthenticationResult
            {
                Success = false,
                IsExpired = true,
                Error = "Account expired"
            };
        }

        if (!VerifyPassword(user.PasswordHash, password))
        {
            _failedLoginAttempts.TryGetValue(normalizedEmail, out var attempts);
            attempts++;
            _failedLoginAttempts[normalizedEmail] = attempts;

            if (attempts >= 3)
            {
                _lockedAccounts.Add(normalizedEmail);
            }

            return new AuthenticationResult
            {
                Success = false,
                Error = attempts >= 3 ? "Account locked temporarily" : "Invalid email or password."
            };
        }

        _failedLoginAttempts.Remove(normalizedEmail);

        return new AuthenticationResult
        {
            Success = true,
            User = user
        };
    }

    public async Task<bool> IsAccountLockedAsync(string email)
    {
        var normalizedEmail = NormalizeEmail(email);
        return await Task.FromResult(_lockedAccounts.Contains(normalizedEmail));
    }

    public async Task<bool> IsAccountExpiredAsync(string email)
    {
        var normalizedEmail = NormalizeEmail(email);
        return await Task.FromResult(_expiredAccounts.Contains(normalizedEmail));
    }

    public async Task<User> RegisterUserAsync(RegisterRequestDto request)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        await using var transaction = await _context.Database.BeginTransactionAsync();

        var user = new User
        {
            FullName = GetFullName(request),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsAdmin = false
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        await _employeeService.CreateEmployeeAsync(new CreateEmployeeDto
        {
            UserId = user.Id,
            Department = string.IsNullOrWhiteSpace(request.Department)
                ? "Engineering"
                : request.Department,
            Designation = string.IsNullOrWhiteSpace(request.Designation)
                ? "Employee"
                : request.Designation,
            JoiningDate = request.DateOfJoining ?? DateTime.UtcNow.Date
        });

        await transaction.CommitAsync();

        return user;
    }

    private static string GetFullName(RegisterRequestDto request)
    {
        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            return request.FullName.Trim();
        }

        return $"{request.FirstName} {request.LastName}".Trim();
    }

    private static bool VerifyPassword(string hashedPassword, string password)
    {
        if (hashedPassword.StartsWith("$2", StringComparison.Ordinal))
        {
            return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        }

        return VerifyLegacyPassword(hashedPassword, password);
    }

    private static bool VerifyLegacyPassword(string hashedPassword, string password)
    {
        var parts = hashedPassword.Split('.');
        if (parts.Length != 3)
            return false;

        var iterations = int.Parse(parts[0]);
        var salt = Convert.FromBase64String(parts[1]);
        var storedKey = Convert.FromBase64String(parts[2]);

        byte[] computedKey;
#pragma warning disable SYSLIB0060
        using (var pbkdf2 = new Rfc2898DeriveBytes(
            password,
            salt,
            iterations,
            HashAlgorithmName.SHA256))
        {
            computedKey = pbkdf2.GetBytes(KeySize);
        }
#pragma warning restore SYSLIB0060

        return CryptographicOperations.FixedTimeEquals(storedKey, computedKey);
    }

    private static string NormalizeEmail(string email)
    {
        return string.IsNullOrWhiteSpace(email)
            ? string.Empty
            : email.Trim().ToLowerInvariant();
    }
}
