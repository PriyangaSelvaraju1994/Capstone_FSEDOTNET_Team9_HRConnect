using HRConnect.API.DTOs;
namespace HRConnect.API.Services.Interfaces;

public interface ILeaveService
{
    Task<string> ApplyLeaveAsync(CreateLeaveRequestDto request);

    Task<IEnumerable<LeaveRequestDto>> GetMyLeavesAsync(int employeeId);

    Task<string> UpdateStatusAsync(
        int leaveId,
        UpdateLeaveStatusDto request);

    Task<List<LeaveBalanceDto>> GetLeaveBalanceAsync(int employeeId);
}