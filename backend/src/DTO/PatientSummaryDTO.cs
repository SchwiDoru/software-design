using Backend.Models;

namespace Backend.DTO;

public class PatientSummaryDTO
{
    public required string Email { get; set; }
    public required string Name { get; set; }
    public string? PhoneNumber { get; set; }
    public string? CurrentStatus { get; set; }
    public DateTime? LastVisitDate { get; set; }
    public string? LastService { get; set; }
}

public class PatientDetailDTO
{
    public required string Email { get; set; }
    public required string Name { get; set; }
    public string? PhoneNumber { get; set; }
    public QueueEntry? CurrentEntry { get; set; }
    public List<History> Histories { get; set; } = [];
}
