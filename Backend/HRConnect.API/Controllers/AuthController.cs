using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HRConnect.API.Services.Interfaces;
using HRConnect.API.Entities;
using Microsoft.EntityFrameworkCore;
using HRConnect.API.Data;
using HRConnect.API.DTOs;
using HRConnect.API.DTOs.Employee;
using BCrypt.Net;

namespace HRConnect.API.Controllers;
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IJwtService _jwtService;
    private readonly ApplicationDbContext _context;
    private readonly IEmployeeService _employeeService;
    public AuthController(IJwtService jwtService, ApplicationDbContext context, IEmployeeService employeeService)
    {
        _jwtService = jwtService;
        _context = context;
        _employeeService = employeeService;
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
            JoiningDate = request.DateOfJoining
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

    [HttpPost("logout")]
    public IActionResult Logout()
    {      
        return Ok("User logged out successfully");
    }
}