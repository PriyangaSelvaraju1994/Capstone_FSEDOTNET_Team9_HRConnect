using HRConnect.API.Data;
using HRConnect.API.DTOs;
using HRConnect.API.Entities;
using HRConnect.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using HRConnect.API.Validators;
using HRConnect.API.Exceptions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;

namespace HRConnect.API.Services.Implementations;

public class LeaveService : ILeaveService
{
    private readonly ApplicationDbContext _context;

    public LeaveService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string> ApplyLeaveAsync(
        CreateLeaveRequestDto request)
    {
        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId);

        // Validation: Employee must exist
        if (!employeeExists)
            throw new NotFoundException("Employee not found");

        // Validation: End date cannot be earlier than start date
        if (request.EndDate < request.StartDate)
        {
            throw new ValidationException(
                "End date cannot be earlier than start date.");
        }

// cannot apply leave on holidays
        var holidays = await _context.Holidays
            .Where(h =>
                h.HolidayDate.Date >= request.StartDate.Date &&
                h.HolidayDate.Date <= request.EndDate.Date)
            .ToListAsync();

        if (holidays.Any())
        {
            throw new ValidationException(
                "Leave cannot be applied on holidays.");
        }
        //condition to check if the start date is more than 15 days in the past
        if (request.StartDate < DateTime.Today.AddDays(-15))
        {
            throw new ValidationException(
                "Leave cannot be applied more than 15 days in the past.");
        }

        //condition to check if the date range only has weekends
        if (CalculateLeaveDays(request.StartDate, request.EndDate) == 0)
        {
            throw new ValidationException(
                "Leave cannot be applied for a period that only includes weekends/Holidays.");
        }

        var overlappingLeave = await _context.LeaveRequests?
            .AnyAsync(l =>
                l.EmployeeId == request.EmployeeId &&
                (l.Status == LeaveStatus.Pending.ToString() ||
                l.Status == LeaveStatus.Approved.ToString()) &&
                request.StartDate <= l.EndDate &&
                request.EndDate >= l.StartDate);

        // Validation: Check for overlapping leave requests
        if (overlappingLeave)
        {
            throw new ValidationException(
                "You have an overlapping leave request during this period.");
        }
        var leave = new LeaveRequest
        {
            EmployeeId = request.EmployeeId,
            LeaveType = request.LeaveType,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Reason = request.Reason,
            Status = "Pending"
        };
     var leaveDays =
    CalculateLeaveDays(request.StartDate, request.EndDate);

    var balance = await _context.LeaveBalances
    .FirstOrDefaultAsync(lb =>
        lb.EmployeeId == request.EmployeeId &&
        lb.LeaveType == request.LeaveType);
        var availableDays =
    balance.TotalDays - balance.UsedDays;

    // Validation: Check if employee has enough leave balance
    if (leaveDays > availableDays)
    {
        throw new ValidationException(
    $"Insufficient leave balance. Available days: {availableDays}");
    }
        _context.LeaveRequests.Add(leave);

        await _context.SaveChangesAsync();

        return "Leave request submitted successfully";
    }

    public async Task<IEnumerable<LeaveRequestDto>>
        GetMyLeavesAsync(int employeeId)
    {
        return await _context.LeaveRequests
            .Where(l => l.EmployeeId == employeeId)
            .Select(l => new LeaveRequestDto
            {
                Id = l.Id,
                LeaveType = l.LeaveType,
                StartDate = l.StartDate,
                EndDate = l.EndDate,
                Status = l.Status,
                Reason = l.Reason
            })
            .ToListAsync();
    }

    public async Task<string> UpdateStatusAsync(
        int leaveId,
        UpdateLeaveStatusDto request)
    {
        var leave = await _context.LeaveRequests
            .FirstOrDefaultAsync(l => l.Id == leaveId);

        if (leave == null)
            throw new NotFoundException("Leave request not found");

             var leaveDays =
                (leave.EndDate.Date - leave.StartDate.Date).Days + 1;

            var balance = await _context.LeaveBalances
                .FirstOrDefaultAsync(lb =>
                    lb.EmployeeId == leave.EmployeeId &&
                    lb.LeaveType == leave.LeaveType);
        if (request.Status.Equals(
        LeaveStatus.Approved.ToString(),
        StringComparison.OrdinalIgnoreCase))
        {
            balance.UsedDays += leaveDays;    
        }
        else if (request.Status.Equals(
                LeaveStatus.Cancelled.ToString(),
                StringComparison.OrdinalIgnoreCase))
        {
            
            balance.UsedDays -= leaveDays;
        }
        
        leave.Status = request.Status;
        _context.LeaveBalances.Update(balance);
        await _context.SaveChangesAsync();

        return "Leave status updated successfully";
    }

    public async Task<List<LeaveBalanceDto>> GetLeaveBalanceAsync(int employeeId)
    {
        var balances = await _context.LeaveBalances
            .Where(lb => lb.EmployeeId == employeeId)
            .Select(lb => new LeaveBalanceDto
            {
                EmployeeId = lb.EmployeeId,
                LeaveType = lb.LeaveType,
                TotalDays = lb.TotalDays,
                UsedDays = lb.UsedDays,
                RemainingDays = lb.TotalDays - lb.UsedDays
            })
            .ToListAsync();

        return balances;
    }

    public async Task<List<LeaveRequestDto>> GetAllLeavesAsync()
    {
        var leaves = await _context.LeaveRequests
    .Include(l => l.Employee)
    .ThenInclude(e => e.User)
    .ToListAsync();
        var result = leaves.Select(l => new LeaveRequestDto
            {
                Id = l.Id,
                EmployeeId = l.EmployeeId,
                EmployeeName = l.Employee.User.FullName,
                LeaveType = l.LeaveType.ToString(),
                StartDate = l.StartDate,
                EndDate = l.EndDate,
                Status = l.Status.ToString(),
                Reason = l.Reason
            }).ToList();

//sort by status pending first, then by start date descending
        result = result.OrderBy(l => l.Status)
             .ThenByDescending(l => l.StartDate)
             .ToList();
        return result;
    }

    public async Task<string> CancelLeaveAsync(int leaveId)
    {
        var leave = await _context.LeaveRequests
            .FirstOrDefaultAsync(l => l.Id == leaveId);

        if (leave == null)
            throw new NotFoundException("Leave request not found");

        leave.Status = LeaveStatus.Cancelled.ToString();
        _context.LeaveRequests.Update(leave);
        await _context.SaveChangesAsync();

        return "Leave request cancelled successfully";
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