using HRConnect.API.Data;
using HRConnect.API.Entities;

namespace HRConnect.API.Helpers;

public class DefaultLeaveBalancesForNewEmployee
{
    private readonly ApplicationDbContext _context;
    public DefaultLeaveBalancesForNewEmployee(ApplicationDbContext context)
    {
        _context = context;
    }
    public async Task CreateDefaultLeaveBalancesAsync(int employeeId)
    {
        var balances = new List<LeaveBalance>
        {
            new()
            {
                EmployeeId = employeeId,
                LeaveType = LeaveType.Casual.ToString(),
                TotalDays = 20,
                UsedDays = 0
            },
            new()
            {
                EmployeeId = employeeId,
                LeaveType = LeaveType.Sick.ToString(),
                TotalDays = 5,
                UsedDays = 0
            },
            new()
            {
                EmployeeId = employeeId,
                LeaveType = LeaveType.Earned.ToString(),
                TotalDays = 10,
                UsedDays = 0
            }
        };
        await _context.LeaveBalances.AddRangeAsync(balances);
        await _context.SaveChangesAsync();
    }
}