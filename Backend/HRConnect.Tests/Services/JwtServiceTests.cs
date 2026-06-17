using HRConnect.API.Entities;
using HRConnect.API.Services.Implementations;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Xunit;
namespace HRConnect.Tests.Services;
public class JwtServiceTests
{
    private readonly JwtService _service;
    public JwtServiceTests()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "Jwt:Key", "ThisIsASecretKeyForUnitTesting123456789" },
                { "Jwt:Issuer", "HRConnect" },
                { "Jwt:Audience", "HRConnectUsers" }
            })
            .Build();
        _service = new JwtService(configuration);
    }
    private User CreateUser(int id = 1,string fullName = "John Doe",bool isAdmin = false)
    {
        return new User
        {
            Id = id,
            FullName = fullName,
            Email = "john@test.com",
            PasswordHash = "hash",
            IsAdmin = isAdmin
        };
    }

    // Positive Test - Generates JWT token successfully
    [Fact]
    public void GenerateToken_ShouldReturnToken_WhenUserIsValid()
    {
        // Arrange
        var user = CreateUser();
        // Act
        var token = _service.GenerateToken(user);
        // Assert
        Assert.False(string.IsNullOrWhiteSpace(token));
        var handler = new JwtSecurityTokenHandler();
        Assert.True(handler.CanReadToken(token));
    }
    
    // Positive Test - Generates token with correct claims
    [Fact]
    public void GenerateToken_ShouldContainCorrectClaims_WhenEmployeeUserIsProvided()
    {
        // Arrange
        var user = CreateUser(id: 100,fullName: "John Doe");
        // Act
        var token = _service.GenerateToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        // Assert
        Assert.Equal("100",jwt.Claims.First(c =>c.Type == ClaimTypes.NameIdentifier).Value);
        Assert.Equal("John Doe",jwt.Claims.First(c =>c.Type == ClaimTypes.Name).Value);
        Assert.Equal("Employee",jwt.Claims.First(c =>c.Type == ClaimTypes.Role).Value);
    }

    // Positive Test - Generates Admin role claim
    [Fact]
    public void GenerateToken_ShouldContainAdminRole_WhenUserIsAdmin()
    {
        // Arrange
        var user = CreateUser(isAdmin: true);
        // Act
        var token = _service.GenerateToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        // Assert
        Assert.Equal("Admin",jwt.Claims.First(c =>c.Type == ClaimTypes.Role).Value);
    }
}