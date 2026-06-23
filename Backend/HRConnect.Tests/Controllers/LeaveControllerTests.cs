using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using HRConnect.API.Controllers;
using HRConnect.API.Services.Interfaces;
using HRConnect.API.DTOs;

namespace HRConnect.Tests.Controllers;
public class LeaveControllerTests
{
    private readonly Mock<ILeaveService> _mockLeaveService;
    private readonly LeaveController _controller;
    public LeaveControllerTests()
    {
        _mockLeaveService = new Mock<ILeaveService>();
        _controller = new LeaveController(_mockLeaveService.Object);
    }

    #region ApplyLeave Tests

    [Fact]
    public async Task ApplyLeave_WithValidRequest_ReturnsOkWithSuccessMessage()
    {
        // Arrange
        var request = new CreateLeaveRequestDto
        {
            EmployeeId = 1,
            LeaveType = "Casual",
            StartDate = DateTime.Today.AddDays(1),
            EndDate = DateTime.Today.AddDays(3),
            Reason = "Personal work",
            CreatedBy = "test@example.com"
        };

        _mockLeaveService
            .Setup(x => x.ApplyLeaveAsync(request))
            .ReturnsAsync("Leave request submitted successfully");

        // Act
        var result = await _controller.ApplyLeave(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Leave request submitted successfully", okResult.Value);

        _mockLeaveService.Verify(x => x.ApplyLeaveAsync(request), Times.Once);
    }

    #endregion

    #region GetMyLeaves Tests

    [Fact]
    public async Task GetMyLeaves_WithValidEmployeeId_ReturnsOkWithLeaves()
    {
        // Arrange
        var employeeId = 1;
        var leaves = new List<LeaveRequestDto>
        {
            new LeaveRequestDto
            {
                Id = 1,
                EmployeeId = employeeId,
                LeaveType = "Casual",
                StartDate = DateTime.Today,
                EndDate = DateTime.Today.AddDays(2),
                Status = "Pending",
                Reason = "Personal"
            },
            new LeaveRequestDto
            {
                Id = 2,
                EmployeeId = employeeId,
                LeaveType = "Sick",
                StartDate = DateTime.Today.AddDays(10),
                EndDate = DateTime.Today.AddDays(12),
                Status = "Approved",
                Reason = "Medical"
            }
        };

        _mockLeaveService
            .Setup(x => x.GetMyLeavesAsync(employeeId))
            .ReturnsAsync(leaves);

        // Act
        var result = await _controller.GetMyLeaves(employeeId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedLeaves = Assert.IsAssignableFrom<IEnumerable<LeaveRequestDto>>(okResult.Value);
        Assert.Equal(2, returnedLeaves.Count());

        _mockLeaveService.Verify(x => x.GetMyLeavesAsync(employeeId), Times.Once);
    }

    #endregion

    #region UpdateStatus Tests

    [Fact]
    public async Task UpdateStatus_WithValidRequest_ReturnsOkWithSuccessMessage()
    {
        // Arrange
        var leaveId = 1;
        var request = new UpdateLeaveStatusDto
        {
            Status = "Approved",
            UpdatedBy = "admin@example.com",
            UpdatedDate = DateTime.UtcNow
        };

        _mockLeaveService
            .Setup(x => x.UpdateStatusAsync(leaveId, request))
            .ReturnsAsync("Leave status updated successfully");

        // Act
        var result = await _controller.UpdateStatus(leaveId, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Leave status updated successfully", okResult.Value);

        _mockLeaveService.Verify(x => x.UpdateStatusAsync(leaveId, request), Times.Once);
    }

    #endregion

    #region GetLeaveBalance Tests

    [Fact]
    public async Task GetLeaveBalance_WithValidEmployeeId_ReturnsOkWithBalances()
    {
        // Arrange
        var employeeId = 1;
        var balances = new List<LeaveBalanceDto>
        {
            new LeaveBalanceDto
            {
                EmployeeId = employeeId,
                LeaveType = "Casual",
                TotalDays = 12,
                UsedDays = 3,
                RemainingDays = 9
            },
            new LeaveBalanceDto
            {
                EmployeeId = employeeId,
                LeaveType = "Sick",
                TotalDays = 10,
                UsedDays = 2,
                RemainingDays = 8
            }
        };

        _mockLeaveService
            .Setup(x => x.GetLeaveBalanceAsync(employeeId))
            .ReturnsAsync(balances);

        // Act
        var result = await _controller.GetLeaveBalance(employeeId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedBalances = Assert.IsAssignableFrom<IEnumerable<LeaveBalanceDto>>(okResult.Value);
        Assert.Equal(2, returnedBalances.Count());

        _mockLeaveService.Verify(x => x.GetLeaveBalanceAsync(employeeId), Times.Once);
    }

    #endregion

    #region CancelLeave Tests

    [Fact]
    public async Task CancelLeave_WithValidId_ReturnsOkWithSuccessMessage()
    {
        // Arrange
        var leaveId = 1;

        _mockLeaveService
            .Setup(x => x.CancelLeaveAsync(leaveId))
            .ReturnsAsync("Leave request cancelled successfully");

        // Act
        var result = await _controller.CancelLeave(leaveId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Leave request cancelled successfully", okResult.Value);

        _mockLeaveService.Verify(x => x.CancelLeaveAsync(leaveId), Times.Once);
    }

    #endregion

    #region GetAllLeaves Tests

    [Fact]
    public async Task GetAllLeaves_ReturnsOkWithAllLeaves()
    {
        // Arrange
        var leaves = new List<LeaveRequestDto>
        {
            new LeaveRequestDto
            {
                Id = 1,
                EmployeeId = 1,
                EmployeeName = "John Doe",
                LeaveType = "Casual",
                StartDate = DateTime.Today,
                EndDate = DateTime.Today.AddDays(2),
                Status = "Pending",
                Reason = "Personal"
            },
            new LeaveRequestDto
            {
                Id = 2,
                EmployeeId = 2,
                EmployeeName = "Jane Smith",
                LeaveType = "Sick",
                StartDate = DateTime.Today.AddDays(5),
                EndDate = DateTime.Today.AddDays(7),
                Status = "Approved",
                Reason = "Medical"
            }
        };

        _mockLeaveService
            .Setup(x => x.GetAllLeavesAsync())
            .ReturnsAsync(leaves);

        // Act
        var result = await _controller.GetAllLeaves();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedLeaves = Assert.IsAssignableFrom<IEnumerable<LeaveRequestDto>>(okResult.Value);
        Assert.Equal(2, returnedLeaves.Count());

        _mockLeaveService.Verify(x => x.GetAllLeavesAsync(), Times.Once);
    }
    #endregion
}