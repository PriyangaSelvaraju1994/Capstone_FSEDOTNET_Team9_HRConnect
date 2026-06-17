using HRConnect.API.Data;
using HRConnect.API.DTOs;
using HRConnect.API.Entities;
using HRConnect.API.Exceptions;
using HRConnect.API.Services.Implementations;
using Microsoft.EntityFrameworkCore;
using Xunit;
namespace HRConnect.Tests.Services;
public class LeaveServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly LeaveService _service;
    public LeaveServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        _context = new ApplicationDbContext(options);
        _service = new LeaveService(_context);
    }
    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
    private User CreateUser(int id = 101,string fullName = "John Doe",string? email = null)
    {
        return new User
        {
            Id = id,
            FullName = fullName,
            Email = email ?? $"user{id}@example.com",
            PasswordHash = "Password123",
            IsAdmin = false
        };
    }
    private Employee CreateEmployee(int id = 1,int userId = 101,string department = "IT",string designation = "Software Engineer",DateTime? joiningDate = null)
    {
        return new Employee
        {
            Id = id,
            UserId = userId,
            Department = department,
            Designation = designation,
            JoiningDate = joiningDate ?? DateTime.Today.AddMonths(-6)
        };
    }
    private LeaveBalance CreateLeaveBalance(int employeeId = 1,string leaveType = "Casual",int totalDays = 20,int usedDays = 0)
    {
        return new LeaveBalance
        {
            EmployeeId = employeeId,
            LeaveType = leaveType,
            TotalDays = totalDays,
            UsedDays = usedDays
        };
    }
    private LeaveRequest CreateLeave(int employeeId = 1,string leaveType = "Casual",string status = "Pending",DateTime? startDate = null,DateTime? endDate = null,string reason = "Personal work")
    {
        return new LeaveRequest
        {
            EmployeeId = employeeId,
            LeaveType = leaveType,
            StartDate = startDate ?? DateTime.Today.AddDays(1),
            EndDate = endDate ?? DateTime.Today.AddDays(3),
            Status = status,
            Reason = reason
        };
    }
    private CreateLeaveRequestDto CreateLeaveRequest(int employeeId = 1,string leaveType = "Casual",DateTime? startDate = null,DateTime? endDate = null,string reason = "Personal work")
    {
        return new CreateLeaveRequestDto
        {
            EmployeeId = employeeId,
            LeaveType = leaveType,
            StartDate = startDate ?? DateTime.Today.AddDays(1),
            EndDate = endDate ?? DateTime.Today.AddDays(3),
            Reason = reason
        };
    }
    private UpdateLeaveStatusDto CreateUpdateStatusRequest(string status = "Approved")
    {
        return new UpdateLeaveStatusDto
        {
            Status = status
        };
    }
    private async Task<Employee> SeedEmployeeAsync(int employeeId = 1,int userId = 101,string fullName = "John Doe")
    {
        var user = CreateUser(id: userId,fullName: fullName);
        var employee = CreateEmployee(id: employeeId,userId: userId);
        user.Employee = employee;
        employee.User = user;
        _context.Users.Add(user);
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);
        return employee;
    }
    // Positive Test - Successfully applies leave
    [Fact]
    public async Task ApplyLeaveAsync_ShouldApplyLeave_WhenRequestIsValid()
    {
        // Arrange
        var employee = await SeedEmployeeAsync();
        _context.LeaveBalances.Add(CreateLeaveBalance(employeeId: employee.Id));
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);
        var request = CreateLeaveRequest(employeeId: employee.Id);
        // Act
        var result = await _service.ApplyLeaveAsync(request);
        // Assert
        Assert.Equal("Leave request submitted successfully",result);
        var leaveRequest = await _context.LeaveRequests.FirstOrDefaultAsync(l => l.EmployeeId == employee.Id,TestContext.Current.CancellationToken);
        Assert.NotNull(leaveRequest);
        Assert.Equal(employee.Id, leaveRequest!.EmployeeId);
        Assert.Equal(request.LeaveType, leaveRequest.LeaveType);
        Assert.Equal(request.StartDate, leaveRequest.StartDate);
        Assert.Equal(request.EndDate, leaveRequest.EndDate);
        Assert.Equal(request.Reason, leaveRequest.Reason);
        Assert.Equal("Pending", leaveRequest.Status);
    }
    // Negative Test - Throws exception when employee does not exist
    [Fact]
    public async Task ApplyLeaveAsync_ShouldThrowNotFoundException_WhenEmployeeDoesNotExist()
    {
        // Arrange
        var request = CreateLeaveRequest(employeeId: 999);
        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(() => _service.ApplyLeaveAsync(request));
        Assert.Equal("Employee not found",exception.Message);
    }

    // Positive Test - Returns employee's leave requests
    [Fact]
    public async Task GetMyLeavesAsync_ShouldReturnLeaves_WhenLeavesExist()
    {
        // Arrange
        var employee = await SeedEmployeeAsync();
        var leave1 = CreateLeave(employeeId: employee.Id,leaveType: "Casual");
        var leave2 = CreateLeave(employeeId: employee.Id,leaveType: "Sick",status: "Approved",startDate: DateTime.Today.AddDays(10),endDate: DateTime.Today.AddDays(12),reason: "Medical");
        _context.LeaveRequests.AddRange(leave1, leave2);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);
        // Act
        var result = (await _service.GetMyLeavesAsync(employee.Id)).ToList();
        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains(result, l =>l.LeaveType == "Casual" &&l.Status == "Pending");
        Assert.Contains(result, l => l.LeaveType == "Sick" &&l.Status == "Approved");
    }

    // Negative Test - Returns empty list when employee has no leave requests
    [Fact]
    public async Task GetMyLeavesAsync_ShouldReturnEmptyList_WhenNoLeavesExist()
    {
        // Arrange
        var employee = await SeedEmployeeAsync();
        // Act
        var result = await _service.GetMyLeavesAsync(employee.Id);
        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // Positive Test - Updates leave status successfully when leave request exists
    [Fact]
    public async Task UpdateStatusAsync_ShouldUpdateStatus_WhenLeaveExists()
    {
        // Arrange
        var employee = await SeedEmployeeAsync();
        _context.LeaveBalances.Add(CreateLeaveBalance(employeeId: employee.Id));
        var leaveRequest = CreateLeave(employeeId: employee.Id);
        _context.LeaveRequests.Add(leaveRequest);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);
        var request = CreateUpdateStatusRequest();
        // Act
        var result = await _service.UpdateStatusAsync(leaveRequest.Id,request);
        // Assert
        Assert.Equal("Leave status updated successfully",result);
        var updatedLeave = await _context.LeaveRequests.FindAsync(  new object[] { leaveRequest.Id },TestContext.Current.CancellationToken);
        Assert.NotNull(updatedLeave);
        Assert.Equal("Approved", updatedLeave!.Status);
        var updatedBalance = await _context.LeaveBalances.FirstOrDefaultAsync(lb => lb.EmployeeId == employee.Id &&lb.LeaveType == leaveRequest.LeaveType,TestContext.Current.CancellationToken);
        Assert.NotNull(updatedBalance);
        Assert.Equal(3, updatedBalance!.UsedDays);
    }

    // Negative Test - Throws exception when leave request does not exist
    [Fact]
    public async Task UpdateStatusAsync_ShouldThrowNotFoundException_WhenLeaveDoesNotExist()
    {
        // Arrange
        var request = CreateUpdateStatusRequest();
        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(() => _service.UpdateStatusAsync(999,request));
        Assert.Equal("Leave request not found",exception.Message);
    }

    // Positive Test - Returns leave balances when balances exist
    [Fact]
    public async Task GetLeaveBalanceAsync_ShouldReturnBalances_WhenBalancesExist()
    {
        // Arrange
        var employee = await SeedEmployeeAsync();
        var casualBalance = CreateLeaveBalance(employeeId: employee.Id,leaveType: "Casual",totalDays: 20,usedDays: 5);
        var sickBalance = CreateLeaveBalance(employeeId: employee.Id,leaveType: "Sick",totalDays: 15,usedDays: 2);
        _context.LeaveBalances.AddRange(casualBalance,sickBalance);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);
        // Act
        var result = await _service.GetLeaveBalanceAsync(employee.Id);
        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains(result, b =>b.LeaveType == "Casual" &&b.TotalDays == 20 &&b.UsedDays == 5 &&b.RemainingDays == 15);
        Assert.Contains(result, b =>b.LeaveType == "Sick" &&b.TotalDays == 15 &&b.UsedDays == 2 &&b.RemainingDays == 13);
    }
    // Negative Test - Returns empty list when no leave balances exist
    [Fact]
    public async Task GetLeaveBalanceAsync_ShouldReturnEmptyList_WhenNoBalancesExist()
    {
        // Arrange
        var employee = await SeedEmployeeAsync();
        // Act
        var result = await _service.GetLeaveBalanceAsync(employee.Id);
        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // Positive Test - Returns all leave requests
    [Fact]
    public async Task GetAllLeavesAsync_ShouldReturnAllLeaves_WhenLeavesExist()
    {
        // Arrange
        var employee1 = await SeedEmployeeAsync(employeeId: 1,userId: 101,fullName: "John Doe");
        var employee2 = await SeedEmployeeAsync(employeeId: 2,userId: 102,fullName: "Jane Smith");
        var leave1 = CreateLeave(employeeId: employee1.Id,leaveType: "Casual",status: "Pending");
        leave1.Employee = employee1;
        var leave2 = CreateLeave(employeeId: employee2.Id,leaveType: "Sick",status: "Approved",startDate: DateTime.Today.AddDays(5),endDate: DateTime.Today.AddDays(7),reason: "Medical");
        leave2.Employee = employee2;
        _context.LeaveRequests.AddRange(leave1, leave2);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);
        // Act
        var result = await _service.GetAllLeavesAsync();
        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains(result, l =>l.EmployeeId == employee1.Id &&l.EmployeeName == "John Doe" &&l.LeaveType == "Casual");
        Assert.Contains(result, l =>l.EmployeeId == employee2.Id &&l.EmployeeName == "Jane Smith" &&l.LeaveType == "Sick");
    }
    // Negative Test - Returns empty list when no leave requests exist
    [Fact]
    public async Task GetAllLeavesAsync_ShouldReturnEmptyList_WhenNoLeavesExist()
    {
        // Arrange
        // Act
        var result = await _service.GetAllLeavesAsync();
        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}
