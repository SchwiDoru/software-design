namespace Backend.DTO;

public class CreateQueueEntryDTO
{
    public int QueueId { get; set; }
    required public string UserId { get; set; }
    public string? Description { get; set; }
}