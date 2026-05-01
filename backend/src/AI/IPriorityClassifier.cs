using Backend.Constants;

public interface IPriorityClassifier
{
    Task<PriorityLevel> ClassifyAsync(string? description);
}