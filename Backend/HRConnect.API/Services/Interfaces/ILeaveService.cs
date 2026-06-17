using HRConnect.API.DTOs;
using HRConnect.API.DTOs.Dashboard;
namespace HRConnect.API.Services.Interfaces;

public interface ILeaveService
{
    Task<string> ApplyLeaveAsync(CreateLeaveRequestDto request);

    Task<IEnumerable<LeaveRequestDto>> GetMyLeavesAsync(int employeeId);

    Task<string> UpdateStatusAsync(
        int leaveId,
        UpdateLeaveStatusDto request);

    Task<List<LeaveBalanceDto>> GetLeaveBalanceAsync(int employeeId);

    Task<List<LeaveRequestDto>> GetAllLeavesAsync();

    Task<string> CancelLeaveAsync(int leaveId);
}