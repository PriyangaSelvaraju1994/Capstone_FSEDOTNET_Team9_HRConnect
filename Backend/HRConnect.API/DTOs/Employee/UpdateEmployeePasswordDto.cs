public class UpdateEmployeePasswordDto
{
    public int EmployeeId { get; set; }
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}