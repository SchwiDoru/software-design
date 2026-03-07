namespace Backend.Controllers;

using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("[controller]")]
public class ServiceController: ControllerBase
{
    private readonly ServiceManager _serviceManager;
    public ServiceController(ServiceManager serviceManager)
    {
        _serviceManager = serviceManager;
    }
    
    [HttpGet]
    public async Task<ActionResult<List<Service>>> GetServicesController()
    {
        try
        {
            var services = await _serviceManager.GetServices();
            return Ok(services);
        }
        catch(Exception err)
        {
            Console.WriteLine($"Error in ServiceController.GetServicesController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return BadRequest(new { error = err.Message });
        }
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<Service>> GetServiceByIdController(int id)
    {
        try
        {
            var service = await _serviceManager.GetServiceById(id);
            if (service == null)
            {
                return NotFound(new { error = $"Service with ID {id} not found" });
            }
            return Ok(service);
        }
        catch(Exception err)
        {
            Console.WriteLine($"Error in ServiceController.GetServiceByIdController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return BadRequest(new { error = err.Message });
        }
    }
    
    [HttpPost]
    public async Task<ActionResult<Service>> CreateServiceController(Service service)
    {
        try
        {
            var createdService = await _serviceManager.CreateService(service);
            return CreatedAtAction(
                nameof(GetServiceByIdController), 
                new { id = createdService.Id }, 
                createdService
            );
        }
        catch(Exception err)
        {
            Console.WriteLine($"Error in ServiceController.CreateServiceController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return BadRequest(new { error = err.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Service>> UpdateServiceController(int id, Service service)
    {
        try
        {
            var updatedService = await _serviceManager.UpdateService(id, service);
            if (updatedService == null)
            {
                return NotFound(new { error = $"Service with ID {id} not found" });
            }
            return Ok(updatedService);
        }
        catch(Exception err)
        {
            Console.WriteLine($"Error in ServiceController.UpdateServiceController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return BadRequest(new { error = err.Message });
        }
    }
}