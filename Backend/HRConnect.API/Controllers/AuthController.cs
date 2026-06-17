using HRConnect.API.DTOs.Auth;
using HRConnect.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HRConnect.API.DTOs;
using BCrypt.Net;
using System.Security.Claims;

namespace HRConnect.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IJwtService _jwtService;

    public AuthController(
        IAuthService authService,
        IJwtService jwtService)
    {
        _authService = authService;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequestDto request)
    {
        if (await _authService.EmailExistsAsync(request.Email))
        {
            return BadRequest("User already exists");
        }

        await _authService.RegisterUserAsync(request);

        return Ok("User registered successfully");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto request)
    {
        var user = await _authService.ValidateUserAsync(request);
        if (user == null)
        {
            return Unauthorized("Invalid credentials");
        }

        var token = _jwtService.GenerateToken(user);
        return Ok(new
        {
            httpResponseCode = 200,
            resultStatus = "User logged in successfully",
            resultSet = new
            {
                userId = user.Id,
                name = user.FullName,
                isAdmin = user.IsAdmin,
                token = token
            }
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var jti = User.FindFirst("jti")?.Value;

        var logoutWrapper = new LogoutResponseWrapperDto
        {
            HttpResponseCode = 200,
            ResultStatus = "success",
            ResultSet = _authService.Logout(userId, email, jti)
        };

        return Ok(logoutWrapper);
    }
}
