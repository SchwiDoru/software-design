using Backend.Constants;

namespace Backend.Models;

public class NotificationEvent
{
    public int Id { get; private set; }
    public NotificationType Type { get; set; }
    public NotificationAudience Audience { get; set; }
    public required string Title { get; set; }
    public required string Message { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? UserId { get; set; }
    public int? QueueId { get; set; }
    public int? QueueEntryId { get; set; }
}
