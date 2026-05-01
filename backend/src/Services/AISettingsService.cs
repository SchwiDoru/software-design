using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class AISettingsService : IAISettingsService
{
    private readonly AppDbContext _dbContext;

    public AISettingsService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> IsAiModeEnabledAsync()
    {
        var setting = await _dbContext.AiModeSettings.FirstOrDefaultAsync();
        if (setting == null)
        {
            // default false
            return false;
        }

        return setting.IsEnabled;
    }

    public async Task SetAiModeAsync(bool enabled)
    {
        var setting = await _dbContext.AiModeSettings.FirstOrDefaultAsync();
        if (setting == null)
        {
            setting = new AiModeSetting { IsEnabled = enabled };
            await _dbContext.AiModeSettings.AddAsync(setting);
        }
        else
        {
            setting.IsEnabled = enabled;
        }

        await _dbContext.SaveChangesAsync();
    }
}
