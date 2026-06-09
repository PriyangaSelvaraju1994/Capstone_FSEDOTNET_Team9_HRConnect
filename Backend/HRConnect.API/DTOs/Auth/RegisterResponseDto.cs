namespace HRConnect.API.DTOs.Auth;

public class RegisterResponseDto
{
    public int Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public bool IsAdmin { get; set; }
}
