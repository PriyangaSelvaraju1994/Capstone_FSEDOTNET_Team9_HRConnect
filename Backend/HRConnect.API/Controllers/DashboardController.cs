using HRConnect.API.DTOs;
using HRConnect.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
namespace HRConnect.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("dashboard-summary")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        var summary = await _dashboardService.GetDashboardSummaryAsync();
        return Ok(summary);
    }

    [HttpGet("recent-activities")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetRecentActivities()
    {
        var result = await _dashboardService.GetRecentActivitiesAsync();

        return Ok(result);
    }
}