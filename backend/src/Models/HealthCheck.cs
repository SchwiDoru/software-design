namespace Backend.Models;
public enum HealthStatus
{
    Healthy,
    Unhealthy
}
public class HealthCheck
{
    public DateTime TimeStamp {get; set;}
    public string? Environment {get; set;}
    public HealthStatus Status {get; set;}
}