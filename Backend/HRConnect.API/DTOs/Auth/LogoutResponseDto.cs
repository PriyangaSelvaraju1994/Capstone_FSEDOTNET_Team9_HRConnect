namespace HRConnect.API.DTOs.Auth;

public class LogoutResponseDto
{
    public string Message { get; set; } = string.Empty;

    public string? UserId { get; set; }

    public string? Email { get; set; }

    public bool TokenRevoked { get; set; }
}
