public class LeaveBalanceDto
{
    public int EmployeeId { get; set; }
    public string LeaveType { get; set; } = string.Empty;
    public int RemainingDays { get; set; }
    public int TotalDays { get; set; }
    public int UsedDays { get; set; }
}