namespace HRConnect.API.DTOs.Auth;

using System.Text.Json.Serialization;

public class ErrorResponseWrapperDto
{
    public int HttpResponseCode { get; set; }
    public string ResultStatus { get; set; } = "error";

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ErrorResponseDto? ErrorResponse { get; set; }
}
