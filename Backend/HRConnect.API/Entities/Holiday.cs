namespace HRConnect.API.Entities;

public class Holiday
{
    public int Id { get; set; }

    public string HolidayName { get; set; } = string.Empty;

    public DateTime HolidayDate { get; set; }

    public string? Description { get; set; }

    public bool IsOptionalHoliday { get; set; } = false;
}