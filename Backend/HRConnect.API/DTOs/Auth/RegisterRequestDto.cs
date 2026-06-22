public class RegisterRequestDto
{
    public string FullName { get; set; }

    public string Email { get; set; }

    public string Password { get; set; }

    public string? Department { get; set; }
    public string? Designation { get; set; }
    public DateTime? DateOfJoining { get; set; }
}