namespace HRConnect.API.DTOs.Dashboard;

public class DashboardSummaryDto
{
    public int PendingCount { get; set; }

    public int ApprovedThisMonth { get; set; }

    public int ActiveEmployees { get; set; }

    public int OnLeaveToday { get; set; }
}