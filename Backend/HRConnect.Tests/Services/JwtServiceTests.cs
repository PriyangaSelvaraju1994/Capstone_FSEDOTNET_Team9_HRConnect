using Xunit;
using Moq;
using Microsoft.Extensions.Configuration;
using HRConnect.API.Services.Implementations;
using HRConnect.API.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace HRConnect.Tests.Services;

public class JwtServiceTests
{
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly JwtService _jwtService;
    private const string TestKey = "ThisIsAVerySecureSecretKeyForTestingPurposesOnly12345!";
    private const string TestIssuer = "TestIssuer";
    private const string TestAudience = "TestAudience";

    public JwtServiceTests()
    {
        _mockConfiguration = new Mock<IConfiguration>();

        // Setup configuration values
        _mockConfiguration.Setup(c => c["Jwt:Key"]).Returns(TestKey);
        _mockConfiguration.Setup(c => c["Jwt:Issuer"]).Returns(TestIssuer);
        _mockConfiguration.Setup(c => c["Jwt:Audience"]).Returns(TestAudience);

        _jwtService = new JwtService(_mockConfiguration.Object);
    }

    [Fact]
    public void GenerateToken_WithValidUser_ReturnsValidToken()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "John Doe",
            Email = "john@example.com",
            IsAdmin = false
        };

        // Act
        var token = _jwtService.GenerateToken(user);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);

        // Validate token structure
        var handler = new JwtSecurityTokenHandler();
        Assert.True(handler.CanReadToken(token));
    }

    [Fact]
    public void GenerateToken_WithAdminUser_ContainsAdminRole()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "Admin User",
            Email = "admin@example.com",
            IsAdmin = true
        };

        // Act
        var token = _jwtService.GenerateToken(user);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        var roleClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role);
        Assert.NotNull(roleClaim);
        Assert.Equal("Admin", roleClaim.Value);
    }

    [Fact]
    public void GenerateToken_WithEmployeeUser_ContainsEmployeeRole()
    {
        // Arrange
        var user = new User
        {
            Id = 2,
            FullName = "Employee User",
            Email = "employee@example.com",
            IsAdmin = false
        };

        // Act
        var token = _jwtService.GenerateToken(user);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        var roleClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role);
        Assert.NotNull(roleClaim);
        Assert.Equal("Employee", roleClaim.Value);
    }

    [Fact]
    public void GenerateToken_ContainsAllRequiredClaims()
    {
        // Arrange
        var user = new User
        {
            Id = 5,
            FullName = "Test User",
            Email = "test@example.com",
            IsAdmin = false
        };

        // Act
        var token = _jwtService.GenerateToken(user);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        // Check NameIdentifier claim
        var nameIdentifierClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        Assert.NotNull(nameIdentifierClaim);
        Assert.Equal(user.Id.ToString(), nameIdentifierClaim.Value);

        // Check Name claim
        var nameClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name);
        Assert.NotNull(nameClaim);
        Assert.Equal(user.FullName, nameClaim.Value);

        // Check Email claim
        var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email);
        Assert.NotNull(emailClaim);
        Assert.Equal(user.Email, emailClaim.Value);

        // Check Jti claim
        var jtiClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti);
        Assert.NotNull(jtiClaim);
        Assert.False(string.IsNullOrEmpty(jtiClaim.Value));
        Assert.True(Guid.TryParse(jtiClaim.Value, out _));
    }

    //[Fact]
    //public void GenerateToken_CanBeValidatedWithCorrectKey()
    //{
    //    // Arrange
    //    var user = new User
    //    {
    //        Id = 1,
    //        FullName = "Test User",
    //        Email = "test@example.com",
    //        IsAdmin = false
    //    };

    //    // Act
    //    var token = _jwtService.GenerateToken(user);

    //    // Assert - Try to validate the token
    //    var tokenHandler = new JwtSecurityTokenHandler();
    //    var validationParameters = new TokenValidationParameters
    //    {
    //        ValidateIssuerSigningKey = true,
    //        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestKey)),
    //        ValidateIssuer = true,
    //        ValidIssuer = TestIssuer,
    //        ValidateAudience = true,
    //        ValidAudience = TestAudience,
    //        ValidateLifetime = true,
    //        ClockSkew = TimeSpan.Zero
    //    };

    //    var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
    //    Assert.NotNull(principal);
    //    Assert.NotNull(validatedToken);
    //}
}