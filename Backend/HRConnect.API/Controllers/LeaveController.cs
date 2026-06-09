using HRConnect.API.DTOs;
using HRConnect.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HRConnect.API.Controllers;

[ApiController]
[Route("api/leaves")]
public class LeaveController : ControllerBase
{
    private readonly ILeaveService _leaveService;

    public LeaveController(
        ILeaveService leaveService)
    {
        _leaveService = leaveService;
    }

    [HttpPost]
    public async Task<IActionResult> ApplyLeave(
        CreateLeaveRequestDto request)
    {
   
    var result =
        await _leaveService.ApplyLeaveAsync(request);

        return Ok(result);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMyLeaves(
        int employeeId)
    {
        employeeId = 2; // For testing, replace with actual employee ID from auth context
        var leaves =
            await _leaveService.GetMyLeavesAsync(employeeId);

        return Ok(leaves);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        UpdateLeaveStatusDto request)
    {
        var result =
            await _leaveService.UpdateStatusAsync(
                id,
                request);

        return Ok(result);
    }

    [HttpGet("leavebalances/{employeeId}")]
    public async Task<IActionResult> GetLeaveBalance(
        int employeeId)
    {
        var balance =
            await _leaveService.GetLeaveBalanceAsync(employeeId);

        return Ok(balance);
    }
}