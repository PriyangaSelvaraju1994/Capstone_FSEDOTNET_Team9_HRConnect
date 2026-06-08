using HRConnect.API.DTOs.Employee;

namespace HRConnect.API.Services.Interfaces;

public interface IEmployeeService
{
    Task<IEnumerable<EmployeeDto>> GetAllEmployeesAsync();

    Task<EmployeeDto?> GetEmployeeByIdAsync(int id);

    Task<EmployeeDto> CreateEmployeeAsync(
        CreateEmployeeDto request);

    Task<EmployeeDto?> UpdateEmployeeAsync(
        int id,
        UpdateEmployeeDto request);

    Task<bool> DeleteEmployeeAsync(int id);
}