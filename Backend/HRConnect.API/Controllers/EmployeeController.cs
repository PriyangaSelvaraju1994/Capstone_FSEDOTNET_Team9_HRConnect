using Microsoft.AspNetCore.Mvc;
using HRConnect.API.Services.Interfaces;
using HRConnect.API.DTOs.Employee;
using Microsoft.AspNetCore.Authorization;

namespace HRConnect.API.Controllers;

[ApiController]
[Route("api/employees")]
[Authorize]
public class EmployeeController : ControllerBase
{
    private readonly IEmployeeService _employeeService;

    public EmployeeController(IEmployeeService employeeService)
    {
        _employeeService = employeeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetEmployees()
    {
        var employees = await _employeeService.GetAllEmployeesAsync();
        return Ok(employees);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var employee = await _employeeService.GetEmployeeByIdAsync(id);

        if (employee == null)
            return NotFound();

        return Ok(employee);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateEmployeeDto request)
    {
        var employee =
            await _employeeService.CreateEmployeeAsync(request);

        return CreatedAtAction(
            nameof(GetById),
            new { id = employee.Id },
            employee);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        int id,
        UpdateEmployeeDto request)
    {
        var employee =
            await _employeeService.UpdateEmployeeAsync(
                id,
                request);

        if (employee == null)
            return NotFound();

        return Ok(employee);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted =
            await _employeeService.DeleteEmployeeAsync(id);

        if (!deleted)
            return NotFound();

        return NoContent();
    }
}