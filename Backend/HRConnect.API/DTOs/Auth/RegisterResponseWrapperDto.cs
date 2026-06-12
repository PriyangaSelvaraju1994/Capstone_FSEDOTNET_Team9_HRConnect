namespace HRConnect.API.DTOs.Auth;

using System.Text.Json.Serialization;

public class RegisterResponseWrapperDto
{
    public int HttpResponseCode { get; set; }
    public string ResultStatus { get; set; } = "success";

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ErrorMessage { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public RegisterResponseDto? ResultSet { get; set; }
}
