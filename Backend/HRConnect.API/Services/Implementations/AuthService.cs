using HRConnect.API.Data;
using HRConnect.API.DTOs.Auth;
using HRConnect.API.DTOs.Employee;
using HRConnect.API.Entities;
using HRConnect.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HRConnect.API.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmployeeService _employeeService;
    private readonly ITokenRevocationService _tokenRevocationService;

    public AuthService(
        ApplicationDbContext context,
        IEmployeeService employeeService,
        ITokenRevocationService tokenRevocationService)
    {
        _context = context;
        _employeeService = employeeService;
        _tokenRevocationService = tokenRevocationService;
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _context.Users.AnyAsync(u => u.Email == email);
    }

    public async Task<User> RegisterUserAsync(RegisterRequestDto request)
    {
        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsAdmin = false
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var employee = new CreateEmployeeDto
        {
            UserId = user.Id,
            Department = request.Department,
            Designation = request.Designation,
            JoiningDate = request.DateOfJoining
        };

        await _employeeService.CreateEmployeeAsync(employee);

        return user;
    }

    public async Task<User?> ValidateUserAsync(LoginRequestDto request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
        {
            return null;
        }

        return BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash)
            ? user
            : null;
    }

    public LogoutResponseDto Logout(string? userId, string? email, string? jti)
    {
        if (!string.IsNullOrEmpty(jti))
        {
            _tokenRevocationService.RevokeToken(jti);
        }

        return new LogoutResponseDto
        {
            Message = "User logged out successfully. Token has been revoked on the server.",
            UserId = userId,
            Email = email,
            TokenRevoked = !string.IsNullOrEmpty(jti)
        };
    }
}
