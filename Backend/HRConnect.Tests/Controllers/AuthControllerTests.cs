using HRConnect.API.Controllers;
using HRConnect.API.Data;
using HRConnect.API.DTOs;
using HRConnect.API.DTOs.Employee;
using HRConnect.API.Entities;
using HRConnect.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
namespace HRConnect.Tests.Controllers;
public class AuthControllerTests : IDisposable
{
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly Mock<IEmployeeService> _employeeServiceMock;
    private readonly ApplicationDbContext _context;
    private readonly AuthController _controller;
    public AuthControllerTests()
    {
        _jwtServiceMock = new Mock<IJwtService>();
        _employeeServiceMock = new Mock<IEmployeeService>();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        _context = new ApplicationDbContext(options);
        _controller = new AuthController(_jwtServiceMock.Object,_context,_employeeServiceMock.Object);
    }
    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
    private RegisterRequestDto CreateRegisterRequest(string fullName = "John Doe",string email = "john@example.com",string password = "Password123",string department = "IT",string designation = "Software Engineer",DateTime? joiningDate = null)
    {
        return new RegisterRequestDto
        {
            FullName = fullName,
            Email = email,
            Password = password,
            Department = department,
            Designation = designation,
            DateOfJoining = joiningDate ?? new DateTime(2024, 1, 15)
        };
    }

    private LoginRequestDto CreateLoginRequest(string email = "john@example.com",string password = "Password123")
    {
        return new LoginRequestDto
        {
            Email = email,
            Password = password
        };
    }
    private User CreateUser(int id = 1,string fullName = "John Doe",string email = "john@example.com",string password = "Password123",bool isAdmin = false)
    {
        return new User
        {
            Id = id,
            FullName = fullName,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            IsAdmin = isAdmin
        };
    }

    // Positive Test - Registers user successfully
    [Fact]
    public async Task Register_ShouldReturnOk_WhenRegistrationIsSuccessful()
    {
        // Arrange
        var request = CreateRegisterRequest();
        _employeeServiceMock.Setup(s => s.CreateEmployeeAsync(It.IsAny<CreateEmployeeDto>())).ReturnsAsync(new EmployeeDto
            {
                Id = 1,
                UserId = 1,
                Department = request.Department,
                Designation = request.Designation,
                JoiningDate = request.DateOfJoining
            });
        // Act
        var result = await _controller.Register(request);
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("User registered successfully",okResult.Value);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email,TestContext.Current.CancellationToken);
        Assert.NotNull(user);
        Assert.Equal(request.FullName, user!.FullName);
        Assert.Equal(request.Email, user.Email);
        Assert.False(user.IsAdmin);
        _employeeServiceMock.Verify(s => s.CreateEmployeeAsync(It.Is<CreateEmployeeDto>(e =>e.UserId == user.Id &&e.Department == request.Department &&e.Designation == request.Designation &&e.JoiningDate == request.DateOfJoining)),Times.Once);
    }

    // Negative Test - Returns BadRequest when user already exists
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenUserAlreadyExists()
    {
        // Arrange
        var request = CreateRegisterRequest();
        _context.Users.Add(CreateUser(email: request.Email));
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);
        // Act
        var result = await _controller.Register(request);
        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("User already exists",badRequestResult.Value);
        _employeeServiceMock.Verify(s => s.CreateEmployeeAsync(It.IsAny<CreateEmployeeDto>()),Times.Never);
    }

    // Positive Test - Returns Ok when credentials are valid
    [Fact]
    public async Task Login_ShouldReturnOk_WhenCredentialsAreValid()
    {
        // Arrange
        var request = CreateLoginRequest();
        var user = CreateUser(fullName: "John Doe",email: request.Email,password: request.Password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);
        _jwtServiceMock.Setup(s => s.GenerateToken(It.IsAny<User>())).Returns("fake-jwt-token");
        // Act
        var result = await _controller.Login(request);
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
        _jwtServiceMock.Verify(s => s.GenerateToken(It.Is<User>(u => u.Id == user.Id)),Times.Once);
    }

    // Negative Test - Returns Unauthorized when credentials are invalid
    [Fact]
    public async Task Login_ShouldReturnUnauthorized_WhenCredentialsAreInvalid()
    {
        // Arrange
        var request = CreateLoginRequest();
        // Act
        var result = await _controller.Login(request);
        // Assert
        var unauthorizedResult =Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal("Invalid credentials",unauthorizedResult.Value);
        _jwtServiceMock.Verify(s => s.GenerateToken(It.IsAny<User>()),Times.Never);
    }

    // Positive Test - Returns Ok when user logs out
    [Fact]
    public void Logout_ShouldReturnOk()
    {
        // Arrange
        // Act
        var result = _controller.Logout();
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("User logged out successfully",okResult.Value);
    } 
}
