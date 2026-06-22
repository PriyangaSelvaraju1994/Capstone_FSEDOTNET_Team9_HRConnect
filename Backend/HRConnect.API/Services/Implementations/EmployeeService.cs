using HRConnect.API.Data;
using HRConnect.API.DTOs.Employee;
using HRConnect.API.Entities;
using HRConnect.API.Exceptions;
using HRConnect.API.Helpers;
using HRConnect.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HRConnect.API.Services.Implementations;

public class EmployeeService : IEmployeeService
{
    private readonly ApplicationDbContext _context;
    private readonly DefaultLeaveBalancesForNewEmployee _leaveBalanceHelper;

    public EmployeeService(ApplicationDbContext context, DefaultLeaveBalancesForNewEmployee leaveBalanceHelper)
    {
        _context = context;
        _leaveBalanceHelper = leaveBalanceHelper;
    }

    public async Task<IEnumerable<EmployeeDto>> GetAllEmployeesAsync()
    {
        //Fetching all employees from the database and ordering them by JoiningDate in descending order
        return await _context.Employees
            .OrderByDescending(e => e.JoiningDate)
            .Select(e => new EmployeeDto
            {
                Id = e.Id,
                UserId = e.UserId,
                FullName = e.User != null ? e.User.FullName : string.Empty,
                Department = e.Department,
                Designation = e.Designation,
                JoiningDate = e.JoiningDate,
                Email = e.User != null ? e.User.Email : string.Empty,
                IsActive = e.IsActive
            })
            .ToListAsync();
    }

    public async Task<EmployeeDto> GetEmployeeByIdAsync(int id)
    {
        //Checking if Employee ID is valid
        if (id <= 0)
        {
            throw new BadRequestException("Employee ID is invalid.");
        }
        //Fetching the employee from the database
        var employee = await _context.Employees
            .Select(e => new EmployeeDto
            {
                Id = e.Id,
                UserId = e.UserId,
                FullName = e.User != null ? e.User.FullName : string.Empty,
                Department = e.Department,
                Designation = e.Designation,
                JoiningDate = e.JoiningDate,
                Email = e.User != null ? e.User.Email : string.Empty,
                IsActive = e.IsActive
            })
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employee == null)
        {
            throw new NotFoundException($"Employee with ID {id} not found.");
        }
        return employee;
    }

    public async Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto request)
    {
        //Checking if UserID is valid
        if (request.UserId <= 0)
        {
            throw new BadRequestException("UserId must be greater than 0.");
        }
        //Checking if Userid exists in Users table
        var userExists = await _context.Users.AnyAsync(u => u.Id == request.UserId);
        if (!userExists)
        {
            throw new NotFoundException($"User with ID {request.UserId} does not exist.");
        }
        //Checking if employee already exists for this user
        var employeeExists = await _context.Employees.AnyAsync(e => e.UserId == request.UserId);
        if (employeeExists)
        {
            throw new ConflictException($"An employee record already exists for User ID {request.UserId}.");
        }

        var employee = new Employee
        {
            UserId = request.UserId,
            Department = request.Department.Trim(),
            Designation = request.Designation.Trim(),
            JoiningDate = request.JoiningDate,
            IsActive = false // New employees are inactive by default until HR activates them after verification
        };
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        // Creating default leave balances using helper
        await _leaveBalanceHelper.CreateDefaultLeaveBalancesAsync(employee.Id);

        return new EmployeeDto
        {
            Id = employee.Id,
            UserId = employee.UserId,
            Department = employee.Department,
            Designation = employee.Designation,
            JoiningDate = employee.JoiningDate,
            Email = employee.User != null ? employee.User.Email : string.Empty,
            IsActive = employee.IsActive
        };
    }

    public async Task<EmployeeDto> UpdateEmployeeAsync(int id, UpdateEmployeeDto request)
    {   //Checking if EmployeeID is valid
        if (id <= 0)
        {
            throw new BadRequestException("Employee ID must be greater than 0.");
        }
        //Checking if Department is empty
        if (string.IsNullOrWhiteSpace(request.Department))
        {
            throw new BadRequestException("Department is required.");
        }
        //Checking if Designation is empty
        if (string.IsNullOrWhiteSpace(request.Designation))
        {
            throw new BadRequestException("Designation is required.");
        }
        //Fetching the employee from the database
        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Id == id);
        if (employee == null)
        {
            throw new NotFoundException($"Employee not found.");
        }

        employee.Department = request.Department.Trim();
        employee.Designation = request.Designation.Trim();
        employee.JoiningDate = request.JoiningDate;
        employee.IsActive = request.IsActive;

        await _context.SaveChangesAsync();
        return new EmployeeDto
        {
            Id = employee.Id,
            UserId = employee.UserId,
            Department = employee.Department,
            Designation = employee.Designation,
            JoiningDate = employee.JoiningDate,
            IsActive = employee.IsActive
        };
    }

    public async Task DeleteEmployeeAsync(int id)
    {
        // Checking if Employee ID is valid
        if (id <= 0)
        {
            throw new BadRequestException("Employee ID must be greater than 0.");
        }

        //Fetching the employee from the database with related leave data
        var employee = await _context.Employees
            .Include(e => e.LeaveRequests)
            .Include(e => e.LeaveBalances)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employee == null)
        {
            throw new NotFoundException($"Employee with ID {id} not found.");
        }

        // Delete related leave requests and balances first
        _context.LeaveRequests.RemoveRange(employee.LeaveRequests);
        _context.LeaveBalances.RemoveRange(employee.LeaveBalances);
        // Delete the employee
        _context.Employees.Remove(employee);

        await _context.SaveChangesAsync();
    }

    public async Task<string> UpdateEmployeePasswordAsync(UpdateEmployeePasswordDto request)
    {
        // Checking if Employee ID is valid
        if (request.EmployeeId <= 0)
        {
            throw new BadRequestException("Invalid employee details");
        }

        // Fetching the employee along with the related user
        var employee = await _context.Employees
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId);

        if (employee == null || employee.User == null)
        {
            throw new NotFoundException($"Employee not found.");
        }

        // Verifying the current password
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, employee.User.PasswordHash))
        {
            throw new UnauthorizedAccessException("Current password is incorrect.");
        }

        // Hashing the new password and updating it
        employee.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();
        return "Password updated successfully.";
    }
}