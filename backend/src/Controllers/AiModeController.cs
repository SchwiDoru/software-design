using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("ai-mode")]
public class AiModeController : ControllerBase
{
    private readonly IAISettingsService _aiSettingsService;

    public AiModeController(IAISettingsService aiSettingsService)
    {
        _aiSettingsService = aiSettingsService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var enabled = await _aiSettingsService.IsAiModeEnabledAsync();
        return Ok(new { isEnabled = enabled });
    }

    [HttpPut]
    public async Task<IActionResult> Put([FromBody] AiModeUpdateRequest req)
    {
        if (req == null)
        {
            return BadRequest();
        }

        await _aiSettingsService.SetAiModeAsync(req.IsEnabled);
        return NoContent();
    }

    public class AiModeUpdateRequest
    {
        public bool IsEnabled { get; set; }
    }
}