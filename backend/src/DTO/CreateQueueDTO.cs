using Backend.Constants;

namespace Backend.DTO;

public class CreateQueueDTO
{
    public QueueStatus Status { get; set; }
    public int ServiceId { get; set; }
}