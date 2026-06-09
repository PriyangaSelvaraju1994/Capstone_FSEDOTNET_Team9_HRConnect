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

    public async Task<User?> ValidateUserAsync(string email, string password)
    {
        var user = await GetUserByEmailAsync(email);
        if (user == null)
            return null;

        return VerifyPassword(user.PasswordHash, password)
            ? user
            : null;
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
