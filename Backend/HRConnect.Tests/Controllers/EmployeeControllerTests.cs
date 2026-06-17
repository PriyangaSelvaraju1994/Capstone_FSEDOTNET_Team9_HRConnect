using Moq;
using Xunit;
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

    // Positive Test - Returns list of employees successfully
    [Fact]
    public async Task GetEmployees_ShouldReturnOkResult_WithListOfEmployees()
    {
        // Arrange - Set up test data and mock behavior
        var expectedEmployees = new List<EmployeeDto>
        {
            new EmployeeDto
            {
                Id = 1,
                UserId = 101,
                Department = "IT",
                Designation = "Software Engineer",
                JoiningDate = new DateTime(2024, 1, 15)
            },
            new EmployeeDto
            {
                Id = 2,
                UserId = 102,
                Department = "HR",
                Designation = "HR Manager",
                JoiningDate = new DateTime(2023, 5, 20)
            }
        };
        //Mock Setup
        _mockEmployeeService.Setup(service => service.GetAllEmployeesAsync()).ReturnsAsync(expectedEmployees);

        // Act - Execute the method we're testing
        var result = await _controller.GetEmployees();
        // Assert - Verify the results
        var okResult = Assert.IsType<OkObjectResult>(result);
        var employees = Assert.IsAssignableFrom<IEnumerable<EmployeeDto>>(okResult.Value);
        Assert.Equal(expectedEmployees.Count, employees.Count());
        // Verify that the service method was called exactly once
        _mockEmployeeService.Verify(service => service.GetAllEmployeesAsync(),Times.Once);
    }

    // Negative Test - Returns empty list when no employees exist
    [Fact]
    public async Task GetEmployees_ShouldReturnEmptyList_WhenNoEmployeesExist()
    {
        // Arrange
        var emptyList = new List<EmployeeDto>();
        _mockEmployeeService
            .Setup(service => service.GetAllEmployeesAsync())
            .ReturnsAsync(emptyList);

        // Act
        var result = await _controller.GetEmployees();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var employees = Assert.IsAssignableFrom<IEnumerable<EmployeeDto>>(okResult.Value);
        Assert.Empty(employees);

        _mockEmployeeService.Verify(service => service.GetAllEmployeesAsync(), Times.Once);
    }

    // Positive Test - Returns employee when valid id is provided
    [Fact]
    public async Task GetById_ShouldReturnOkResult_WithEmployee()
    {
        // Arrange
        var expectedEmployee = new EmployeeDto
        {
            Id = 1,
            UserId = 101,
            Department = "IT",
            Designation = "Software Engineer",
            JoiningDate = new DateTime(2024, 1, 15)
        };
        _mockEmployeeService.Setup(service => service.GetEmployeeByIdAsync(1)).ReturnsAsync(expectedEmployee);

        // Act
        var result = await _controller.GetById(1);
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var employee = Assert.IsType<EmployeeDto>(okResult.Value);

        Assert.Equal(expectedEmployee.Id, employee.Id);
        Assert.Equal(expectedEmployee.UserId, employee.UserId);

        _mockEmployeeService.Verify(service => service.GetEmployeeByIdAsync(1),Times.Once);
    }

    // Negative Test - Throws exception when employee does not exist
    [Fact]
    public async Task GetById_ShouldThrowException_WhenEmployeeNotFound()
    {
        // Arrange
        _mockEmployeeService
            .Setup(service => service.GetEmployeeByIdAsync(999))
            .ThrowsAsync(new KeyNotFoundException("Employee with ID 999 not found"));

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _controller.GetById(999)
        );

        _mockEmployeeService.Verify(service => service.GetEmployeeByIdAsync(999), Times.Once);
    }

    // Positive Test - Creates employee successfully
    [Fact]
    public async Task Create_ShouldReturnCreatedAtActionResult_WhenEmployeeCreated()
    {
        // Arrange
        var request = new CreateEmployeeDto
        {
            UserId = 101,
            Department = "IT",
            Designation = "Software Engineer",
            JoiningDate = new DateTime(2024, 1, 15)
        };

        var createdEmployee = new EmployeeDto
        {
            Id = 1,
            UserId = 101,
            Department = "IT",
            Designation = "Software Engineer",
            JoiningDate = new DateTime(2024, 1, 15)
        };

        _mockEmployeeService.Setup(service => service.CreateEmployeeAsync(request)).ReturnsAsync(createdEmployee);
        // Act
        var result = await _controller.Create(request);
        // Assert
        var createdAtResult = Assert.IsType<CreatedAtActionResult>(result);
        var employee = Assert.IsType<EmployeeDto>(createdAtResult.Value);

        Assert.Equal(createdEmployee.Id, employee.Id);
        _mockEmployeeService.Verify(service => service.CreateEmployeeAsync(request),Times.Once);
    }

    // Negative Test - Throws exception when UserId already exists
    [Fact]
    public async Task Create_ShouldThrowException_WhenUserIdAlreadyExists()
    {
        // Arrange
        var request = new CreateEmployeeDto
        {
            UserId = 101,
            Department = "IT",
            Designation = "Software Engineer",
            JoiningDate = new DateTime(2024, 1, 15)
        };

        _mockEmployeeService
            .Setup(service => service.CreateEmployeeAsync(request))
            .ThrowsAsync(new InvalidOperationException("Employee with UserId 101 already exists"));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _controller.Create(request)
        );

        _mockEmployeeService.Verify(service => service.CreateEmployeeAsync(request), Times.Once);
    }

    // Positive Test - Updates employee successfully
    [Fact]
    public async Task Update_ShouldReturnOkResult_WhenEmployeeUpdated()
    {
        // Arrange
        var request = new UpdateEmployeeDto
        {
            Department = "IT",
            Designation = "Senior Software Engineer",
            JoiningDate = new DateTime(2024, 1, 15)
        };

        var updatedEmployee = new EmployeeDto
        {
            Id = 1,
            UserId = 101,
            Department = "IT",
            Designation = "Senior Software Engineer",
            JoiningDate = new DateTime(2024, 1, 15)
        };
        _mockEmployeeService.Setup(service => service.UpdateEmployeeAsync(1, request)).ReturnsAsync(updatedEmployee);
        // Act
        var result = await _controller.Update(1, request);
        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var employee = Assert.IsType<EmployeeDto>(okResult.Value);
        Assert.Equal(updatedEmployee.Id, employee.Id);
        _mockEmployeeService.Verify(service => service.UpdateEmployeeAsync(1, request),Times.Once);
    }

    // Negative Test - Throws exception when employee does not exist
    [Fact]
    public async Task Update_ShouldThrowException_WhenEmployeeNotFound()
    {
        // Arrange
        var request = new UpdateEmployeeDto
        {
            Department = "IT",
            Designation = "Senior Software Engineer",
            JoiningDate = new DateTime(2024, 1, 15)
        };
        _mockEmployeeService.Setup(service => service.UpdateEmployeeAsync(999, request)).ThrowsAsync(new KeyNotFoundException("Employee with ID 999 not found"));

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _controller.Update(999, request));

        _mockEmployeeService.Verify(service => service.UpdateEmployeeAsync(999, request), Times.Once);
    }

    // Positive Test - Deletes employee successfully
    [Fact]
    public async Task Delete_ShouldReturnNoContent_WhenEmployeeDeleted()
    {
        // Arrange
        _mockEmployeeService.Setup(service => service.DeleteEmployeeAsync(1)).Returns(Task.CompletedTask);
        // Act
        var result = await _controller.Delete(1);
        // Assert
        Assert.IsType<NoContentResult>(result);
        _mockEmployeeService.Verify(service => service.DeleteEmployeeAsync(1),Times.Once);
    }

    // Negative Test - Throws exception when employee does not exist
    [Fact]
    public async Task Delete_ShouldThrowException_WhenEmployeeNotFound()
    {
        // Arrange
        _mockEmployeeService.Setup(service => service.DeleteEmployeeAsync(999)).ThrowsAsync(new KeyNotFoundException("Employee with ID 999 not found"));
        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _controller.Delete(999));

        _mockEmployeeService.Verify(service => service.DeleteEmployeeAsync(999), Times.Once);
    }

    


}