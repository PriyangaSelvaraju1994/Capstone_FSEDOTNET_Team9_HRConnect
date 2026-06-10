namespace HRConnect.API.DTOs.Employee;
public class CreateEmployeeDto
{
    public int UserId { get; set; }
    public string Department { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public DateTime JoiningDate { get; set; }
}