using HRConnect.API.Controllers;
using HRConnect.API.DTOs;
using HRConnect.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

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

    // Positive Test - Applies leave successfully
    [Fact]
    public async Task ApplyLeave_ShouldReturnOkResult_WhenLeaveAppliedSuccessfully()
    {
        // Arrange
        var request = new CreateLeaveRequestDto
        {
            EmployeeId = 1,
            LeaveType = "Casual",
            StartDate = new DateTime(2025, 8, 10),
            EndDate = new DateTime(2025, 8, 12),
            Reason = "Personal work"
        };

        var expectedMessage = "Leave request submitted successfully";
        _mockLeaveService.Setup(service => service.ApplyLeaveAsync(request)).ReturnsAsync(expectedMessage);

        // Act
        var result = await _controller.ApplyLeave(request);
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var message = Assert.IsType<string>(okResult.Value);
        Assert.Equal(expectedMessage, message);
        _mockLeaveService.Verify(service => service.ApplyLeaveAsync(request),Times.Once);
    }

    // Negative Test - Throws exception when leave application fails
    [Fact]
    public async Task ApplyLeave_ShouldThrowException_WhenLeaveApplicationFails()
    {
        // Arrange
        var request = new CreateLeaveRequestDto
        {
            EmployeeId = 1,
            LeaveType = "Casual",
            StartDate = new DateTime(2025, 8, 10),
            EndDate = new DateTime(2025, 8, 12),
            Reason = "Personal work"
        };
        _mockLeaveService.Setup(service => service.ApplyLeaveAsync(request)).ThrowsAsync(new InvalidOperationException("Insufficient leave balance"));
        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _controller.ApplyLeave(request));
        _mockLeaveService.Verify(service => service.ApplyLeaveAsync(request),Times.Once);
    }

    // Positive Test - Returns list of employee leaves successfully
    [Fact]
    public async Task GetMyLeaves_ShouldReturnOkResult_WithListOfLeaves()
    {
        // Arrange
        var employeeId = 1;

        var expectedLeaves = new List<LeaveRequestDto>
    {
        new LeaveRequestDto
        {
            Id = 1,
            EmployeeId = 1,
            EmployeeName = "John Doe",
            LeaveType = "Casual",
            StartDate = new DateTime(2025, 8, 10),
            EndDate = new DateTime(2025, 8, 12),
            Status = "Pending",
            Reason = "Personal work"
        },
        new LeaveRequestDto
        {
            Id = 2,
            EmployeeId = 1,
            EmployeeName = "John Doe",
            LeaveType = "Sick",
            StartDate = new DateTime(2025, 9, 5),
            EndDate = new DateTime(2025, 9, 7),
            Status = "Approved",
            Reason = "Medical appointment"
        }
    };

        _mockLeaveService.Setup(service => service.GetMyLeavesAsync(employeeId)).ReturnsAsync(expectedLeaves);
        // Act
        var result = await _controller.GetMyLeaves(employeeId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var leaves = Assert.IsAssignableFrom<IEnumerable<LeaveRequestDto>>(okResult.Value);

        Assert.Equal(expectedLeaves.Count, leaves.Count());
        _mockLeaveService.Verify(service => service.GetMyLeavesAsync(employeeId),Times.Once);
    }

    // Negative Test - Returns empty list when no leaves exist
    [Fact]
    public async Task GetMyLeaves_ShouldReturnEmptyList_WhenNoLeavesExist()
    {
        // Arrange
        var employeeId = 1;
        var emptyList = new List<LeaveRequestDto>();
        _mockLeaveService.Setup(service => service.GetMyLeavesAsync(employeeId)).ReturnsAsync(emptyList);

        // Act
        var result = await _controller.GetMyLeaves(employeeId);
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var leaves = Assert.IsAssignableFrom<IEnumerable<LeaveRequestDto>>(okResult.Value);
        Assert.Empty(leaves);
        _mockLeaveService.Verify(service => service.GetMyLeavesAsync(employeeId),Times.Once);
    }

    // Positive Test - Updates leave status successfully
    [Fact]
    public async Task UpdateStatus_ShouldReturnOkResult_WhenLeaveStatusUpdated()
    {
        // Arrange
        var leaveId = 1;
        var request = new UpdateLeaveStatusDto
        {
            Status = "Approved"
        };
        var expectedMessage = "Leave request approved successfully";
        _mockLeaveService.Setup(service => service.UpdateStatusAsync(leaveId, request)).ReturnsAsync(expectedMessage);
        // Act
        var result = await _controller.UpdateStatus(leaveId, request);
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var message = Assert.IsType<string>(okResult.Value);
        Assert.Equal(expectedMessage, message);
        _mockLeaveService.Verify(service => service.UpdateStatusAsync(leaveId, request),Times.Once);
    }

    // Negative Test - Throws exception when leave status update fails
    [Fact]
    public async Task UpdateStatus_ShouldThrowException_WhenLeaveStatusUpdateFails()
    {
        // Arrange
        var leaveId = 999;
        var request = new UpdateLeaveStatusDto
        {
            Status = "Approved"
        };
        _mockLeaveService.Setup(service => service.UpdateStatusAsync(leaveId, request)).ThrowsAsync(new KeyNotFoundException("Leave request not found"));
        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _controller.UpdateStatus(leaveId, request));
        _mockLeaveService.Verify(service => service.UpdateStatusAsync(leaveId, request),Times.Once);
    }


    // Positive Test - Returns leave balance successfully
    [Fact]
    public async Task GetLeaveBalance_ShouldReturnOkResult_WithLeaveBalances()
    {
        // Arrange
        var employeeId = 1;
        var expectedBalances = new List<LeaveBalanceDto>
    {
        new LeaveBalanceDto
        {
            EmployeeId = 1,
            LeaveType = "Casual",
            TotalDays = 20,
            UsedDays = 5,
            RemainingDays = 15
        },
        new LeaveBalanceDto
        {
            EmployeeId = 1,
            LeaveType = "Sick",
            TotalDays = 15,
            UsedDays = 2,
            RemainingDays = 13
        }
    };
        _mockLeaveService.Setup(service => service.GetLeaveBalanceAsync(employeeId)).ReturnsAsync(expectedBalances);
        // Act
        var result = await _controller.GetLeaveBalance(employeeId);
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var balances = Assert.IsAssignableFrom<IEnumerable<LeaveBalanceDto>>(okResult.Value);
        Assert.Equal(expectedBalances.Count, balances.Count());
        _mockLeaveService.Verify(service => service.GetLeaveBalanceAsync(employeeId),Times.Once);
    }

    // Negative Test - Returns empty list when no leave balance exists
    [Fact]
    public async Task GetLeaveBalance_ShouldReturnEmptyList_WhenNoLeaveBalanceExists()
    {
        // Arrange
        var employeeId = 1;
        var emptyList = new List<LeaveBalanceDto>();
        _mockLeaveService.Setup(service => service.GetLeaveBalanceAsync(employeeId)).ReturnsAsync(emptyList);
        // Act
        var result = await _controller.GetLeaveBalance(employeeId);
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var balances = Assert.IsAssignableFrom<IEnumerable<LeaveBalanceDto>>(okResult.Value);
        Assert.Empty(balances);
        _mockLeaveService.Verify(service => service.GetLeaveBalanceAsync(employeeId),Times.Once);
    }

    // Positive Test - Returns all leave requests successfully
    [Fact]
    public async Task GetAllLeaves_ShouldReturnOkResult_WithListOfLeaves()
    {
        // Arrange
        var expectedLeaves = new List<LeaveRequestDto>
    {
        new LeaveRequestDto
        {
            Id = 1,
            EmployeeId = 1,
            EmployeeName = "John Doe",
            LeaveType = "Casual",
            StartDate = new DateTime(2025, 8, 10),
            EndDate = new DateTime(2025, 8, 12),
            Status = "Pending",
            Reason = "Personal work"
        },
        new LeaveRequestDto
        {
            Id = 2,
            EmployeeId = 2,
            EmployeeName = "Jane Smith",
            LeaveType = "Sick",
            StartDate = new DateTime(2025, 9, 5),
            EndDate = new DateTime(2025, 9, 7),
            Status = "Approved",
            Reason = "Medical appointment"
        }
    };
        _mockLeaveService.Setup(service => service.GetAllLeavesAsync()).ReturnsAsync(expectedLeaves);

        // Act
        var result = await _controller.GetAllLeaves();
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var leaves = Assert.IsAssignableFrom<IEnumerable<LeaveRequestDto>>(okResult.Value);

        Assert.Equal(expectedLeaves.Count, leaves.Count());

        _mockLeaveService.Verify(service => service.GetAllLeavesAsync(),Times.Once);
    }

    // Negative Test - Returns empty list when no leave requests exist
    [Fact]
    public async Task GetAllLeaves_ShouldReturnEmptyList_WhenNoLeavesExist()
    {
        // Arrange
        var emptyList = new List<LeaveRequestDto>();
        _mockLeaveService.Setup(service => service.GetAllLeavesAsync()).ReturnsAsync(emptyList);
        // Act
        var result = await _controller.GetAllLeaves();
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var leaves = Assert.IsAssignableFrom<IEnumerable<LeaveRequestDto>>(okResult.Value);
        Assert.Empty(leaves);
        _mockLeaveService.Verify(service => service.GetAllLeavesAsync(),Times.Once);
    }
}