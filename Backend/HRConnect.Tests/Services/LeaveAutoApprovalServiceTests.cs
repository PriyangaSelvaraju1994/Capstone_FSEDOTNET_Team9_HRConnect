using HRConnect.API.Data;
using HRConnect.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace HRConnect.Tests.Services;

public class LeaveAutoApprovalServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly Mock<ILogger<LeaveAutoApprovalService>> _mockLogger;
    private readonly IServiceProvider _serviceProvider;
    private readonly LeaveAutoApprovalService _service;

    public LeaveAutoApprovalServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);

        _mockEmailService = new Mock<IEmailService>();
        _mockLogger = new Mock<ILogger<LeaveAutoApprovalService>>();

        // Setup service provider
        var services = new ServiceCollection();
        services.AddSingleton(_context);
        services.AddSingleton(_mockEmailService.Object);
        _serviceProvider = services.BuildServiceProvider();

        // Create service scope factory
        var scopeFactory = _serviceProvider.GetRequiredService<IServiceScopeFactory>();

        _service = new LeaveAutoApprovalService(scopeFactory, _mockLogger.Object);
    }

    [Fact]
    public void Constructor_InitializesCorrectly()
    {
        // Arrange
        var scopeFactory = _serviceProvider.GetRequiredService<IServiceScopeFactory>();

        // Act
        var service = new LeaveAutoApprovalService(scopeFactory, _mockLogger.Object);

        // Assert
        Assert.NotNull(service);
    }

    [Fact]
    public async Task AutoApproveLeaves_ApprovesOldPendingLeaves()
    {
        // Arrange
        var cancellationTokenSource = new CancellationTokenSource();
        var token = cancellationTokenSource.Token;

        // Add a pending leave older than 72 hours
        _context.LeaveRequests.Add(new LeaveRequest
        {
            Id = 1,
            EmployeeId = 1,
            LeaveType = "Casual",
            StartDate = DateTime.Today.AddDays(5),
            EndDate = DateTime.Today.AddDays(7),
            Status = "Pending",
            Reason = "Test",
            CreatedDate = DateTime.UtcNow.AddHours(-73) // 73 hours ago
        });
        await _context.SaveChangesAsync(token);

        // Act
        var method = typeof(LeaveAutoApprovalService)
            .GetMethod("AutoApproveLeaves", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

        await (Task)method!.Invoke(_service, new object[] { token })!;

        // Assert
        var leave = await _context.LeaveRequests.FindAsync(1);
        Assert.Equal("Approved", leave!.Status);
        Assert.Equal("System", leave.UpdatedBy);
        Assert.True(leave.IsAutoApproved);
        Assert.NotNull(leave.UpdatedDate);
    }

    [Fact]
    public async Task AutoApproveLeaves_DoesNotApproveRecentPendingLeaves()
    {
        // Arrange
        var cancellationTokenSource = new CancellationTokenSource();
        var token = cancellationTokenSource.Token;

        // Add a recent pending leave (less than 72 hours)
        _context.LeaveRequests.Add(new LeaveRequest
        {
            Id = 1,
            EmployeeId = 1,
            LeaveType = "Casual",
            StartDate = DateTime.Today.AddDays(5),
            EndDate = DateTime.Today.AddDays(7),
            Status = "Pending",
            Reason = "Test",
            CreatedDate = DateTime.UtcNow.AddHours(-50) // Only 50 hours ago
        });
        await _context.SaveChangesAsync(token);

        // Act
        var method = typeof(LeaveAutoApprovalService)
            .GetMethod("AutoApproveLeaves", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

        await (Task)method!.Invoke(_service, new object[] { token })!;

        // Assert
        var leave = await _context.LeaveRequests.FindAsync(1);
        Assert.Equal("Pending", leave!.Status); // Should remain Pending
        Assert.False(leave.IsAutoApproved);
    }

    [Fact]
    public async Task AutoApproveLeaves_ApprovesMultipleOldPendingLeaves()
    {
        // Arrange
        var cancellationTokenSource = new CancellationTokenSource();
        var token = cancellationTokenSource.Token;

        // Add multiple old pending leaves
        _context.LeaveRequests.AddRange(
            new LeaveRequest
            {
                Id = 1,
                EmployeeId = 1,
                LeaveType = "Casual",
                StartDate = DateTime.Today.AddDays(5),
                EndDate = DateTime.Today.AddDays(7),
                Status = "Pending",
                Reason = "Test 1",
                CreatedDate = DateTime.UtcNow.AddHours(-100)
            },
            new LeaveRequest
            {
                Id = 2,
                EmployeeId = 2,
                LeaveType = "Sick",
                StartDate = DateTime.Today.AddDays(10),
                EndDate = DateTime.Today.AddDays(12),
                Status = "Pending",
                Reason = "Test 2",
                CreatedDate = DateTime.UtcNow.AddHours(-80)
            }
        );
        await _context.SaveChangesAsync(token);

        // Act
        var method = typeof(LeaveAutoApprovalService)
            .GetMethod("AutoApproveLeaves", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

        await (Task)method!.Invoke(_service, new object[] { token })!;

        // Assert
        var leaves = await _context.LeaveRequests.ToListAsync(token);
        Assert.All(leaves, leave =>
        {
            Assert.Equal("Approved", leave.Status);
            Assert.Equal("System", leave.UpdatedBy);
            Assert.True(leave.IsAutoApproved);
        });
    }

    [Fact]
    public async Task AutoApproveLeaves_LogsInformation_WhenLeavesAreAutoApproved()
    {
        // Arrange
        var cancellationTokenSource = new CancellationTokenSource();
        var token = cancellationTokenSource.Token;

        _context.LeaveRequests.Add(new LeaveRequest
        {
            Id = 1,
            EmployeeId = 1,
            LeaveType = "Casual",
            StartDate = DateTime.Today.AddDays(5),
            EndDate = DateTime.Today.AddDays(7),
            Status = "Pending",
            Reason = "Test",
            CreatedDate = DateTime.UtcNow.AddHours(-100)
        });
        await _context.SaveChangesAsync(token);

        // Act
        var method = typeof(LeaveAutoApprovalService)
            .GetMethod("AutoApproveLeaves", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

        await (Task)method!.Invoke(_service, new object[] { token })!;

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("auto-approved")),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
            Times.Once);
    }

    //[Fact]
    //public async Task ExecuteAsync_RunsContinuously_UntilCancelled()
    //{
    //    // Arrange
    //    var cancellationTokenSource = new CancellationTokenSource();

    //    // Cancel after a short delay to prevent infinite loop
    //    cancellationTokenSource.CancelAfter(TimeSpan.FromMilliseconds(100));

    //    // Act & Assert
    //    // ExecuteAsync should run until cancelled
    //    var executeTask = _service.StartAsync(cancellationTokenSource.Token);

    //    // Wait a bit for the service to start
    //    await Task.Delay(200);

    //    // Stop the service
    //    await _service.StopAsync(CancellationToken.None);

    //    Assert.True(executeTask.IsCompleted || cancellationTokenSource.IsCancellationRequested);
    //}

    //[Fact]
    //public async Task ExecuteAsync_CatchesAndLogsException()
    //{
    //    // Arrange
    //    // Create a corrupted service provider that will cause exceptions
    //    var badServices = new ServiceCollection();
    //    var badProvider = badServices.BuildServiceProvider();
    //    var badScopeFactory = badProvider.GetRequiredService<IServiceScopeFactory>();

    //    var badService = new LeaveAutoApprovalService(badScopeFactory, _mockLogger.Object);

    //    var cancellationTokenSource = new CancellationTokenSource();
    //    cancellationTokenSource.CancelAfter(TimeSpan.FromMilliseconds(200));

    //    // Act
    //    var startTask = badService.StartAsync(cancellationTokenSource.Token);
    //    await Task.Delay(300);
    //    await badService.StopAsync(CancellationToken.None);

    //    // Assert - Should log error when exception occurs
    //    _mockLogger.Verify(
    //        x => x.Log(
    //            LogLevel.Error,
    //            It.IsAny<EventId>(),
    //            It.Is<It.IsAnyType>((v, t) => true),
    //            It.IsAny<Exception>(),
    //            It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
    //        Times.AtLeastOnce);
    //}

    public void Dispose()
    {
        try
        {
            _context?.Database.EnsureDeleted();
            _context?.Dispose();
        }
        catch (ObjectDisposedException)
        {
        }
    }
}