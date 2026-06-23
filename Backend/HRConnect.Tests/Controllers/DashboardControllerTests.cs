using HRConnect.API.Controllers;
using HRConnect.API.DTOs.Dashboard;
using HRConnect.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace HRConnect.Tests.Controllers;

public class DashboardControllerTests
{
    private readonly Mock<IDashboardService> _mockDashboardService;
    private readonly DashboardController _controller;

    public DashboardControllerTests()
    {
        _mockDashboardService = new Mock<IDashboardService>();
        _controller = new DashboardController(_mockDashboardService.Object);
    }

    [Fact]
    public async Task GetDashboardSummary_ReturnsOkResult_WithSummaryData()
    {
        // Arrange
        var expectedSummary = new DashboardSummaryDto
        {
            PendingCount = 5,
            ApprovedThisMonth = 10,
            ActiveEmployees = 50,
            OnLeaveToday = 3
        };

        _mockDashboardService
            .Setup(x => x.GetDashboardSummaryAsync())
            .ReturnsAsync(expectedSummary);

        // Act
        var result = await _controller.GetDashboardSummary();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var actualSummary = Assert.IsType<DashboardSummaryDto>(okResult.Value);
        Assert.Equal(expectedSummary.PendingCount, actualSummary.PendingCount);
        Assert.Equal(expectedSummary.ApprovedThisMonth, actualSummary.ApprovedThisMonth);
        Assert.Equal(expectedSummary.ActiveEmployees, actualSummary.ActiveEmployees);
        Assert.Equal(expectedSummary.OnLeaveToday, actualSummary.OnLeaveToday);

        _mockDashboardService.Verify(x => x.GetDashboardSummaryAsync(), Times.Once);
    }

    [Fact]
    public async Task GetDashboardSummary_CallsServiceOnce()
    {
        // Arrange
        _mockDashboardService
            .Setup(x => x.GetDashboardSummaryAsync())
            .ReturnsAsync(new DashboardSummaryDto());

        // Act
        await _controller.GetDashboardSummary();

        // Assert
        _mockDashboardService.Verify(x => x.GetDashboardSummaryAsync(), Times.Once);
    }

    [Fact]
    public async Task GetRecentActivities_ReturnsOkResult_WithActivitiesList()
    {
        // Arrange
        var expectedActivities = new List<RecentActivityDto>
        {
            new RecentActivityDto
            {
                Id = 1,
                ActorId = 1,
                ActorName = "John Doe",
                ActorInitials = "JD",
                Action = "requested",
                LeaveType = "Casual",
                Days = 2,
                StartDate = DateTime.Today,
                EndDate = DateTime.Today.AddDays(1),
                OccurredAt = DateTime.UtcNow,
                Status = "Pending"
            },
            new RecentActivityDto
            {
                Id = 2,
                ActorId = 2,
                ActorName = "Jane Smith",
                ActorInitials = "JS",
                Action = "requested",
                LeaveType = "Sick",
                Days = 3,
                StartDate = DateTime.Today.AddDays(5),
                EndDate = DateTime.Today.AddDays(7),
                OccurredAt = DateTime.UtcNow.AddHours(-2),
                Status = "Approved"
            }
        };

        _mockDashboardService
            .Setup(x => x.GetRecentActivitiesAsync())
            .ReturnsAsync(expectedActivities);

        // Act
        var result = await _controller.GetRecentActivities();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var actualActivities = Assert.IsType<List<RecentActivityDto>>(okResult.Value);
        Assert.Equal(2, actualActivities.Count);
        Assert.Equal(expectedActivities[0].ActorName, actualActivities[0].ActorName);
        Assert.Equal(expectedActivities[1].LeaveType, actualActivities[1].LeaveType);

        _mockDashboardService.Verify(x => x.GetRecentActivitiesAsync(), Times.Once);
    }

    [Fact]
    public async Task GetRecentActivities_ReturnsEmptyList_WhenNoActivities()
    {
        // Arrange
        _mockDashboardService
            .Setup(x => x.GetRecentActivitiesAsync())
            .ReturnsAsync(new List<RecentActivityDto>());

        // Act
        var result = await _controller.GetRecentActivities();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var actualActivities = Assert.IsType<List<RecentActivityDto>>(okResult.Value);
        Assert.Empty(actualActivities);

        _mockDashboardService.Verify(x => x.GetRecentActivitiesAsync(), Times.Once);
    }

    [Fact]
    public async Task GetRecentActivities_CallsServiceOnce()
    {
        // Arrange
        _mockDashboardService
            .Setup(x => x.GetRecentActivitiesAsync())
            .ReturnsAsync(new List<RecentActivityDto>());

        // Act
        await _controller.GetRecentActivities();

        // Assert
        _mockDashboardService.Verify(x => x.GetRecentActivitiesAsync(), Times.Once);
    }
}