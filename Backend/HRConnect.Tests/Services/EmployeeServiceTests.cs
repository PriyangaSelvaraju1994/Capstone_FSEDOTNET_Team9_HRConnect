using HRConnect.API.Data;
using HRConnect.API.DTOs.Employee;
using HRConnect.API.Entities;
using HRConnect.API.Exceptions;
using HRConnect.API.Helpers;
using HRConnect.API.Services.Implementations;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HRConnect.Tests.Services;

public class EmployeeServiceTests
{
    private readonly ApplicationDbContext _context;
    private readonly EmployeeService _service;

    public EmployeeServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);

        var leaveBalanceHelper = new DefaultLeaveBalancesForNewEmployee(_context);

        _service = new EmployeeService(_context, leaveBalanceHelper);
    }

    #region Test Data Helpers

    private User CreateUser(
        int id = 101,
        string fullName = "John Doe",
        string? email = null)
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

    private Employee CreateEmployee(
        int userId = 101,
        string department = "IT",
        string designation = "Software Engineer",
        DateTime? joiningDate = null)
    {
        return new Employee
        {
            UserId = userId,
            Department = department,
            Designation = designation,
            JoiningDate = joiningDate ?? new DateTime(2024, 1, 15)
        };
    }

    private CreateEmployeeDto CreateEmployeeRequest(
        int userId = 101,
        string department = "IT",
        string designation = "Software Engineer",
        DateTime? joiningDate = null)
    {
        return new CreateEmployeeDto
        {
            UserId = userId,
            Department = department,
            Designation = designation,
            JoiningDate = joiningDate ?? new DateTime(2024, 1, 15)
        };
    }

    private UpdateEmployeeDto CreateUpdateEmployeeRequest(
        string department = "Engineering",
        string designation = "Senior Software Engineer",
        DateTime? joiningDate = null)
    {
        return new UpdateEmployeeDto
        {
            Department = department,
            Designation = designation,
            JoiningDate = joiningDate ?? new DateTime(2024, 2, 1)
        };
    }

    #endregion

    // Positive Test - Returns list of employees successfully
    [Fact]
    public async Task GetAllEmployeesAsync_ShouldReturnEmployees_WhenEmployeesExist()
    {
        // Arrange
        var user1 = CreateUser();

        var user2 = CreateUser(
            id: 102,
            fullName: "Jane Smith");

        var employee1 = CreateEmployee();
        employee1.User = user1;
        user1.Employee = employee1;

        var employee2 = CreateEmployee(
            userId: 102,
            department: "HR",
            designation: "HR Manager",
            joiningDate: new DateTime(2023, 5, 20));

        employee2.User = user2;
        user2.Employee = employee2;

        _context.Users.AddRange(user1, user2);
        _context.Employees.AddRange(employee1, employee2);

        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);

        // Act
        var result = (await _service.GetAllEmployeesAsync()).ToList();

        // Assert
        Assert.Equal(2, result.Count);

        Assert.Equal("John Doe", result[0].FullName);
        Assert.Equal("IT", result[0].Department);

        Assert.Equal("Jane Smith", result[1].FullName);
        Assert.Equal("HR", result[1].Department);
    }

    // Negative Test - Returns empty list when no employees exist
    [Fact]
    public async Task GetAllEmployeesAsync_ShouldReturnEmptyList_WhenEmployeesDoNotExist()
    {
        // Arrange

        // Act
        var result = await _service.GetAllEmployeesAsync();

        // Assert
        Assert.Empty(result);
    }

    // Positive Test - Returns employee when valid employee id is provided
    [Fact]
    public async Task GetEmployeeByIdAsync_ShouldReturnEmployee_WhenEmployeeExists()
    {
        // Arrange
        var user = CreateUser();

        var employee = CreateEmployee();
        employee.Id = 1;

        user.Employee = employee;
        employee.User = user;

        _context.Users.Add(user);
        _context.Employees.Add(employee);

        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);

        // Act
        var result = await _service.GetEmployeeByIdAsync(employee.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(employee.Id, result.Id);
        Assert.Equal(employee.UserId, result.UserId);
        Assert.Equal(employee.Department, result.Department);
        Assert.Equal(employee.Designation, result.Designation);
        Assert.Equal(user.FullName, result.FullName);
    }

    // Negative Test - Throws exception when employee does not exist
    [Fact]
    public async Task GetEmployeeByIdAsync_ShouldThrowNotFoundException_WhenEmployeeDoesNotExist()
    {
        // Arrange

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _service.GetEmployeeByIdAsync(999));

        Assert.Equal("Employee with ID 999 not found.", exception.Message);
    }
    // Positive Test - Creates employee successfully
    [Fact]
    public async Task CreateEmployeeAsync_ShouldCreateEmployee_WhenRequestIsValid()
    {
        // Arrange
        var user = CreateUser();

        _context.Users.Add(user);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);

        var request = CreateEmployeeRequest();

        // Act
        var result = await _service.CreateEmployeeAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal(request.UserId, result.UserId);
        Assert.Equal(request.Department, result.Department);
        Assert.Equal(request.Designation, result.Designation);

        // Verify employee is saved in database
        var employee = await _context.Employees.FindAsync(result.Id);

        Assert.NotNull(employee);
        Assert.Equal(request.UserId, employee!.UserId);

        // Verify default leave balances are created
        var leaveBalances = _context.LeaveBalances
            .Where(lb => lb.EmployeeId == result.Id)
            .ToList();

        Assert.Equal(3, leaveBalances.Count);
    }

    // Negative Test - Throws exception when employee already exists
    [Fact]
    public async Task CreateEmployeeAsync_ShouldThrowConflictException_WhenEmployeeAlreadyExists()
    {
        // Arrange
        var user = CreateUser();

        _context.Users.Add(user);

        var existingEmployee = CreateEmployee();

        _context.Employees.Add(existingEmployee);

        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);

        var request = CreateEmployeeRequest(
            designation: "Senior Software Engineer",
            joiningDate: new DateTime(2024, 2, 1));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ConflictException>(
            () => _service.CreateEmployeeAsync(request));

        Assert.Equal(
            "An employee record already exists for User ID 101.",
            exception.Message);
    }

    // Positive Test - Updates employee successfully
    [Fact]
    public async Task UpdateEmployeeAsync_ShouldUpdateEmployee_WhenEmployeeExists()
    {
        // Arrange
        var employee = CreateEmployee();

        _context.Employees.Add(employee);

        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);

        var request = CreateUpdateEmployeeRequest();

        // Act
        var result = await _service.UpdateEmployeeAsync(employee.Id, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(employee.Id, result.Id);
        Assert.Equal(request.Department, result.Department);
        Assert.Equal(request.Designation, result.Designation);
        Assert.Equal(request.JoiningDate, result.JoiningDate);

        // Verify changes are saved in the database
        var updatedEmployee = await _context.Employees.FindAsync(employee.Id);

        Assert.NotNull(updatedEmployee);
        Assert.Equal(request.Department, updatedEmployee!.Department);
        Assert.Equal(request.Designation, updatedEmployee.Designation);
        Assert.Equal(request.JoiningDate, updatedEmployee.JoiningDate);
    }

    // Negative Test - Throws exception when employee does not exist
    [Fact]
    public async Task UpdateEmployeeAsync_ShouldThrowNotFoundException_WhenEmployeeDoesNotExist()
    {
        // Arrange
        var request = CreateUpdateEmployeeRequest();
        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _service.UpdateEmployeeAsync(999, request));

        Assert.Equal(
            "Employee with ID 999 not found.",
            exception.Message);
    }
    // Positive Test - Deletes employee successfully
    [Fact]
    public async Task DeleteEmployeeAsync_ShouldDeleteEmployee_WhenEmployeeExists()
    {
        // Arrange
        var employee = CreateEmployee();
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);
        var leaveRequest = new LeaveRequest
        {
            EmployeeId = employee.Id,
            LeaveType = "Casual",
            StartDate = DateTime.Today,
            EndDate = DateTime.Today.AddDays(2),
            Status = "Pending",
            Reason = "Personal Work"
        };

        var leaveBalance = new LeaveBalance
        {
            EmployeeId = employee.Id,
            LeaveType = "Casual",
            TotalDays = 20,
            UsedDays = 2
        };

        _context.LeaveRequests.Add(leaveRequest);
        _context.LeaveBalances.Add(leaveBalance);

        await _context.SaveChangesAsync(TestContext.Current.CancellationToken);
        // Act
        await _service.DeleteEmployeeAsync(employee.Id);
        // Assert
        Assert.Empty(_context.Employees);
        Assert.Empty(_context.LeaveRequests);
        Assert.Empty(_context.LeaveBalances);
    }

    // Negative Test - Throws exception when employee does not exist
    [Fact]
    public async Task DeleteEmployeeAsync_ShouldThrowNotFoundException_WhenEmployeeDoesNotExist()
    {
        // Arrange

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _service.DeleteEmployeeAsync(999));

        Assert.Equal(
            "Employee with ID 999 not found.",
            exception.Message);
    }
}