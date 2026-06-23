namespace HRConnect.API.Entities;

public class Employee
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string? Department { get; set; } = string.Empty;

    public string? Designation { get; set; } = string.Empty;

    public DateTime? JoiningDate { get; set; }

    public bool IsActive { get; set; } // Indicates if the employee is active or not. New employees are inactive by default until HR activates them after verification.

    // Navigation Property
    public User? User { get; set; }

    public ICollection<LeaveRequest> LeaveRequests { get; set; }
        = new List<LeaveRequest>();

    public ICollection<LeaveBalance> LeaveBalances { get; set; }
        = new List<LeaveBalance>();
}