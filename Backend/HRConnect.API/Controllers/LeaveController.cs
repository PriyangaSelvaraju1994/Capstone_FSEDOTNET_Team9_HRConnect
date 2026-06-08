using Microsoft.AspNetCore.Mvc;
namespace HRConnect.API.Controllers;
[ApiController]
[Route("api/leaves")]
public class LeaveController : ControllerBase
{
    [HttpPost]
    public IActionResult ApplyLeave(CreateLeaveRequestDto request)
    {
        return Ok("Leave request submitted successfully");
    }

    [HttpGet("mine")]
    public IActionResult GetMyLeaves()
    {
        return Ok("Retrieved my leaves successfully");
    }

    [HttpPut("{id}/status")]
    public IActionResult UpdateStatus(
        Guid id,
        UpdateLeaveStatusDto request)
    {
        return Ok("Leave status updated successfully");
    }
}