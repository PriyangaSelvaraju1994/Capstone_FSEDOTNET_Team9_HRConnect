using HRConnect.API.DTOs.Auth;
using HRConnect.API.Entities;

namespace HRConnect.API.Services.Interfaces;

public interface IAuthService
{
    Task<User?> GetUserByEmailAsync(string email);

    Task<bool> EmailExistsAsync(string email);

    Task<User?> ValidateUserAsync(string email, string password);

    Task<AuthenticationResult> AuthenticateAsync(string email, string password);

    Task<bool> IsAccountLockedAsync(string email);

    Task<bool> IsAccountExpiredAsync(string email);

    Task<User> RegisterUserAsync(RegisterRequestDto request);
}
