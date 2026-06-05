namespace HRConnect.API.Entities;

public class User
{
    public int Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public bool IsAdmin { get; set; }

    public string FullName { get; set; } = string.Empty;

    // Navigation Property
    public Employee? Employee { get; set; }
}