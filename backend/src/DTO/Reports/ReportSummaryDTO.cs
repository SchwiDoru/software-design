namespace Backend.DTO.Reports;

public class ReportSummaryDTO
{
    public DateTime GeneratedAt { get; set; }
    public ReportFilterDTO Filters { get; set; } = new();
    public QueueUsageStatsDTO UsageStats { get; set; } = new();
    public List<ServiceQueueActivityDTO> ServiceActivity { get; set; } = [];
    public List<UserQueueParticipationDTO> UserParticipation { get; set; } = [];
}

public class QueueUsageStatsDTO
{
    public int TotalQueueEntries { get; set; }
    public int UsersServed { get; set; }
    public double AverageWaitMinutes { get; set; }
    public Dictionary<string, int> StatusBreakdown { get; set; } = new();
}

public class ServiceQueueActivityDTO
{
    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public int QueueCount { get; set; }
    public int EntryCount { get; set; }
    public int UsersServed { get; set; }
    public double AverageWaitMinutes { get; set; }
}

public class UserQueueParticipationDTO
{
    public int QueueEntryId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public int QueueId { get; set; }
    public int? ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public DateTime? QueueDate { get; set; }
    public DateTime JoinedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public int? Position { get; set; }
    public double? WaitMinutes { get; set; }
}
