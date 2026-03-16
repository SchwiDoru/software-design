namespace Backend.Constants;

public enum QueueEntryStatus
{
    Waiting,
    Served, 
    Cancelled, 
    Pending,
    InProgress, 
    Removed,
    Completed
}