using Backend.Constants;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend.Services;

public class QueueService : IQueueService
{
    private readonly AppDbContext _dbContext;

    public QueueService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Queue?> GetQueueById(int id)
    {
        try
        {
            return await _dbContext.Queues
                .Include(q => q.Service)
                .FirstOrDefaultAsync(q => q.Id == id);
        }
        catch(Exception err)
        {
            throw new Exception("Unexpected error occurred when getting queue by ID: ", err);
        }
    }
    public async Task<List<Queue>> GetQueues()
    {
        try
        {
            return await _dbContext.Queues.Include(q => q.Service).ToListAsync();
        }
        catch(Exception err)
        {
            throw new Exception("Unexpected Error getting queues: ", err);
        }

    }

    public async Task<Queue> CreateQueue(Queue queue)
    {
        if (queue == null)
        {
            throw new ArgumentNullException(nameof(queue), "Error creating queue: queue can't be empty");
        }
        if (!Enum.IsDefined(typeof(QueueStatus), queue.Status))
        {
            throw new ArgumentException("Error creating queue: queue status is invalid", nameof(queue.Status));
        }

        try
        {
            var serviceExists = await _dbContext.Services.AnyAsync(s => s.Id == queue.ServiceId);
            if (!serviceExists)
            {
                throw new KeyNotFoundException($"Service with ID {queue.ServiceId} was not found");
            }

            await _dbContext.Queues.AddAsync(queue);
            await _dbContext.SaveChangesAsync();

            return await _dbContext.Queues
                .Include(q => q.Service)
                .FirstAsync(q => q.Id == queue.Id);
        }
        catch(Exception err)
        {
            throw new Exception("Unexpected error occurred when creating a new queue: ", err);
        }
    }

    public async Task<Queue> UpdateQueueStatus(int id, QueueStatus status)
    {
        if (id <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(id), "Queue ID must be greater than 0");
        }
        if (!Enum.IsDefined(typeof(QueueStatus), status))
        {
            throw new ArgumentException("Error updating queue status: queue status is invalid", nameof(status));
        }

        try
        {
            var existingQueue = await _dbContext.Queues
                .Include(q => q.Service)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (existingQueue == null)
            {
                throw new KeyNotFoundException($"Queue with ID {id} was not found");
            }

            existingQueue.Status = status;

            await _dbContext.SaveChangesAsync();

            return existingQueue;
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch(Exception err)
        {
            throw new Exception("Unexpected error occurred when updating queue status: ", err);
        }
    }
}