using HRConnect.API.DTOs.Dashboard;
namespace HRConnect.API.Services.Interfaces;
public interface IDashboardService
{
    Task<DashboardSummaryDto> GetDashboardSummaryAsync();
    Task<List<RecentActivityDto>> GetRecentActivitiesAsync();
}