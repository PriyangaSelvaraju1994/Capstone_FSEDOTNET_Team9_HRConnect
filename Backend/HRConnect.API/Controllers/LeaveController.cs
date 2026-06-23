using HRConnect.API.DTOs;
using HRConnect.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

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

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> ApplyLeave(
        [FromBody] CreateLeaveRequestDto request)
    {
   
    var result =
        await _leaveService.ApplyLeaveAsync(request);

        return Ok(result);
    }

    [Authorize]
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyLeaves(
        int employeeId)
    {
        var leaves =
            await _leaveService.GetMyLeavesAsync(employeeId);

        return Ok(leaves);
    }

    [Authorize(Roles = "Admin")]
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

    [Authorize]
    [HttpGet("leavebalances/{employeeId}")]
    public async Task<IActionResult> GetLeaveBalance(
        int employeeId)
    {
        var balance =
            await _leaveService.GetLeaveBalanceAsync(employeeId);

        return Ok(balance);
    }

    [Authorize]
    [HttpPost("cancelleave/{Id}")]
    public async Task<IActionResult> CancelLeave(
        int Id)
    {
        var result =
            await _leaveService.CancelLeaveAsync(Id);

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<IActionResult> GetAllLeaves()
    {
        var leaves = await _leaveService.GetAllLeavesAsync();

        return Ok(leaves);
    }
}