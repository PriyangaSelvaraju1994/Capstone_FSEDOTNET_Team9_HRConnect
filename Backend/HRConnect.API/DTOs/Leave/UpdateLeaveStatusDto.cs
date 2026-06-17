
namespace HRConnect.API.DTOs;
public class UpdateLeaveStatusDto
{
    public string Status { get; set; }

    public DateTime? UpdatedDate { get; set; }

    public string? UpdatedBy { get; set; }
}