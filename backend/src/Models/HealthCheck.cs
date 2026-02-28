namespace Backend.Models;
public enum HealthStatus
{
    Healthy,
    Unhealthy
}
public class HealthCheck
{
    public DateTime timeStamp {get; set;}
    public string? environment {get; set;}
    public HealthStatus status {get; set;}
}