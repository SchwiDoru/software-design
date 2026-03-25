using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Constants;

namespace Backend.Models;

public class NotificationHistory
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString(); // VARCHAR(45)

    // Simplified to match your team's UserProfile.Email key
    public required string UserEmail { get; set; } 

    public string Message { get; set; } = string.Empty; // VARCHAR(1000)
    public DateTime TimeStamp { get; set; } = DateTime.Now;
    
    // Using the Enum logic we discussed
    public NotificationStatus Status { get; set; } = NotificationStatus.Sent;

    [ForeignKey(nameof(UserEmail))]
    public virtual UserProfile User { get; set; } = null!;
}