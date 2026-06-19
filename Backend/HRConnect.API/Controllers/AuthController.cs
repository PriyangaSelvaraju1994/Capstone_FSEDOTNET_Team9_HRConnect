using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HRConnect.API.Services.Interfaces;
using HRConnect.API.Entities;
using Microsoft.EntityFrameworkCore;
using HRConnect.API.Data;
using HRConnect.API.DTOs;
using HRConnect.API.DTOs.Employee;
using BCrypt.Net;
using System.Security.Claims;
using HRConnect.API.Services;

namespace HRConnect.API.Controllers;
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IJwtService _jwtService;
    private readonly ApplicationDbContext _context;
    private readonly IEmployeeService _employeeService;
    private readonly ITokenRevocationService _tokenRevocationService;
    public AuthController(IJwtService jwtService, ApplicationDbContext context, IEmployeeService employeeService, ITokenRevocationService tokenRevocationService)
    {
        _jwtService = jwtService;
        _context = context;
        _employeeService = employeeService;
        _tokenRevocationService = tokenRevocationService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequestDto request)
    {
            var userExists = _context.Users.Any(u => u.Email == request.Email);
        if (userExists)
        {
            return BadRequest("User already exists");
        }
        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsAdmin = false
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        //add employee record for the new user
        var employee = new CreateEmployeeDto
        {
            UserId = user.Id,
            Department = request.Department,
            Designation = request.Designation,
            JoiningDate = request.DateOfJoining,
            IsActive = false,
        };
        await _employeeService.CreateEmployeeAsync(employee);
        return Ok("User registered successfully");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto request)
    {
         var user = await _context.Users
        .FirstOrDefaultAsync(u => u.Email == request.Email);

       
        if (user == null)
        return Unauthorized("Invalid credentials");
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        return Unauthorized("Invalid credentials");
        //check user isactive
        if (user != null)
        {
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.UserId == user.Id);
            if (employee != null && !employee.IsActive)
            {
                return Unauthorized("User is not active. Please contact HR for activation.");
            }
        }

        var token = _jwtService.GenerateToken(user);
        return Ok(new { 
            httpResponseCode = 200,
            resultStatus = "User logged in successfully",
            resultSet = new { 
                userId = user.Id,
                 name = user.FullName,
                   isAdmin = user.IsAdmin
            ,token = token },
            });
    }

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {    
         var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var jti = User.FindFirst("jti")?.Value;

        if (!string.IsNullOrEmpty(jti))
        {
            _tokenRevocationService.RevokeToken(jti);
        }

        return Ok(new
        {
            httpResponseCode = 200,
            resultStatus = "success",
            resultSet = new
            {
                message = "User logged out successfully. Token has been revoked on the server.",
                userId = userId,
                email = email,
                tokenRevoked = !string.IsNullOrEmpty(jti)
            }
        });  
        return Ok("User logged out successfully");
    }
}