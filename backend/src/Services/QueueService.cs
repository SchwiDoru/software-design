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

        try
        {
            // 1. Verify the service exists before attaching a queue to it
            var serviceExists = await _dbContext.Services.AnyAsync(s => s.Id == queue.ServiceId);
            if (!serviceExists)
            {
                throw new KeyNotFoundException($"Service with ID {queue.ServiceId} was not found");
            }

            // 2. Add to context and save to generate the ID
            await _dbContext.Queues.AddAsync(queue);
            await _dbContext.SaveChangesAsync(); // The ID is generated here

            // 3. Explicitly load the Service relationship so the frontend gets the full object
            await _dbContext.Entry(queue).Reference(q => q.Service).LoadAsync();

            return queue; 
        }
        catch (Exception)
        {
            // Removed 'err' to fix the "variable declared but never used" warning
            throw new Exception("Unexpected error occurred when creating a new queue");
        }
    }

    public async Task<Queue> UpdateQueueStatus(int id, QueueStatus status)
    {
        // Validation: This is what triggers your 400 error if the ID is 0
        if (id <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(id), "Queue ID must be greater than 0");
        }

        try
        {
            // 1. Fetch the existing queue from the DB
            var existingQueue = await _dbContext.Queues
                .Include(q => q.Service)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (existingQueue == null)
            {
                throw new KeyNotFoundException($"Queue with ID {id} was not found");
            }

            // 2. Apply the new status
            existingQueue.Status = status;

            // 3. PERSIST: Without this, the change only lives in RAM temporarily
            await _dbContext.SaveChangesAsync();

            return existingQueue;
        }
        catch (KeyNotFoundException) { throw; }
        catch (Exception)
        {
            throw new Exception("Unexpected error occurred when updating queue status");
        }
    }
}