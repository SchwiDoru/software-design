using System.Threading.Tasks;

namespace Backend.Services;

public interface IAISettingsService
{
    Task<bool> IsAiModeEnabledAsync();
    Task SetAiModeAsync(bool enabled);
}
