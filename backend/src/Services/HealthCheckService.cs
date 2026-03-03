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
            Environment = env.EnvironmentName,
            Status = HealthStatus.Healthy,
            TimeStamp = DateTime.UtcNow
        };
    }

    public HealthCheckDTO GetHealthCheck()
    {
        string status = "";
        if(_healthCheck.Status == HealthStatus.Healthy)
        {
            status = "Server Online";
        }
        var healthCheckDTO = new HealthCheckDTO
        {
            status = status,
            timeStamp = _healthCheck.TimeStamp

        };
        Console.WriteLine($"SERVER RUNNING IN {_healthCheck.Environment} MODE");
        return healthCheckDTO;
    }
}