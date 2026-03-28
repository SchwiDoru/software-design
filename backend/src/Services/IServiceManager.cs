using Backend.Models;

namespace Backend.Services;

public interface IServiceManager
{
    Task<List<Service>> GetServices();
    Task<Service?> GetServiceById(int id);
    Task<Service?> UpdateService(int id, Service updatedService);
    Task<Service> CreateService(Service service);
}