using Backend.Constants;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models;

[PrimaryKey(nameof(QueueId), nameof(UserId))]
public class QueueEntry
{
    public int? Position {get; set;}
    public DateTime JoinTime {get; set;}
    public QueueEntryStatus Status {get; set;}
    public PriorityLevel Priority {get; set;}
    public string? Description {get; set;}

    [ForeignKey(nameof(Queue))]
    public int QueueId {get; set;} // FK → Queue.Id
    [ForeignKey(nameof(User))]
    required public string UserId {get; set;} // FK → UserProfile.Email

    public Queue? Queue {get; set;}
    public UserProfile? User {get; set;}
}