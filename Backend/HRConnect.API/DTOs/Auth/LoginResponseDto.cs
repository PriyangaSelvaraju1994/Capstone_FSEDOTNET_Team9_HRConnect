namespace HRConnect.API.DTOs.Auth;

public class LoginResponseDto
{
    public string Name { get; set; } = string.Empty;

    public int UserId { get; set; }

    public bool IsAdmin { get; set; }

    public string Token { get; set; } = string.Empty;
}