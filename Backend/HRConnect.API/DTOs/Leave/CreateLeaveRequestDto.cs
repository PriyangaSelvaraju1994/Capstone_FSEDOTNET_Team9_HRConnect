namespace HRConnect.API.DTOs;

public class CreateLeaveRequestDto
{
    public int EmployeeId { get; set; }

    public required string LeaveType { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public required string Reason { get; set; }
}