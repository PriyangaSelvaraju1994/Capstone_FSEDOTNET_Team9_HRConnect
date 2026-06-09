using HRConnect.API.DTOs.Auth;
using HRConnect.API.Entities;

namespace HRConnect.API.Services.Interfaces;

public interface IAuthService
{
    Task<User?> GetUserByEmailAsync(string email);

    Task<bool> EmailExistsAsync(string email);

    Task<User?> ValidateUserAsync(string email, string password);

    Task<User> RegisterUserAsync(RegisterRequestDto request);
}
