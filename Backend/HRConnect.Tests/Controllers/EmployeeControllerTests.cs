using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using HRConnect.API.Controllers;
using HRConnect.API.Services.Interfaces;
using HRConnect.API.DTOs.Employee;

namespace HRConnect.Tests.Controllers;
public class EmployeeControllerTests
{
    private readonly Mock<IEmployeeService> _mockEmployeeService;
    private readonly EmployeeController _controller;

    public EmployeeControllerTests()
    {
        _mockEmployeeService = new Mock<IEmployeeService>();
        _controller = new EmployeeController(_mockEmployeeService.Object);
    }

    #region GetEmployees Tests
    [Fact]
    public async Task GetEmployees_ReturnsOkWithEmployeeList()
    {
        // Arrange
        var employees = new List<EmployeeDto>
        {
            new EmployeeDto
            {
                Id = 1,
                UserId = 1,
                FullName = "John Doe",
                Email = "john@example.com",
                Department = "IT",
                Designation = "Developer",
                JoiningDate = DateTime.Now,
                IsActive = true
            },
            new EmployeeDto
            {
                Id = 2,
                UserId = 2,
                FullName = "Jane Smith",
                Email = "jane@example.com",
                Department = "HR",
                Designation = "Manager",
                JoiningDate = DateTime.Now,
                IsActive = true
            }
        };
        _mockEmployeeService
            .Setup(x => x.GetAllEmployeesAsync())
            .ReturnsAsync(employees);
        // Act
        var result = await _controller.GetEmployees();
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedEmployees = Assert.IsAssignableFrom<IEnumerable<EmployeeDto>>(okResult.Value);
        Assert.Equal(2, returnedEmployees.Count());

        _mockEmployeeService.Verify(x => x.GetAllEmployeesAsync(), Times.Once);
    }

    #endregion
    #region GetById Tests

    [Fact]
    public async Task GetById_WithValidId_ReturnsOkWithEmployee()
    {
        // Arrange
        var employeeId = 1;
        var employee = new EmployeeDto
        {
            Id = employeeId,
            UserId = 1,
            FullName = "John Doe",
            Email = "john@example.com",
            Department = "IT",
            Designation = "Developer",
            JoiningDate = DateTime.Now,
            IsActive = true
        };

        _mockEmployeeService
            .Setup(x => x.GetEmployeeByIdAsync(employeeId))
            .ReturnsAsync(employee);

        // Act
        var result = await _controller.GetById(employeeId);
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedEmployee = Assert.IsType<EmployeeDto>(okResult.Value);
        Assert.Equal(employeeId, returnedEmployee.Id);
        Assert.Equal("John Doe", returnedEmployee.FullName);

        _mockEmployeeService.Verify(x => x.GetEmployeeByIdAsync(employeeId), Times.Once);
    }
    #endregion
    #region Create Tests

    [Fact]
    public async Task Create_WithValidRequest_ReturnsCreatedAtAction()
    {
        // Arrange
        var request = new CreateEmployeeDto
        {
            UserId = 1,
            Department = "IT",
            Designation = "Developer",
            JoiningDate = DateTime.Now,
            IsActive = false
        };
        var createdEmployee = new EmployeeDto
        {
            Id = 1,
            UserId = request.UserId,
            FullName = "John Doe",
            Email = "john@example.com",
            // AFTER (fixed):
            Department = request.Department,
            Designation = request.Designation,
            JoiningDate = request.JoiningDate ?? DateTime.Today,  // ← Add null-coalescing operator
            IsActive = request.IsActive
        };

        _mockEmployeeService
            .Setup(x => x.CreateEmployeeAsync(request))
            .ReturnsAsync(createdEmployee);

        // Act
        var result = await _controller.Create(request);
        // Assert
        var createdAtActionResult = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(_controller.GetById), createdAtActionResult.ActionName);
        Assert.Equal(createdEmployee.Id, ((EmployeeDto)createdAtActionResult.Value!).Id);
        var routeValues = createdAtActionResult.RouteValues;
        Assert.NotNull(routeValues);
        Assert.Equal(createdEmployee.Id, routeValues["id"]);

        _mockEmployeeService.Verify(x => x.CreateEmployeeAsync(request), Times.Once);
    }
    #endregion
    #region Update Tests

    [Fact]
    public async Task Update_WithValidRequest_ReturnsOkWithUpdatedEmployee()
    {
        // Arrange
        var employeeId = 1;
        var request = new UpdateEmployeeDto
        {
            Department = "IT",
            Designation = "Senior Developer",
            JoiningDate = DateTime.Now.AddYears(-1),
            IsActive = true
        };
        var updatedEmployee = new EmployeeDto
        {
            Id = employeeId,
            UserId = 1,
            FullName = "John Doe",
            Email = "john@example.com",
            Department = request.Department,
            Designation = request.Designation,
            JoiningDate = request.JoiningDate,
            IsActive = request.IsActive
        };
        _mockEmployeeService
            .Setup(x => x.UpdateEmployeeAsync(employeeId, request))
            .ReturnsAsync(updatedEmployee);
        // Act
        var result = await _controller.Update(employeeId, request);
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedEmployee = Assert.IsType<EmployeeDto>(okResult.Value);
        Assert.Equal(employeeId, returnedEmployee.Id);
        Assert.Equal("Senior Developer", returnedEmployee.Designation);

        _mockEmployeeService.Verify(x => x.UpdateEmployeeAsync(employeeId, request), Times.Once);
    }
    #endregion

    #region Delete Tests

    [Fact]
    public async Task Delete_WithValidId_ReturnsNoContent()
    {
        // Arrange
        var employeeId = 1;

        _mockEmployeeService
            .Setup(x => x.DeleteEmployeeAsync(employeeId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.Delete(employeeId);

        // Assert
        Assert.IsType<NoContentResult>(result);

        _mockEmployeeService.Verify(x => x.DeleteEmployeeAsync(employeeId), Times.Once);
    }

    #endregion

    #region UpdateEmployeePassword Tests

    [Fact]
    public async Task UpdateEmployeePassword_WithValidRequest_ReturnsSuccessMessage()
    {
        // Arrange
        var request = new UpdateEmployeePasswordDto
        {
            EmployeeId = 1,
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword123!"
        };

        _mockEmployeeService
            .Setup(x => x.UpdateEmployeePasswordAsync(request))
            .ReturnsAsync("Password updated successfully.");

        // Act
        var result = await _controller.UpdateEmployeePassword(request);

        // Assert
        Assert.Equal("Password updated successfully.", result);

        _mockEmployeeService.Verify(x => x.UpdateEmployeePasswordAsync(request), Times.Once);
    }
    #endregion
}