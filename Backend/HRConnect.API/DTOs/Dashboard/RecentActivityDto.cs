namespace HRConnect.API.DTOs.Dashboard;

public class RecentActivityDto
{
    public int Id { get; set; }

    public int ActorId { get; set; }

    public string ActorName { get; set; } = string.Empty;

    public string ActorInitials { get; set; } = string.Empty;

    public string Action { get; set; } = string.Empty;

    public string LeaveType { get; set; } = string.Empty;

    public int Days { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public DateTime OccurredAt { get; set; }

    public string Status { get; set; } = string.Empty;
}