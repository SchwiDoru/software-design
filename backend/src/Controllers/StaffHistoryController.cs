using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/staff/history")]
public class StaffHistoryController : ControllerBase
{
    private readonly IHistoryService _historyService;

    public StaffHistoryController(IHistoryService historyService)
    {
        _historyService = historyService;
    }

    [HttpPost("complete/{queueEntryId}")]
    public async Task<ActionResult<History>> CompleteVisit(
        int queueEntryId, 
        [FromBody] HistoryCompletionRequest request)
    {
        try
        {
            // Call the service with your specific model collections
            var history = await _historyService.CompleteVisit(
                queueEntryId, 
                request.HistoryDetails, 
                request.Prescriptions
            );
            
            return Ok(history);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

// DTO matching your History model collections
public record HistoryCompletionRequest(
    List<HistoryDetail> HistoryDetails, 
    List<Prescription> Prescriptions
);