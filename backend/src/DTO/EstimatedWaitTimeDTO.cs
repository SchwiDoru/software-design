namespace Backend.DTO;

public class EstimatedWaitTimeDTO
{
    public int Position { get; set; }
    public int EstimatedWaitTimeMinutes { get; set; }
    public int ServiceDurationMinutes { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int QueueId { get; set; }
    public string Message { get; set; } = string.Empty;
}
