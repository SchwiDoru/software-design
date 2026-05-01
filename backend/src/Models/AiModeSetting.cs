namespace Backend.Models;

public class AiModeSetting
{
    public int Id { get; set; }
    // single global toggle - default false
    public bool IsEnabled { get; set; }
}
