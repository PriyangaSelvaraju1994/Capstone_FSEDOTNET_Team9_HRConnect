using HRConnect.API.DTOs.Employee;
using HRConnect.API.Services.Interfaces;
using HRConnect.API.Data;
using HRConnect.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace HRConnect.API.Services.Implementations;

public class EmployeeService : IEmployeeService
{
    private readonly ApplicationDbContext _context;

    public EmployeeService(ApplicationDbContext context)
    {
        _context = context;
    }
    public async Task<IEnumerable<EmployeeDto>> GetAllEmployeesAsync()
    {
        return await _context.Employees
            .Select(e => new EmployeeDto
            {
                Id = e.Id,
                UserId = e.UserId,
                Department = e.Department,
                Designation = e.Designation,
                JoiningDate = e.JoiningDate
            })
            .ToListAsync();
    }

    public async Task<EmployeeDto?> GetEmployeeByIdAsync(int id)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employee == null)
            return null;

        return new EmployeeDto
        {
            Id = employee.Id,
            UserId = employee.UserId,
            Department = employee.Department,
            Designation = employee.Designation,
            JoiningDate = employee.JoiningDate
        };
    }

    public async Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto request)
    {
        var employee = new Employee
        {
            UserId = request.UserId,
            Department = request.Department,
            Designation = request.Designation,
            JoiningDate = request.JoiningDate
        };

        _context.Employees.Add(employee);

        await _context.SaveChangesAsync();

        return new EmployeeDto
        {
            Id = employee.Id,
            UserId = employee.UserId,
            Department = employee.Department,
            Designation = employee.Designation,
            JoiningDate = employee.JoiningDate
        };
    }

    public async Task<EmployeeDto?> UpdateEmployeeAsync(
            int id,
            UpdateEmployeeDto request)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employee == null)
            return null;

        employee.Department = request.Department;
        employee.Designation = request.Designation;
        employee.JoiningDate = request.JoiningDate;

        await _context.SaveChangesAsync();

        return new EmployeeDto
        {
            Id = employee.Id,
            UserId = employee.UserId,
            Department = employee.Department,
            Designation = employee.Designation,
            JoiningDate = employee.JoiningDate
        };
    }

    public async Task<bool> DeleteEmployeeAsync(int id)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employee == null)
            return false;

        _context.Employees.Remove(employee);

        await _context.SaveChangesAsync();

        return true;
    }
}