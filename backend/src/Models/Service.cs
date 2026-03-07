
using Backend.Constants;

namespace Backend.Models;

public class Service
{
    public int Id {get; private set;}
    public required string Name {get; set;}
    public string? Description {get; set;}
    public int Duration {get; set;}
    public PriorityLevel Priority {get; set;}

}