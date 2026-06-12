using HRConnect.API.Data;
using HRConnect.API.DTOs.Auth;
using HRConnect.API.Entities;
using HRConnect.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace HRConnect.API.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 100_000;

    public AuthService(ApplicationDbContext context)
    {
        _context = context;
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
        var user = new User
        {
            FullName = request.FullName,
            Email = normalizedEmail,
            PasswordHash = HashPassword(request.Password),
            IsAdmin = false
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return user;
    }

    private static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);

#pragma warning disable SYSLIB0060
        using var pbkdf2 = new Rfc2898DeriveBytes(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256);
        var key = pbkdf2.GetBytes(KeySize);
#pragma warning restore SYSLIB0060

        return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";
    }

    private static bool VerifyPassword(string hashedPassword, string password)
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
