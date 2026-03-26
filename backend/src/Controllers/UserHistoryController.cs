using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/my-history")]
public class UserHistoryController : ControllerBase
{
    private readonly IHistoryService _historyService;

    public UserHistoryController(IHistoryService historyService)
    {
        _historyService = historyService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<History>>> GetMyHistory()
    {
        try
        {
            // In a real app, you'd get this from User.FindFirstValue(ClaimTypes.Email)
            // For now, we'll assume the email is passed or retrieved via context
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;

            if (string.IsNullOrEmpty(userEmail))
            {
                return BadRequest("User email not found in claims.");
            }

            var history = await _historyService.GetPatientHistory(userEmail);
            return Ok(history);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}