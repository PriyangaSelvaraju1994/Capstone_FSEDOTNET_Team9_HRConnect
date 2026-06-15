using System.ComponentModel.DataAnnotations;

namespace HRConnect.API.DTOs.Auth;

public class RegisterRequestDto
{
    public string FullName { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public string Department { get; set; } = string.Empty;

    public string Designation { get; set; } = string.Empty;

    public DateTime? DateOfJoining { get; set; }
} 
