namespace HRConnect.API.Entities;

public class LeaveBalance
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    public string LeaveType { get; set; } = string.Empty;

    public int TotalDays { get; set; }

    public int UsedDays { get; set; }

    // Navigation Property
    public Employee? Employee { get; set; }
}