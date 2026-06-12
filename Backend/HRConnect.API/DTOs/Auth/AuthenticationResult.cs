using HRConnect.API.Entities;

namespace HRConnect.API.DTOs.Auth;

public class AuthenticationResult
{
    public bool Success { get; set; }

    public string Error { get; set; } = string.Empty;

    public bool IsLockedOut { get; set; }

    public bool IsExpired { get; set; }

    public User? User { get; set; }
}
