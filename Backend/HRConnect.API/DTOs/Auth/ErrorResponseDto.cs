namespace HRConnect.API.DTOs.Auth;

public class ErrorResponseDto
{
    public string Message { get; set; } = string.Empty;
    public object? Details { get; set; }
}
