using System.ComponentModel.DataAnnotations.Schema;
using Backend.Constants;
using Backend.Models;

public class QueueEntry
{
    public int Id { get; set; }
    public int? Position { get; set; }
    public DateTime JoinTime { get; set; }
    public QueueEntryStatus Status { get; set; }
    public PriorityLevel Priority { get; set; }
    public string? Description { get; set; }

    // COMPOSITE FK to match Schema
    public int QueueId { get; set; }
    public int QueueServiceId { get; set; } // Added this to match Queue_Service_ID
    
    public required string UserId { get; set; } // FK to UserProfile.Email

    [ForeignKey("QueueId, QueueServiceId")]
    public virtual Queue Queue { get; set; } = null!;
    
    [ForeignKey(nameof(UserId))]
    public virtual UserProfile User { get; set; } = null!;
}