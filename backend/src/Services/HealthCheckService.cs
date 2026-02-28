using Backend.DTOs;
using Backend.Models;

namespace Backend.Services;

public class HealthCheckService
{
    private readonly HealthCheck _healthCheck;
    
    public HealthCheckService(IWebHostEnvironment env)
    {
        _healthCheck = new HealthCheck
        {
            environment = env.EnvironmentName,
            status = HealthStatus.Healthy,
            timeStamp = DateTime.UtcNow
        };
    }

    public HealthCheckDTO GetHealthCheck()
    {
        string status = "";
        if(_healthCheck.status == HealthStatus.Healthy)
        {
            status = "Server Online";
        }
        var healthCheckDTO = new HealthCheckDTO
        {
            status = status,
            timeStamp = _healthCheck.timeStamp

        };
        Console.WriteLine($"SERVER RUNNING IN {_healthCheck.environment} MODE");
        return healthCheckDTO;
    }
}