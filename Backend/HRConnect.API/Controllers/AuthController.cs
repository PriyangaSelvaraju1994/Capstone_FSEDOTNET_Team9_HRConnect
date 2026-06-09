using HRConnect.API.DTOs.Auth;
using HRConnect.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HRConnect.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IJwtService _jwtService;

    public AuthController(IAuthService authService, IJwtService jwtService)
    {
        _authService = authService;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequestDto request)
    {
        if (await _authService.EmailExistsAsync(request.Email))
            return Conflict(new { Message = "Email already registered." });

        var user = await _authService.RegisterUserAsync(request);

        return Ok(new RegisterResponseDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            IsAdmin = user.IsAdmin
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto request)
    {
        var user = await _authService.ValidateUserAsync(request.Email, request.Password);

        if (user == null)
            return Unauthorized(new { Message = "Invalid email or password." });

        var token = _jwtService.GenerateToken(user.Id, user.Email, user.IsAdmin);

        return Ok(new LoginResponseDto
        {
            Token = token,
            FullName = user.FullName,
            IsAdmin = user.IsAdmin
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(" User logged out successfully");
    }
}