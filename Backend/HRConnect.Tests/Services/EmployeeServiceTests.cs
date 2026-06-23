using Xunit;
using Microsoft.EntityFrameworkCore;
using HRConnect.API.Services.Implementations;
using HRConnect.API.Data;
using HRConnect.API.DTOs.Employee;
using HRConnect.API.Entities;
using HRConnect.API.Exceptions;
using HRConnect.API.Helpers;

namespace HRConnect.Tests.Services;

public class EmployeeServiceTests : IDisposable
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
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
            IsAdmin = false
        };
    }

    private Employee CreateEmployee(
        int userId = 101,
        string department = "IT",
        string designation = "Software Engineer",
        DateTime? joiningDate = null,
        bool isActive = false)
    {
        return new Employee
        {
            UserId = userId,
            Department = department,
            Designation = designation,
            JoiningDate = joiningDate ?? new DateTime(2024, 1, 15),
            IsActive = isActive
        };
    }

    private CreateEmployeeDto CreateEmployeeRequest(
        int userId = 101,
        string department = "IT",
        string designation = "Software Engineer",
        DateTime? joiningDate = null,
        bool isActive = false)
    {
        return new CreateEmployeeDto
        {
            UserId = userId,
            Department = department,
            Designation = designation,
            JoiningDate = joiningDate ?? new DateTime(2024, 1, 15),
            IsActive = isActive
        };
    }

    private UpdateEmployeeDto CreateUpdateEmployeeRequest(
        string department = "Engineering",
        string designation = "Senior Software Engineer",
        DateTime? joiningDate = null,
        bool isActive = true)
    {
        return new UpdateEmployeeDto
        {
            Department = department,
            Designation = designation,
            JoiningDate = joiningDate ?? new DateTime(2024, 2, 1),
            IsActive = isActive
        };
    }

    #endregion

    #region GetAllEmployeesAsync Tests

    [Fact]
    public async Task GetAllEmployeesAsync_ReturnsEmployees_WhenEmployeesExist()
    {
        // Arrange
        var user1 = CreateUser();
        var user2 = CreateUser(id: 102, fullName: "Jane Smith");

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
        await _context.SaveChangesAsync();

        // Act
        var result = (await _service.GetAllEmployeesAsync()).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("John Doe", result[0].FullName);
        Assert.Equal("IT", result[0].Department);
        Assert.Equal("Jane Smith", result[1].FullName);
        Assert.Equal("HR", result[1].Department);
    }

    #endregion

    #region GetEmployeeByIdAsync Tests

    [Fact]
    public async Task GetEmployeeByIdAsync_ReturnsEmployee_WhenEmployeeExists()
    {
        // Arrange
        var user = CreateUser();
        var employee = CreateEmployee();
        employee.Id = 1;
        user.Employee = employee;
        employee.User = user;

        _context.Users.Add(user);
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEmployeeByIdAsync(employee.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(employee.Id, result.Id);
        Assert.Equal(employee.UserId, result.UserId);
        Assert.Equal(employee.Department, result.Department);
        Assert.Equal(user.FullName, result.FullName);
    }

    [Fact]
    public async Task GetEmployeeByIdAsync_ThrowsNotFoundException_WhenEmployeeDoesNotExist()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _service.GetEmployeeByIdAsync(999));

        Assert.Equal("Employee with ID 999 not found.", exception.Message);
    }

    [Fact]
    public async Task GetEmployeeByIdAsync_ThrowsBadRequestException_WhenIdIsZero()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<BadRequestException>(
            () => _service.GetEmployeeByIdAsync(0));

        Assert.Equal("Employee ID is invalid.", exception.Message);
    }

    #endregion

    #region CreateEmployeeAsync Tests

    [Fact]
    public async Task CreateEmployeeAsync_CreatesEmployee_WhenRequestIsValid()
    {
        // Arrange
        var user = CreateUser();
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = CreateEmployeeRequest();

        // Act
        var result = await _service.CreateEmployeeAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal(request.UserId, result.UserId);
        Assert.False(result.IsActive); // New employees are inactive by default

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

    //[Fact]
    //public async Task CreateEmployeeAsync_ThrowsBadRequestException_WhenUserIdIsZero()
    //{
    //    // Arrange
    //    var request = CreateEmployeeRequest(userId: 0);

    //    // Act & Assert
    //    var exception = await Assert.ThrowsAsync<BadRequestException>(
    //        () => _service.CreateEmployeeAsync(request));

    //    Assert.Equal("UserId must be greater than 0.", exception.Message);
    //}

    //[Fact]
    //public async Task CreateEmployeeAsync_ThrowsNotFoundException_WhenUserDoesNotExist()
    //{
    //    // Arrange
    //    var request = CreateEmployeeRequest(userId: 999);

    //    // Act & Assert
    //    var exception = await Assert.ThrowsAsync<NotFoundException>(
    //        () => _service.CreateEmployeeAsync(request));

    //    Assert.Equal("User with ID 999 does not exist.", exception.Message);
    //}

    [Fact]
    public async Task CreateEmployeeAsync_ThrowsConflictException_WhenEmployeeAlreadyExists()
    {
        // Arrange
        var user = CreateUser();
        _context.Users.Add(user);

        var existingEmployee = CreateEmployee();
        _context.Employees.Add(existingEmployee);
        await _context.SaveChangesAsync();

        var request = CreateEmployeeRequest(
            designation: "Senior Software Engineer",
            joiningDate: new DateTime(2024, 2, 1));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ConflictException>(
            () => _service.CreateEmployeeAsync(request));

        Assert.Equal("An employee record already exists for User ID 101.", exception.Message);
    }

    #endregion

    #region UpdateEmployeeAsync Tests

    [Fact]
    public async Task UpdateEmployeeAsync_UpdatesEmployee_WhenEmployeeExists()
    {
        // Arrange
        var employee = CreateEmployee();
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        var request = CreateUpdateEmployeeRequest();

        // Act
        var result = await _service.UpdateEmployeeAsync(employee.Id, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(employee.Id, result.Id);
        Assert.Equal(request.Department, result.Department);
        Assert.Equal(request.Designation, result.Designation);
        Assert.Equal(request.JoiningDate, result.JoiningDate);
        Assert.True(result.IsActive);

        // Verify changes are saved in the database
        var updatedEmployee = await _context.Employees.FindAsync(employee.Id);
        Assert.NotNull(updatedEmployee);
        Assert.Equal(request.Department, updatedEmployee!.Department);
        Assert.Equal(request.Designation, updatedEmployee.Designation);
    }

    //[Fact]
    //public async Task UpdateEmployeeAsync_ThrowsBadRequestException_WhenIdIsZero()
    //{
    //    // Arrange
    //    var request = CreateUpdateEmployeeRequest();

    //    // Act & Assert
    //    var exception = await Assert.ThrowsAsync<BadRequestException>(
    //        () => _service.UpdateEmployeeAsync(0, request));

    //    Assert.Equal("Employee ID must be greater than 0.", exception.Message);
    //}

    [Fact]
    public async Task UpdateEmployeeAsync_ThrowsBadRequestException_WhenDepartmentIsEmpty()
    {
        // Arrange
        var employee = CreateEmployee();
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        var request = CreateUpdateEmployeeRequest(department: "");

        // Act & Assert
        var exception = await Assert.ThrowsAsync<BadRequestException>(
            () => _service.UpdateEmployeeAsync(employee.Id, request));

        Assert.Equal("Department is required.", exception.Message);
    }

    [Fact]
    public async Task UpdateEmployeeAsync_ThrowsNotFoundException_WhenEmployeeDoesNotExist()
    {
        // Arrange
        var request = CreateUpdateEmployeeRequest();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _service.UpdateEmployeeAsync(999, request));

        Assert.Equal("Employee not found.", exception.Message);
    }

    #endregion

    //#region DeleteEmployeeAsync Tests

    //[Fact]
    //public async Task DeleteEmployeeAsync_DeletesEmployee_WhenEmployeeExists()
    //{
    //    // Arrange
    //    var employee = CreateEmployee();
    //    _context.Employees.Add(employee);
    //    await _context.SaveChangesAsync();

    //    var leaveRequest = new LeaveRequest
    //    {
    //        EmployeeId = employee.Id,
    //        LeaveType = "Casual",
    //        StartDate = DateTime.Today,
    //        EndDate = DateTime.Today.AddDays(2),
    //        Status = "Pending",
    //        Reason = "Personal Work"
    //    };

    //    var leaveBalance = new LeaveBalance
    //    {
    //        EmployeeId = employee.Id,
    //        LeaveType = "Casual",
    //        TotalDays = 20,
    //        UsedDays = 2
    //    };

    //    _context.LeaveRequests.Add(leaveRequest);
    //    _context.LeaveBalances.Add(leaveBalance);
    //    await _context.SaveChangesAsync();

    //    // Act
    //    await _service.DeleteEmployeeAsync(employee.Id);

    //    // Assert
    //    Assert.Empty(_context.Employees);
    //    Assert.Empty(_context.LeaveRequests);
    //    Assert.Empty(_context.LeaveBalances);
    //}

    //[Fact]
    //public async Task DeleteEmployeeAsync_ThrowsBadRequestException_WhenIdIsZero()
    //{
    //    // Act & Assert
    //    var exception = await Assert.ThrowsAsync<BadRequestException>(
    //        () => _service.DeleteEmployeeAsync(0));

    //    Assert.Equal("Employee ID must be greater than 0.", exception.Message);
    //}

    //[Fact]
    //public async Task DeleteEmployeeAsync_ThrowsNotFoundException_WhenEmployeeDoesNotExist()
    //{
    //    // Act & Assert
    //    var exception = await Assert.ThrowsAsync<NotFoundException>(
    //        () => _service.DeleteEmployeeAsync(999));

    //    Assert.Equal("Employee with ID 999 not found.", exception.Message);
    //}

    //#endregion

    #region UpdateEmployeePasswordAsync Tests

    [Fact]
    public async Task UpdateEmployeePasswordAsync_UpdatesPassword_WhenCurrentPasswordIsCorrect()
    {
        // Arrange
        var user = CreateUser();
        var employee = CreateEmployee();
        employee.Id = 1;
        employee.User = user;
        user.Employee = employee;

        _context.Users.Add(user);
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        var request = new UpdateEmployeePasswordDto
        {
            EmployeeId = employee.Id,
            CurrentPassword = "Password123",
            NewPassword = "NewPassword456"
        };

        // Act
        var result = await _service.UpdateEmployeePasswordAsync(request);

        // Assert
        Assert.Equal("Password updated successfully.", result);

        // Verify password was changed
        var updatedUser = await _context.Users.FindAsync(user.Id);
        Assert.True(BCrypt.Net.BCrypt.Verify("NewPassword456", updatedUser!.PasswordHash));
    }

    //[Fact]
    //public async Task UpdateEmployeePasswordAsync_ThrowsBadRequestException_WhenEmployeeIdIsZero()
    //{
    //    // Arrange
    //    var request = new UpdateEmployeePasswordDto
    //    {
    //        EmployeeId = 0,
    //        CurrentPassword = "Password123",
    //        NewPassword = "NewPassword456"
    //    };

    //    // Act & Assert
    //    var exception = await Assert.ThrowsAsync<BadRequestException>(
    //        () => _service.UpdateEmployeePasswordAsync(request));

    //    Assert.Equal("Invalid employee details", exception.Message);
    //}

    //[Fact]
    //public async Task UpdateEmployeePasswordAsync_ThrowsNotFoundException_WhenEmployeeDoesNotExist()
    //{
    //    // Arrange
    //    var request = new UpdateEmployeePasswordDto
    //    {
    //        EmployeeId = 999,
    //        CurrentPassword = "Password123",
    //        NewPassword = "NewPassword456"
    //    };

    //    // Act & Assert
    //    var exception = await Assert.ThrowsAsync<NotFoundException>(
    //        () => _service.UpdateEmployeePasswordAsync(request));

    //    Assert.Equal("Employee not found.", exception.Message);
    //}

    //[Fact]
    //public async Task UpdateEmployeePasswordAsync_ThrowsUnauthorizedAccessException_WhenCurrentPasswordIsIncorrect()
    //{
    //    // Arrange
    //    var user = CreateUser();
    //    var employee = CreateEmployee();
    //    employee.Id = 1;
    //    employee.User = user;
    //    user.Employee = employee;

    //    _context.Users.Add(user);
    //    _context.Employees.Add(employee);
    //    await _context.SaveChangesAsync();

    //    var request = new UpdateEmployeePasswordDto
    //    {
    //        EmployeeId = employee.Id,
    //        CurrentPassword = "WrongPassword",
    //        NewPassword = "NewPassword456"
    //    };

    //    // Act & Assert
    //    var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
    //        () => _service.UpdateEmployeePasswordAsync(request));

    //    Assert.Equal("Current password is incorrect.", exception.Message);
    //}

    #endregion

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}