using System.Text.Json.Serialization;

namespace HRConnect.API.DTOs.Auth;

public class LogoutResponseWrapperDto
{
    public int HttpResponseCode { get; set; }

    public string ResultStatus { get; set; } = "success";

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ErrorMessage { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public LogoutResponseDto? ResultSet { get; set; }
}
