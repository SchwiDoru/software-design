using Backend.Constants;

namespace Backend.DTO;

public class NotificationDTO
{
    public int Id { get; set; }
    public NotificationType Type { get; set; }
    public NotificationAudience Audience { get; set; }
    public required string Title { get; set; }
    public required string Message { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? UserId { get; set; }
    public int? QueueId { get; set; }
    public int? QueueEntryId { get; set; }
}
