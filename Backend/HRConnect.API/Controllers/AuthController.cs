using HRConnect.API.DTOs.Auth;
using HRConnect.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HRConnect.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IJwtService _jwtService;
    private readonly ITokenRevocationService _tokenRevocationService;

    public AuthController(IAuthService authService, IJwtService jwtService, ITokenRevocationService tokenRevocationService)
    {
        _authService = authService;
        _jwtService = jwtService;
        _tokenRevocationService = tokenRevocationService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequestDto request)
    {
        if (await _authService.EmailExistsAsync(request.Email))
        {
            var err = new ErrorResponseWrapperDto
            {
                HttpResponseCode = 409,
                ResultStatus = "error",
                ErrorResponse = new ErrorResponseDto { Message = "Email already registered." }
            };
            return Conflict(err);
        }

        var user = await _authService.RegisterUserAsync(request);
        var registerWrapper = new RegisterResponseWrapperDto
        {
            HttpResponseCode = 200,
            ResultStatus = "success",
            ResultSet = new RegisterResponseDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                IsAdmin = user.IsAdmin
            }
        };
        return Ok(registerWrapper);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            var details = ModelState.ToDictionary(k => k.Key, v => v.Value?.Errors.Select(e => e.ErrorMessage).ToArray());
            var err = new ErrorResponseWrapperDto
            {
                HttpResponseCode = 400,
                ResultStatus = "error",
                ErrorResponse = new ErrorResponseDto { Message = "Fields required", Details = details }
            };
            return BadRequest(err);
        }

        var result = await _authService.AuthenticateAsync(request.Email, request.Password);

        if (!result.Success)
        {
            var err = new ErrorResponseWrapperDto
            {
                HttpResponseCode = 401,
                ResultStatus = "error",
                ErrorResponse = new ErrorResponseDto { Message = result.Error }
            };
            return Unauthorized(err);
        }

        var token = _jwtService.GenerateToken(result.User!);

        var loginWrapper = new LoginResponseWrapperDto
        {
            HttpResponseCode = 200,
            ResultStatus = "success",
            ResultSet = new LoginResponseDto
            {
                Name = result.User.FullName,
                UserId = result.User.Id,
                IsAdmin = result.User.IsAdmin,
                Token = token
            }
        };

        return Ok(loginWrapper);
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var jti = User.FindFirst("jti")?.Value;

        if (!string.IsNullOrEmpty(jti))
        {
            _tokenRevocationService.RevokeToken(jti);
        }

        var logoutWrapper = new LogoutResponseWrapperDto
        {
            HttpResponseCode = 200,
            ResultStatus = "success",
            ResultSet = new LogoutResponseDto
            {
                Message = "User logged out successfully. Token has been revoked on the server.",
                UserId = userId,
                Email = email,
                TokenRevoked = !string.IsNullOrEmpty(jti)
            }
        };

        return Ok(logoutWrapper);
    }

    [HttpGet("test/token")]
    [Authorize]
    public IActionResult TestToken()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        return Ok(new
        {
            Message = "Token is valid and not revoked.",
            UserId = userId,
            Email = email,
            Role = role,
            Timestamp = DateTime.UtcNow
        });
    }

    [HttpGet("test/logout-status")]
    public IActionResult LogoutStatus()
    {
        return Ok(new
        {
            Message = "Token revocation is now implemented on the server.",
            TokenLifecycle = "1. Login → Get JWT token, 2. Call logout with token → Token is revoked on server, 3. Call any endpoint with revoked token → 401 Unauthorized",
            HowToTest = "1) Login and get token, 2) Call GET /api/auth/test/token with token (works), 3) Call POST /api/auth/logout with token (revokes it), 4) Call GET /api/auth/test/token again with same token (returns 401 - Token has been revoked)"
        });
    }
}