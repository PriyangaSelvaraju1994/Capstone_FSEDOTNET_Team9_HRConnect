namespace HRConnect.API.Services.Interfaces;

public interface ITokenRevocationService
{
    void RevokeToken(string jti);
    bool IsTokenRevoked(string jti);
    void ClearExpiredTokens();
}
