using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("history")]
public class UserHistoryController : ControllerBase
{
    private readonly IHistoryService _historyService;

    public UserHistoryController(IHistoryService historyService)
    {
        _historyService = historyService;
    }

    [HttpGet("my")]
    public async Task<ActionResult<List<History>>> GetMyHistory([FromQuery] string? userId = null)
    {
        try
        {
            var resolvedUserId = User.FindFirst(ClaimTypes.Email)?.Value ?? userId;

            if (string.IsNullOrWhiteSpace(resolvedUserId))
            {
                return BadRequest(new { error = "User email is required." });
            }

            var history = await _historyService.GetPatientHistory(resolvedUserId);

            if (history.Count == 0)
            {
                return NoContent();
            }

            return Ok(history);
        }
        catch (ArgumentException err)
        {
            return BadRequest(new { error = err.Message });
        }
        catch (Exception err)
        {
            Console.WriteLine($"Error in UserHistoryController.GetMyHistory: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error getting user history" });
        }
    }
}
