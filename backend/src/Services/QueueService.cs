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

    public async Task<Queue?> GetQueueById(int id, int serviceId)
    {
        try
        {
            return await _dbContext.Queues
                .Include(q => q.Service)
                // FIX: Must match both parts of the composite key
                .FirstOrDefaultAsync(q => q.Id == id && q.ServiceId == serviceId);
        }
        catch(Exception err)
        {
            throw new Exception("Unexpected error occurred when getting queue by ID", err);
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
            throw new Exception("Unexpected Error getting queues", err);
        }
    }

    public async Task<Queue> CreateQueue(Queue queue)
    {
        if (queue == null) throw new ArgumentNullException(nameof(queue));

        try
        {
            var serviceExists = await _dbContext.Services.AnyAsync(s => s.Id == queue.ServiceId);
            if (!serviceExists)
            {
                throw new KeyNotFoundException($"Service with ID {queue.ServiceId} was not found");
            }

            await _dbContext.Queues.AddAsync(queue);
            await _dbContext.SaveChangesAsync(); 
            await _dbContext.Entry(queue).Reference(q => q.Service).LoadAsync();

            return queue; 
        }
        catch (KeyNotFoundException)
            {
                throw; // Allow specific exception to bubble up for the test
            }
            catch (Exception ex)
            {
                throw new Exception("Unexpected error occurred when creating a new queue", ex);
            }
    }

    public async Task<Queue> UpdateQueueStatus(int id, int serviceId, QueueStatus status)
    {
        if (id <= 0) throw new ArgumentOutOfRangeException(nameof(id));

        try
        {
            // FIX: Use both ID and ServiceId to find the unique record
            var existingQueue = await _dbContext.Queues
                .Include(q => q.Service)
                .FirstOrDefaultAsync(q => q.Id == id && q.ServiceId == serviceId);

            if (existingQueue == null)
            {
                throw new KeyNotFoundException($"Queue with ID {id} for Service {serviceId} was not found");
            }

            existingQueue.Status = status;
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