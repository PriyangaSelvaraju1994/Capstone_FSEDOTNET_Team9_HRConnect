namespace HRConnect.API.DTOs.Employee;
public class CreateEmployeeDto
{
    public int UserId { get; set; }
    public string? Department { get; set; } = string.Empty;
    public string? Designation { get; set; } = string.Empty;
    public DateTime? JoiningDate { get; set; }
    public bool IsActive { get; set; } = false; // New employees are inactive by default until HR activates them after verification
}