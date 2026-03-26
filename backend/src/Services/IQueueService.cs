using Backend.Constants;
using Backend.Models;

namespace Backend.Services;

public interface IQueueService
{
    // FIX: Added serviceId to match the Composite Key in AppDbContext
    Task<Queue?> GetQueueById(int id, int serviceId); 
    Task<List<Queue>> GetQueues();
    Task<Queue> CreateQueue(Queue queue);
    // FIX: Added serviceId here too
    Task<Queue> UpdateQueueStatus(int id, int serviceId, QueueStatus status); 
}