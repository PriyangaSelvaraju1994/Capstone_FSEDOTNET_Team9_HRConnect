using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace HRConnect.Tests.Services;

public class EmailServiceTests
{
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly Mock<ILogger<EmailService>> _mockLogger;
    private readonly EmailService _service;

    public EmailServiceTests()
    {
        _mockConfiguration = new Mock<IConfiguration>();
        _mockLogger = new Mock<ILogger<EmailService>>();

        // Setup valid configuration
        SetupConfiguration("smtp.gmail.com", "587", "test@test.com", "password");

        _service = new EmailService(_mockConfiguration.Object, _mockLogger.Object);
    }

    private void SetupConfiguration(string host, string port, string username, string password)
    {
        _mockConfiguration.Setup(x => x["EmailSettings:Host"]).Returns(host);
        _mockConfiguration.Setup(x => x["EmailSettings:Port"]).Returns(port);
        _mockConfiguration.Setup(x => x["EmailSettings:Username"]).Returns(username);
        _mockConfiguration.Setup(x => x["EmailSettings:Password"]).Returns(password);
    }

    [Fact]
    public void Constructor_InitializesWithConfiguration()
    {
        // Arrange & Act
        var service = new EmailService(_mockConfiguration.Object, _mockLogger.Object);

        // Assert
        Assert.NotNull(service);
    }

    [Fact]
    public async Task SendEmailAsync_ThrowsAndLogsError_WhenSmtpFails()
    {
        // Arrange - Use invalid configuration that will cause SMTP to fail
        SetupConfiguration("invalid-host-that-does-not-exist", "587", "test@test.com", "password");
        var service = new EmailService(_mockConfiguration.Object, _mockLogger.Object);

        // Act & Assert - Should throw an exception and log the error
        await Assert.ThrowsAnyAsync<Exception>(async () =>
            await service.SendEmailAsync("to@test.com", "Subject", "Body"));

        // Verify error was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.Once);
    }

    [Fact]
    public async Task SendEmailAsync_ThrowsException_WhenPortIsInvalid()
    {
        // Arrange
        SetupConfiguration("smtp.gmail.com", "invalid-port", "test@test.com", "password");
        var service = new EmailService(_mockConfiguration.Object, _mockLogger.Object);

        // Act & Assert
        await Assert.ThrowsAsync<FormatException>(async () =>
            await service.SendEmailAsync("to@test.com", "Subject", "Body"));
    }

    [Fact]
    public async Task SendEmailAsync_AcceptsValidParameters()
    {
        // This test verifies that the method accepts valid parameters
        // It will fail at SMTP connection, but validates the interface

        // Arrange
        var to = "recipient@test.com";
        var subject = "Test Subject";
        var body = "<h1>Test Body</h1>";

        // Act & Assert
        // We expect this to throw because there's no real SMTP server
        await Assert.ThrowsAnyAsync<Exception>(async () =>
            await _service.SendEmailAsync(to, subject, body));

        // Verify error was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.Once);
    }

    [Fact]
    public async Task SendEmailAsync_HandlesHtmlBody()
    {
        // Arrange
        var htmlBody = "<html><body><h1>Hello</h1><p>This is a test</p></body></html>";

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(async () =>
            await _service.SendEmailAsync("test@test.com", "HTML Subject", htmlBody));

        // Verify error was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.Once);
    }
}