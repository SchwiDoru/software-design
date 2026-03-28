using Backend.Constants;
using Backend.DTO;
using Backend.Models;

namespace Backend.Services;

public interface IQueueEntryServices
{
    Task<List<QueueEntry>> GetQueueEntries();
    Task<QueueEntry?> GetActiveQueueEntry(string userId);
    Task<QueueEntry> CreateQueueEntry(QueueEntry? queueEntry);
    Task<QueueEntry> UpdateQueueEntryPosition(int id, int position);
    Task<QueueEntry> UpdateQueueEntryStatus(int id, QueueEntryStatus status);
    Task<QueueEntry> UpdateQueueEntryStatusAndPriority(int id, QueueEntryStatus status, PriorityLevel priority);
    Task<bool> DeleteQueueEntry(int queueId, string userId);
    Task<EstimatedWaitTimeDTO> EstimateWaitTime(int queueId, string userId);
}
