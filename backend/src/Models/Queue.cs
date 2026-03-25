using Backend.Constants;

namespace Backend.Models;

public class Queue
{
    public int Id {get; set;}
    public QueueStatus Status {get; set;}
    public DateTime Date {get; set;}
    required public int ServiceId {get; set;} //FK: Queue.ServiceId -> Service.id

    public Service? Service {get; set;}
}