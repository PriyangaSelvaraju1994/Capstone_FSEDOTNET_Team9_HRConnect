using HRConnect.API.Entities;
using HRConnect.API.DTOs.Auth;

namespace HRConnect.API.Services.Interfaces;

public interface IAuthService
{
    Task<bool> EmailExistsAsync(string email);

    Task<User> RegisterUserAsync(RegisterRequestDto request);

    Task<User?> ValidateUserAsync(LoginRequestDto request);

    LogoutResponseDto Logout(string? userId, string? email, string? jti);
}
