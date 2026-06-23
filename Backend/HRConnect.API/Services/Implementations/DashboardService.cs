using HRConnect.API.Data;
using HRConnect.API.DTOs.Dashboard;
using HRConnect.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
namespace HRConnect.API.Services.Implementations;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

   public async Task<DashboardSummaryDto> GetDashboardSummaryAsync()
    {
        var pendingCount = await _context.LeaveRequests
            .CountAsync(l => l.Status == LeaveStatus.Pending.ToString());

        var approvedThisMonth = await _context.LeaveRequests
            .CountAsync(l =>
                l.Status == LeaveStatus.Approved.ToString() &&
                l.StartDate.Month == DateTime.Now.Month &&
                l.StartDate.Year == DateTime.Now.Year);

        //filter active employees
        var activeEmployees = await _context.Employees
            .CountAsync(e => e.IsActive);

        var onLeaveToday = await _context.LeaveRequests
            .CountAsync(l =>
                l.Status == LeaveStatus.Approved.ToString() &&
                l.StartDate <= DateTime.Today &&
                l.EndDate >= DateTime.Today);

        return new DashboardSummaryDto
        {
            PendingCount = pendingCount,
            ApprovedThisMonth = approvedThisMonth,
            ActiveEmployees = activeEmployees,
            OnLeaveToday = onLeaveToday
        };
    }

    public async Task<List<RecentActivityDto>> GetRecentActivitiesAsync()
{
    var leaveRequests = await _context.LeaveRequests
    .Include(l => l.Employee)
        .ThenInclude(e => e.User)
    .OrderByDescending(l => l.CreatedDate)
    .Take(5)
    .ToListAsync();

var activities = leaveRequests.Select(l => new RecentActivityDto
{
    Id = l.Id,
    ActorId = l.EmployeeId,
    ActorName = l.Employee?.User?.FullName ?? "",

    ActorInitials = string.Join("",
        (l.Employee?.User?.FullName ?? "")
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x[0]))
            .ToUpper(),

    Action = "requested",
    LeaveType = l.LeaveType,
    Days = CalculateLeaveDays(l.StartDate, l.EndDate),
    StartDate = l.StartDate,
    EndDate = l.EndDate,
    OccurredAt = l.CreatedDate ?? DateTime.MinValue,
    Status = l.Status
}).ToList();

return activities;

}

    private int CalculateLeaveDays(DateTime startDate, DateTime endDate)
    {
        int days = 0;

        for (var date = startDate.Date;
            date <= endDate.Date;
            date = date.AddDays(1))
        {
            bool isHoliday = _context.Holidays
                .Any(h => h.HolidayDate.Date == date);
            if (date.DayOfWeek != DayOfWeek.Saturday &&
                date.DayOfWeek != DayOfWeek.Sunday && !isHoliday)
            {
                days++;
            }
        }

        return days;
    }
}