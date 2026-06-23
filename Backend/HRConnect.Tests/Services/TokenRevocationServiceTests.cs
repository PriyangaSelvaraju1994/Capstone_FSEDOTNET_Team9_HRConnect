using Xunit;
using HRConnect.API.Services.Implementations;
using System.Reflection;

namespace HRConnect.Tests.Services;

public class TokenRevocationServiceTests
{
    [Fact]
    public void RevokeToken_WithValidJti_AddsTokenToRevokedList()
    {
        // Arrange
        var service = new TokenRevocationService();
        var jti = "test-token-123";

        // Act
        service.RevokeToken(jti);

        // Assert
        Assert.True(service.IsTokenRevoked(jti));
    }

    [Fact]
    public void RevokeToken_WithNullJti_DoesNotThrowException()
    {
        // Arrange
        var service = new TokenRevocationService();

        // Act & Assert
        var exception = Record.Exception(() => service.RevokeToken(null!));
        Assert.Null(exception);
    }

    [Fact]
    public void IsTokenRevoked_WithRevokedToken_ReturnsTrue()
    {
        // Arrange
        var service = new TokenRevocationService();
        var jti = "revoked-token";
        service.RevokeToken(jti);

        // Act
        var isRevoked = service.IsTokenRevoked(jti);

        // Assert
        Assert.True(isRevoked);
    }

    [Fact]
    public void IsTokenRevoked_WithNonRevokedToken_ReturnsFalse()
    {
        // Arrange
        var service = new TokenRevocationService();
        var jti = "valid-token";

        // Act
        var isRevoked = service.IsTokenRevoked(jti);

        // Assert
        Assert.False(isRevoked);
    }

    [Fact]
    public void IsTokenRevoked_WithNullJti_ReturnsFalse()
    {
        // Arrange
        var service = new TokenRevocationService();

        // Act
        var isRevoked = service.IsTokenRevoked(null!);

        // Assert
        Assert.False(isRevoked);
    }

    [Fact]
    public void RevokeToken_MultipleTimes_OnlyAddsOnce()
    {
        // Arrange
        var service = new TokenRevocationService();
        var jti = "duplicate-token";

        // Act
        service.RevokeToken(jti);
        service.RevokeToken(jti);
        service.RevokeToken(jti);

        // Assert
        Assert.True(service.IsTokenRevoked(jti));
    }

    [Fact]
    public void RevokeToken_MultipleTokens_AllAreRevoked()
    {
        // Arrange
        var service = new TokenRevocationService();
        var jti1 = "token-1";
        var jti2 = "token-2";
        var jti3 = "token-3";

        // Act
        service.RevokeToken(jti1);
        service.RevokeToken(jti2);
        service.RevokeToken(jti3);

        // Assert
        Assert.True(service.IsTokenRevoked(jti1));
        Assert.True(service.IsTokenRevoked(jti2));
        Assert.True(service.IsTokenRevoked(jti3));
    }

    [Fact]
    public void ClearExpiredTokens_WithNoTokens_DoesNotThrowException()
    {
        // Arrange
        var service = new TokenRevocationService();

        // Act & Assert
        var exception = Record.Exception(() => service.ClearExpiredTokens());
        Assert.Null(exception);
    }

    [Fact]
    public void ClearExpiredTokens_RemovesExpiredTokensUsingReflection()
    {
        // Arrange
        var service = new TokenRevocationService();
        var jti = "expired-token";

        // Use reflection to add an expired token
        var revokedTokensField = typeof(TokenRevocationService)
            .GetField("_revokedTokens", BindingFlags.NonPublic | BindingFlags.Instance);
        var revokedTokensWithExpiryField = typeof(TokenRevocationService)
            .GetField("_revokedTokensWithExpiry", BindingFlags.NonPublic | BindingFlags.Instance);

        var revokedTokens = revokedTokensField?.GetValue(service) as HashSet<string>;
        var revokedTokensWithExpiry = revokedTokensWithExpiryField?.GetValue(service) as Dictionary<string, DateTime>;

        // Add an expired token manually
        revokedTokens?.Add(jti);
        revokedTokensWithExpiry?.Add(jti, DateTime.UtcNow.AddHours(-3)); // Expired 3 hours ago

        // Act
        service.ClearExpiredTokens();

        // Assert - Expired token should be removed
        Assert.False(service.IsTokenRevoked(jti));
    }

    //[Fact]
    //public void IsTokenRevoked_AutomaticallyClearsExpiredTokens()
    //{
    //    // Arrange
    //    var service = new TokenRevocationService();
    //    var activeJti = "active-token";
    //    var expiredJti = "expired-token";

    //    // Add active token normally
    //    service.RevokeToken(activeJti);

    //    // Use reflection to add an expired token
    //    var revokedTokensField = typeof(TokenRevocationService)
    //        .GetField("_revokedTokens", BindingFlags.NonPublic | BindingFlags.Instance);
    //    var revokedTokensWithExpiryField = typeof(TokenRevocationService)
    //        .GetField("_revokedTokensWithExpiry", BindingFlags.NonPublic | BindingFlags.Instance);

    //    var revokedTokens = revokedTokensField?.GetValue(service) as HashSet<string>;
    //    var revokedTokensWithExpiry = revokedTokensWithExpiryField?.GetValue(service) as Dictionary<string, DateTime>;

    //    revokedTokens?.Add(expiredJti);
    //    revokedTokensWithExpiry?.Add(expiredJti, DateTime.UtcNow.AddHours(-3)); // Expired

    //    // Act - Checking triggers cleanup
    //    var isActiveRevoked = service.IsTokenRevoked(activeJti);
    //    var isExpiredRevoked = service.IsTokenRevoked(expiredJti);

    //    // Assert
    //    Assert.True(isActiveRevoked); // Active token still exists
    //    Assert.False(isExpiredRevoked); // Expired token was cleaned up
    //}

    //[Fact]
    //public async Task TokenRevocationService_IsThreadSafe()
    //{
    //    // Arrange
    //    var service = new TokenRevocationService();
    //    var tasks = new List<Task>();
    //    var tokenCount = 100;

    //    // Act - Revoke tokens from multiple threads
    //    for (int i = 0; i < tokenCount; i++)
    //    {
    //        var jti = $"token-{i}";
    //        tasks.Add(Task.Run(() => service.RevokeToken(jti)));
    //    }

    //    await Task.WhenAll(tasks);

    //    // Assert - All tokens should be revoked
    //    for (int i = 0; i < tokenCount; i++)
    //    {
    //        var jti = $"token-{i}";
    //        Assert.True(service.IsTokenRevoked(jti));
    //    }
    //}
}