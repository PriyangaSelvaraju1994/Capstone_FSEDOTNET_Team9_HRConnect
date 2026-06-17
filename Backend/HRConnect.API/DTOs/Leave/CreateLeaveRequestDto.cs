namespace HRConnect.API.DTOs;

public class CreateLeaveRequestDto
{
    public int EmployeeId { get; set; }

    public required string LeaveType { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public required string Reason { get; set; }
        // Audit Fields
    public DateTime? CreatedDate { get; set; }

    public string CreatedBy { get; set; } = string.Empty;

    public DateTime? UpdatedDate { get; set; }

    public string? UpdatedBy { get; set; }
}