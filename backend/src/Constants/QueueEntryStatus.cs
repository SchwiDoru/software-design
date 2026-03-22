namespace Backend.Constants;

public enum QueueEntryStatus
{
    Waiting,
    Cancelled, 
    Pending,
    InProgress, 
    Removed,
    Completed
}