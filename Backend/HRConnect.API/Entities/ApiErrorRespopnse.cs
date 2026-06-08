public class ApiErrorResponse
{
    public DateTime Timestamp { get; set; }

    public string Path { get; set; }

    public string Error { get; set; }

    public string Message { get; set; }
}