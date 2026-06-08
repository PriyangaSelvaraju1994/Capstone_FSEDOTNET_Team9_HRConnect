using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
namespace HRConnect.API.Controllers;
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IJwtService _jwtService;
    public AuthController(IJwtService jwtService)
    {
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    public IActionResult Register(RegisterRequestDto request)
    {
        return Ok(" User registered successfully");
    }

    [HttpPost("login")]
    public IActionResult Login(LoginRequestDto request)
    {
        var token = _jwtService.GenerateToken(request.Email);
        return Ok(new { Token = token });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(" User logged out successfully");
    }
}