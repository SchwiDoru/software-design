using Backend.Constants;

namespace Backend.DTO.Reports;

public class ReportFilterDTO
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? ServiceId { get; set; }
    public QueueEntryStatus? Status { get; set; }
}
