using HRConnect.API.Services.Interfaces;
using HRConnect.API.Entities;
public interface IJwtService
{
    string GenerateToken(User user);
}