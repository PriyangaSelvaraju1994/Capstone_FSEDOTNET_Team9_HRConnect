using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HRConnect.API.Controllers;
using HRConnect.API.Data;
using HRConnect.API.DTOs;
using HRConnect.API.DTOs.Employee;
using HRConnect.API.Entities;
using HRConnect.API.Services.Interfaces;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace HRConnect.Tests.Controllers;
public class AuthControllerTests : IDisposable
{
    private readonly Mock<IJwtService> _mockJwtService;
    private readonly Mock<IEmployeeService> _mockEmployeeService;
    private readonly Mock<ITokenRevocationService> _mockTokenRevocationService;
    private readonly ApplicationDbContext _context;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        // Setup InMemory Database
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _mockJwtService = new Mock<IJwtService>();
        _mockEmployeeService = new Mock<IEmployeeService>();
        _mockTokenRevocationService = new Mock<ITokenRevocationService>();
        _controller = new AuthController(
            _mockJwtService.Object,
            _context,
            _mockEmployeeService.Object,
            _mockTokenRevocationService.Object);
    }

    #region Register Tests

    [Fact]
    public async Task Register_WithNewUser_ReturnsOk()
    {
        // Arrange
        var request = new RegisterRequestDto
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Password = "Password123!",
            Department = "IT",
            Designation = "Developer",
            DateOfJoining = DateTime.Now
        };

        _mockEmployeeService
            .Setup(x => x.CreateEmployeeAsync(It.IsAny<CreateEmployeeDto>()))
            .ReturnsAsync(new EmployeeDto());
        // Act
        var result = await _controller.Register(request);
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("User registered successfully", okResult.Value);
        // Verify user was added to database
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        Assert.NotNull(user);
        Assert.Equal(request.FullName, user.FullName);
        Assert.False(user.IsAdmin);
        Assert.True(BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash));
        // Verify employee creation was called
        _mockEmployeeService.Verify(x => x.CreateEmployeeAsync(It.Is<CreateEmployeeDto>(
            e => e.UserId == user.Id &&
                 e.IsActive == false
        )), Times.Once);
    }

    //[Fact]
    //public async Task Register_WithExistingEmail_ReturnsBadRequest()
    //{
    //    // Arrange
    //    var existingUser = new User
    //    {
    //        FullName = "Existing User",
    //        Email = "existing@example.com",
    //        PasswordHash = "hashedpassword",
    //        IsAdmin = false
    //    };
    //    _context.Users.Add(existingUser);
    //    await _context.SaveChangesAsync();

    //    var request = new RegisterRequestDto
    //    {
    //        FullName = "John Doe",
    //        Email = "existing@example.com",
    //        Password = "Password123!",
    //        Department = "IT",
    //        Designation = "Developer",
    //        DateOfJoining = DateTime.Now
    //    };

    //    // Act
    //    var result = await _controller.Register(request);
    //    // Assert
    //    var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
    //    Assert.Equal("User already exists", badRequestResult.Value);
    //    // Verify employee service was never called
    //    _mockEmployeeService.Verify(
    //        x => x.CreateEmployeeAsync(It.IsAny<CreateEmployeeDto>()),
    //        Times.Never);
    //}
    #endregion
    #region Login Tests

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkWithToken()
    {
        // Arrange
        var password = "Password123!";
        var user = new User
        {
            Id = 1,
            FullName = "John Doe",
            Email = "john@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            IsAdmin = false
        };
        _context.Users.Add(user);

        var employee = new Employee
        {
            UserId = user.Id,
            Department = "IT",
            Designation = "Developer",
            JoiningDate = DateTime.Now,
            IsActive = true
        };
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();
        var request = new LoginRequestDto
        {
            Email = "john@example.com",
            Password = password
        };
        _mockJwtService
            .Setup(x => x.GenerateToken(It.IsAny<User>()))
            .Returns("generated-jwt-token");
        // Act
        var result = await _controller.Login(request);
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);

        // Use reflection to access anonymous type properties
        var valueType = okResult.Value.GetType();
        var httpResponseCode = valueType.GetProperty("httpResponseCode")?.GetValue(okResult.Value);
        var resultStatus = valueType.GetProperty("resultStatus")?.GetValue(okResult.Value);
        var resultSet = valueType.GetProperty("resultSet")?.GetValue(okResult.Value);
        Assert.Equal(200, httpResponseCode);
        Assert.Equal("User logged in successfully", resultStatus);
        var resultSetType = resultSet?.GetType();
        var userId = resultSetType?.GetProperty("userId")?.GetValue(resultSet);
        var name = resultSetType?.GetProperty("name")?.GetValue(resultSet);
        var isAdmin = resultSetType?.GetProperty("isAdmin")?.GetValue(resultSet);
        var token = resultSetType?.GetProperty("token")?.GetValue(resultSet);

        Assert.Equal(user.Id, userId);
        Assert.Equal(user.FullName, name);
        Assert.Equal(user.IsAdmin, isAdmin);
        Assert.Equal("generated-jwt-token", token);

        _mockJwtService.Verify(x => x.GenerateToken(It.Is<User>(u => u.Id == user.Id)), Times.Once);
    }

    [Fact]
    public async Task Login_WithInvalidEmail_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequestDto
        {
            Email = "nonexistent@example.com",
            Password = "Password123!"
        };
        // Act
        var result = await _controller.Login(request);
        // Assert
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal("Invalid credentials", unauthorizedResult.Value);

        _mockJwtService.Verify(x => x.GenerateToken(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task Login_WithInactiveEmployee_ReturnsUnauthorized()
    {
        // Arrange
        var password = "Password123!";
        var user = new User
        {
            Id = 1,
            FullName = "John Doe",
            Email = "john@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            IsAdmin = false
        };
        _context.Users.Add(user);
        var employee = new Employee
        {
            UserId = user.Id,
            Department = "IT",
            Designation = "Developer",
            JoiningDate = DateTime.Now,
            IsActive = false // Inactive employee
        };
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();
        var request = new LoginRequestDto
        {
            Email = "john@example.com",
            Password = password
        };
        // Act
        var result = await _controller.Login(request);
        // Assert
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal("User is not active. Please contact HR for activation.", unauthorizedResult.Value);
        _mockJwtService.Verify(x => x.GenerateToken(It.IsAny<User>()), Times.Never);
    }

    #endregion
    #region Logout Tests
    [Fact]
    public void Logout_WithValidToken_ReturnsOkAndRevokesToken()
    {
        // Arrange
        var userId = "123";
        var email = "test@example.com";
        var jti = "unique-token-id";
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Email, email),
            new Claim("jti", jti)
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
        // Act
        var result = _controller.Logout();
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
        // Use reflection to access anonymous type properties
        var valueType = okResult.Value.GetType();
        var httpResponseCode = valueType.GetProperty("httpResponseCode")?.GetValue(okResult.Value);
        var resultStatus = valueType.GetProperty("resultStatus")?.GetValue(okResult.Value);
        var resultSet = valueType.GetProperty("resultSet")?.GetValue(okResult.Value);

        Assert.Equal(200, httpResponseCode);
        Assert.Equal("success", resultStatus);

        var resultSetType = resultSet?.GetType();
        var message = resultSetType?.GetProperty("message")?.GetValue(resultSet);
        var userIdResult = resultSetType?.GetProperty("userId")?.GetValue(resultSet);
        var emailResult = resultSetType?.GetProperty("email")?.GetValue(resultSet);
        var tokenRevoked = resultSetType?.GetProperty("tokenRevoked")?.GetValue(resultSet);

        Assert.Equal("User logged out successfully. Token has been revoked on the server.", message);
        Assert.Equal(userId, userIdResult);
        Assert.Equal(email, emailResult);
        Assert.Equal(true, tokenRevoked);
        // Verify token was revoked
        _mockTokenRevocationService.Verify(x => x.RevokeToken(jti), Times.Once);
    }
    #endregion
    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}