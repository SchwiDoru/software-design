using Backend.Constants;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend.Services;

public class ServiceManager : IServiceManager
{
    private readonly AppDbContext _dbContext;
    public ServiceManager(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<List<Service>> GetServices()
    {
        try
        {
            return await _dbContext.Services.ToListAsync();
        }
        catch(Exception err)
        {
            throw new Exception("Unexpected error getting services: ", err);
        }
    }
    
    public async Task<Service?> GetServiceById(int id)
    {
        try
        {
            return await _dbContext.Services.FindAsync(id);
        }
        catch(Exception err)
        {
            throw new Exception("Unexpected error getting service by ID: ", err);
        }
    }
    
    public async Task<Service?> UpdateService(int id, Service updatedService)
    {
        if (updatedService == null)
        {
            throw new ArgumentNullException(nameof(updatedService), "Service object can't be null");
        }
        if (string.IsNullOrWhiteSpace(updatedService.Name))
        {
            throw new ArgumentException("Service name is required and can't be empty", nameof(updatedService.Name));
        }
        if (updatedService.Duration <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(updatedService), "Service duration must be greater than 0 minutes");
        }
        if (!Enum.IsDefined(typeof(PriorityLevel), updatedService.Priority))
        {
            throw new ArgumentException("Invalid priority level. Must be Low, Medium, or High.", nameof(updatedService.Priority));
        }

        try
        {
            var existingService = await _dbContext.Services.FindAsync(id);
            if (existingService == null)
            {
                return null;
            }

            existingService.Name = updatedService.Name;
            existingService.Description = updatedService.Description;
            existingService.Duration = updatedService.Duration;
            existingService.Priority = updatedService.Priority;

            await _dbContext.SaveChangesAsync();
            return existingService;
        }
        catch (Exception err)
        {
            throw new Exception("Unexpected error occurred updating service in the database:", err);
        }
    }
    
    public async Task<Service> CreateService(Service service)
    {
        if (service == null)
        {
            throw new ArgumentNullException(nameof(service), "Service object can't be null");
        }
        if (string.IsNullOrWhiteSpace(service.Name))
        {
            throw new ArgumentException("Service name is required and can't be empty", nameof(service.Name));
        }
        if (service.Duration <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(service), "Service duration must be greater than 0 minutes");
        }
        if (!Enum.IsDefined(typeof(PriorityLevel), service.Priority))
        {
            throw new ArgumentException("Invalid priority level. Must be Low, Medium, or High.", nameof(service.Priority));
        }
        try
        {
            await _dbContext.Services.AddAsync(service);
            await _dbContext.SaveChangesAsync();

            return service;
        }
        catch (Exception err)
        {
            throw new Exception("Unexpected error occurred adding service to the database:", err);
        }
    }
    public async Task<bool> DeleteService(int id)
    {
        try
        {
            var service = await _dbContext.Services.FindAsync(id);
            if (service == null) return false;

            // 1. Find the associated queue
            var queue = await _dbContext.Queues
                .FirstOrDefaultAsync(q => q.ServiceId == id);

            if (queue != null)
            {
                // 2. Check if the queue is still "Open"
                // Assuming your QueueStatus enum/string uses "Open"
                if (queue.Status.ToString() == "Open")
                {
                    throw new InvalidOperationException("Cannot delete a service while its queue is still Open. Please close the queue first.");
                }

                // 3. Check if there are any patients in the queue (Waiting, Serving, etc.)
                var hasActiveEntries = await _dbContext.QueueEntries
                    .AnyAsync(e => e.QueueId == queue.Id);

                if (hasActiveEntries)
                {
                    throw new InvalidOperationException("Cannot delete service: There are still patient records associated with this queue.");
                }

                // If it passes both checks, remove the queue
                _dbContext.Queues.Remove(queue);
            }

            // 4. Remove the service
            _dbContext.Services.Remove(service);
            await _dbContext.SaveChangesAsync();
            
            return true;
        }
        catch (InvalidOperationException)
        {
            // Re-throw these specific validation errors to be caught by the controller
            throw;
        }
        catch (Exception err)
        {
            throw new Exception("Error deleting service from database", err);
        }
    }
}