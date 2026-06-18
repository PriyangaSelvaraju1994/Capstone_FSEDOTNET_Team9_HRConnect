namespace HRConnect.API.DTOs.Employee;
public class UpdateEmployeeDto
{
    public string Department { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public DateTime JoiningDate { get; set; }
    public bool IsActive { get; set; }
    
}