using Backend.Constants;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class ServiceManager
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
}