using Backend.Constants;
using Backend.Models;

namespace Backend.Services;

public interface IQueueService
{
    Task<Queue?> GetQueueById(int id);
    Task<List<Queue>> GetQueues();
    Task<Queue> CreateQueue(Queue queue);
    Task<Queue> UpdateQueueStatus(int id, QueueStatus status);
}