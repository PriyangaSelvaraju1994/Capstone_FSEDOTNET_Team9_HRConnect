using HRConnect.API.Services.Interfaces;

namespace HRConnect.API.Services.Implementations;

public class TokenRevocationService : ITokenRevocationService
{
    private readonly HashSet<string> _revokedTokens = new();
    private readonly Dictionary<string, DateTime> _revokedTokensWithExpiry = new();
    private readonly object _lock = new();

    public void RevokeToken(string jti)
    {
        if (string.IsNullOrEmpty(jti))
        {
            return;
        }

        lock (_lock)
        {
            _revokedTokens.Add(jti);
            _revokedTokensWithExpiry[jti] = DateTime.UtcNow.AddHours(2);
        }
    }

    public bool IsTokenRevoked(string jti)
    {
        if (string.IsNullOrEmpty(jti))
        {
            return false;
        }

        lock (_lock)
        {
            ClearExpiredTokensCore();
            return _revokedTokens.Contains(jti);
        }
    }

    public void ClearExpiredTokens()
    {
        lock (_lock)
        {
            ClearExpiredTokensCore();
        }
    }

    private void ClearExpiredTokensCore()
    {
        var now = DateTime.UtcNow;
        var expiredTokens = _revokedTokensWithExpiry
            .Where(kvp => kvp.Value < now)
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var token in expiredTokens)
        {
            _revokedTokens.Remove(token);
            _revokedTokensWithExpiry.Remove(token);
        }
    }
}