using Xunit;
using Microsoft.EntityFrameworkCore;
using HRConnect.API.Services.Implementations;
using HRConnect.API.Data;
using HRConnect.API.DTOs;
using HRConnect.API.Entities;
using HRConnect.API.Exceptions;

namespace HRConnect.Tests.Services;

public class LeaveServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly LeaveService _service;

    public LeaveServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _service = new LeaveService(_context);
    }

    #region Test Data Helpers

    private Employee CreateEmployee(int id = 1, int userId = 1, bool isActive = true)
    {
        return new Employee
        {
            Id = id,
            UserId = userId,
            Department = "IT",
            Designation = "Developer",
            JoiningDate = DateTime.Today.AddYears(-1),
            IsActive = isActive
        };
    }

    private User CreateUser(int id = 1, string email = "test@example.com")
    {
        return new User
        {
            Id = id,
            FullName = "Test User",
            Email = email,
            PasswordHash = "hashedpassword",
            IsAdmin = false
        };
    }

    private LeaveBalance CreateLeaveBalance(int employeeId, string leaveType = "Casual", int totalDays = 12, int usedDays = 0)
    {
        return new LeaveBalance
        {
            EmployeeId = employeeId,
            LeaveType = leaveType,
            TotalDays = totalDays,
            UsedDays = usedDays
        };
    }

    private CreateLeaveRequestDto CreateLeaveRequest(
        int employeeId = 1,
        string leaveType = "Casual",
        DateTime? startDate = null,
        DateTime? endDate = null)
    {
        return new CreateLeaveRequestDto
        {
            EmployeeId = employeeId,
            LeaveType = leaveType,
            StartDate = startDate ?? DateTime.Today.AddDays(1),
            EndDate = endDate ?? DateTime.Today.AddDays(3),
            Reason = "Personal work",
            CreatedBy = "test@example.com"
        };
    }

    #endregion

    #region ApplyLeaveAsync Tests

    [Fact]
    public async Task ApplyLeaveAsync_WithValidRequest_CreatesLeaveRequest()
    {
        // Arrange
        var employee = CreateEmployee();
        var leaveBalance = CreateLeaveBalance(employee.Id);
        _context.Employees.Add(employee);
        _context.LeaveBalances.Add(leaveBalance);
        await _context.SaveChangesAsync();

        var request = CreateLeaveRequest();

        // Act
        var result = await _service.ApplyLeaveAsync(request);

        // Assert
        Assert.Equal("Leave request submitted successfully", result);

        var leaveRequest = await _context.LeaveRequests.FirstOrDefaultAsync();
        Assert.NotNull(leaveRequest);
        Assert.Equal(employee.Id, leaveRequest.EmployeeId);
        Assert.Equal("Casual", leaveRequest.LeaveType);
        Assert.Equal("Pending", leaveRequest.Status);
    }

    [Fact]
    public async Task ApplyLeaveAsync_ThrowsNotFoundException_WhenEmployeeDoesNotExist()
    {
        // Arrange
        var request = CreateLeaveRequest(employeeId: 999);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _service.ApplyLeaveAsync(request));

        Assert.Equal("Employee not found", exception.Message);
    }

    [Fact]
    public async Task ApplyLeaveAsync_ThrowsValidationException_WhenEndDateIsBeforeStartDate()
    {
        // Arrange
        var employee = CreateEmployee();
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        var request = CreateLeaveRequest(
            startDate: DateTime.Today.AddDays(5),
            endDate: DateTime.Today.AddDays(3));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _service.ApplyLeaveAsync(request));

        Assert.Equal("End date cannot be earlier than start date.", exception.Message);
    }

    //[Fact]
    //public async Task ApplyLeaveAsync_ThrowsValidationException_WhenLeaveFallsOnHoliday()
    //{
    //    // Arrange
    //    var employee = CreateEmployee();
    //    var holiday = new Holiday
    //    {
    //        HolidayDate = DateTime.Today.AddDays(2),
    //        HolidayName = "Test Holiday"
    //    };

    //    _context.Employees.Add(employee);
    //    _context.Holidays.Add(holiday);
    //    await _context.SaveChangesAsync();

    //    var request = CreateLeaveRequest(
    //        startDate: DateTime.Today.AddDays(1),
    //        endDate: DateTime.Today.AddDays(3));

    //    // Act & Assert
    //    var exception = await Assert.ThrowsAsync<ValidationException>(
    //        () => _service.ApplyLeaveAsync(request));

    //    Assert.Equal("Leave cannot be applied on holidays.", exception.Message);
    //}

    //[Fact]
    //public async Task ApplyLeaveAsync_ThrowsValidationException_WhenOverlappingLeaveExists()
    //{
    //    // Arrange
    //    var employee = CreateEmployee();
    //    var existingLeave = new LeaveRequest
    //    {
    //        EmployeeId = employee.Id,
    //        LeaveType = "Casual",
    //        StartDate = DateTime.Today.AddDays(1),
    //        EndDate = DateTime.Today.AddDays(5),
    //        Status = "Pending",
    //        Reason = "Existing leave"
    //    };

    //    _context.Employees.Add(employee);
    //    _context.LeaveRequests.Add(existingLeave);
    //    await _context.SaveChangesAsync();

    //    var request = CreateLeaveRequest(
    //        startDate: DateTime.Today.AddDays(3),
    //        endDate: DateTime.Today.AddDays(7));

    //    // Act & Assert
    //    var exception = await Assert.ThrowsAsync<ValidationException>(
    //        () => _service.ApplyLeaveAsync(request));

    //    Assert.Equal("You have an overlapping leave request during this period.", exception.Message);
    //}

    [Fact]
    public async Task ApplyLeaveAsync_ThrowsValidationException_WhenInsufficientLeaveBalance()
    {
        // Arrange
        var employee = CreateEmployee();
        var leaveBalance = CreateLeaveBalance(employee.Id, totalDays: 12, usedDays: 10);
        _context.Employees.Add(employee);
        _context.LeaveBalances.Add(leaveBalance);
        await _context.SaveChangesAsync();

        var request = CreateLeaveRequest(
            startDate: DateTime.Today.AddDays(1),
            endDate: DateTime.Today.AddDays(5)); // 5 days but only 2 available

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _service.ApplyLeaveAsync(request));

        Assert.Contains("Insufficient leave balance", exception.Message);
    }

    #endregion

    #region GetMyLeavesAsync Tests

    [Fact]
    public async Task GetMyLeavesAsync_ReturnsLeavesForEmployee()
    {
        // Arrange - Create and save employee first
        var user = CreateUser(1);
        var employee = new Employee
        {
            UserId = user.Id,
            Department = "IT",
            Designation = "Developer",
            JoiningDate = DateTime.Today.AddYears(-1),
            IsActive = true
        };

        _context.Users.Add(user);
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        // Get the actual saved employee ID
        var savedEmployeeId = employee.Id;
        Assert.True(savedEmployeeId > 0, "Employee must have valid ID after save");

        // Create leave requests with the saved employee ID
        var leave1 = new LeaveRequest
        {
            EmployeeId = savedEmployeeId,
            LeaveType = "Casual",
            StartDate = DateTime.Today,
            EndDate = DateTime.Today.AddDays(2),
            Status = "Pending",
            Reason = "Personal",
            CreatedDate = DateTime.UtcNow
        };

        var leave2 = new LeaveRequest
        {
            EmployeeId = savedEmployeeId,
            LeaveType = "Sick",
            StartDate = DateTime.Today.AddDays(10),
            EndDate = DateTime.Today.AddDays(12),
            Status = "Approved",
            Reason = "Medical",
            CreatedDate = DateTime.UtcNow
        };

        _context.LeaveRequests.AddRange(leave1, leave2);
        await _context.SaveChangesAsync();

        // Act
        var result = (await _service.GetMyLeavesAsync(savedEmployeeId)).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains(result, l => l.LeaveType == "Casual" && l.Status == "Pending");
        Assert.Contains(result, l => l.LeaveType == "Sick" && l.Status == "Approved");
    }

    #endregion

    #region UpdateStatusAsync Tests

    [Fact]
    public async Task UpdateStatusAsync_UpdatesStatusToApproved_AndUpdatesLeaveBalance()
    {
        // Arrange
        var employee = CreateEmployee();
        var leaveBalance = CreateLeaveBalance(employee.Id, usedDays: 0);
        var leave = new LeaveRequest
        {
            EmployeeId = employee.Id,
            LeaveType = "Casual",
            StartDate = DateTime.Today,
            EndDate = DateTime.Today.AddDays(2), // 3 days
            Status = "Pending",
            Reason = "Personal"
        };

        _context.Employees.Add(employee);
        _context.LeaveBalances.Add(leaveBalance);
        _context.LeaveRequests.Add(leave);
        await _context.SaveChangesAsync();

        var request = new UpdateLeaveStatusDto
        {
            Status = "Approved",
            UpdatedBy = "admin@example.com"
        };

        // Act
        var result = await _service.UpdateStatusAsync(leave.Id, request);

        // Assert
        Assert.Equal("Leave status updated successfully", result);

        var updatedLeave = await _context.LeaveRequests.FindAsync(leave.Id);
        Assert.Equal("Approved", updatedLeave!.Status);
        Assert.Equal("admin@example.com", updatedLeave.UpdatedBy);

        var updatedBalance = await _context.LeaveBalances.FirstOrDefaultAsync();
        Assert.Equal(3, updatedBalance!.UsedDays);
    }

    //[Fact]
    //public async Task UpdateStatusAsync_UpdatesStatusToCancelled_AndRestoresLeaveBalance()
    //{
    //    // Arrange
    //    var employee = CreateEmployee();
    //    var leaveBalance = CreateLeaveBalance(employee.Id, usedDays: 5);
    //    var leave = new LeaveRequest
    //    {
    //        EmployeeId = employee.Id,
    //        LeaveType = "Casual",
    //        StartDate = DateTime.Today,
    //        EndDate = DateTime.Today.AddDays(2), // 3 days
    //        Status = "Approved",
    //        Reason = "Personal"
    //    };

    //    _context.Employees.Add(employee);
    //    _context.LeaveBalances.Add(leaveBalance);
    //    _context.LeaveRequests.Add(leave);
    //    await _context.SaveChangesAsync();

    //    var request = new UpdateLeaveStatusDto
    //    {
    //        Status = "Cancelled",
    //        UpdatedBy = "admin@example.com"
    //    };

    //    // Act
    //    var result = await _service.UpdateStatusAsync(leave.Id, request);

    //    // Assert
    //    var updatedBalance = await _context.LeaveBalances.FirstOrDefaultAsync();
    //    Assert.Equal(2, updatedBalance!.UsedDays); // 5 - 3 = 2
    //}

    //[Fact]
    //public async Task UpdateStatusAsync_ThrowsNotFoundException_WhenLeaveDoesNotExist()
    //{
    //    // Arrange
    //    var request = new UpdateLeaveStatusDto
    //    {
    //        Status = "Approved",
    //        UpdatedBy = "admin@example.com"
    //    };

    //    // Act & Assert
    //    var exception = await Assert.ThrowsAsync<NotFoundException>(
    //        () => _service.UpdateStatusAsync(999, request));

    //    Assert.Equal("Leave request not found", exception.Message);
    //}

    #endregion

    #region GetLeaveBalanceAsync Tests

    [Fact]
    public async Task GetLeaveBalanceAsync_ReturnsAllBalancesForEmployee()
    {
        // Arrange
        var employee = CreateEmployee();
        var casualBalance = CreateLeaveBalance(employee.Id, "Casual", 12, 3);
        var sickBalance = CreateLeaveBalance(employee.Id, "Sick", 10, 2);

        _context.Employees.Add(employee);
        _context.LeaveBalances.AddRange(casualBalance, sickBalance);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetLeaveBalanceAsync(employee.Id);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains(result, b => b.LeaveType == "Casual" && b.RemainingDays == 9);
        Assert.Contains(result, b => b.LeaveType == "Sick" && b.RemainingDays == 8);
    }

    #endregion

    //#region GetAllLeavesAsync Tests

    //[Fact]
    //public async Task GetAllLeavesAsync_ReturnsAllLeaves_WithEmployeeNames()
    //{
    //    // Arrange
    //    var user1 = CreateUser(1, "user1@example.com");
    //    var user2 = CreateUser(2, "user2@example.com");
    //    var employee1 = CreateEmployee(1, 1);
    //    var employee2 = CreateEmployee(2, 2);
    //    employee1.User = user1;
    //    employee2.User = user2;

    //    var leave1 = new LeaveRequest
    //    {
    //        EmployeeId = employee1.Id,
    //        Employee = employee1,
    //        LeaveType = "Casual",
    //        StartDate = DateTime.Today.AddDays(1),
    //        EndDate = DateTime.Today.AddDays(3),
    //        Status = "Pending",
    //        Reason = "Personal"
    //    };

    //    var leave2 = new LeaveRequest
    //    {
    //        EmployeeId = employee2.Id,
    //        Employee = employee2,
    //        LeaveType = "Sick",
    //        StartDate = DateTime.Today.AddDays(10),
    //        EndDate = DateTime.Today.AddDays(12),
    //        Status = "Approved",
    //        Reason = "Medical"
    //    };

    //    _context.Users.AddRange(user1, user2);
    //    _context.Employees.AddRange(employee1, employee2);
    //    _context.LeaveRequests.AddRange(leave1, leave2);
    //    await _context.SaveChangesAsync();

    //    // Act
    //    var result = await _service.GetAllLeavesAsync();

    //    // Assert
    //    Assert.Equal(2, result.Count);
    //    Assert.Contains(result, l => l.EmployeeName == "Test User");
    //}

    //#endregion

    #region CancelLeaveAsync Tests

    [Fact]
    public async Task CancelLeaveAsync_CancelsLeave_AndSetsUpdatedBy()
    {
        // Arrange
        var user = CreateUser(1, "test@example.com");
        var employee = CreateEmployee(1, 1);
        employee.User = user;

        _context.Users.Add(user);
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        var savedEmployeeId = employee.Id;

        var leave = new LeaveRequest
        {
            EmployeeId = savedEmployeeId,
            LeaveType = "Casual",
            StartDate = DateTime.Today.AddDays(1),
            EndDate = DateTime.Today.AddDays(3),
            Status = "Pending",
            Reason = "Personal"
        };

        _context.LeaveRequests.Add(leave);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.CancelLeaveAsync(leave.Id);

        // Assert
        Assert.Equal("Leave request cancelled successfully", result);

        var cancelledLeave = await _context.LeaveRequests.FindAsync(leave.Id);
        Assert.Equal("Cancelled", cancelledLeave!.Status);
        Assert.Equal("test@example.com", cancelledLeave.UpdatedBy);
        Assert.NotNull(cancelledLeave.UpdatedDate);
    }

    #endregion
    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}