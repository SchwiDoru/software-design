using Backend.Constants;

namespace Backend.DTO;

public class UpdateQueueEntryDTO
{
    public QueueEntryStatus Status { get; set; }
    public PriorityLevel Priority { get; set; }
}