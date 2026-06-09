public interface IJwtService
{
    string GenerateToken(int userId, string email, bool isAdmin);
}