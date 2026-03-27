using Backend.DTO;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace Backend.Controllers;

[ApiController]
[Route("history/staff")]
public class StaffHistoryController : ControllerBase
{
    private readonly IHistoryService _historyService;

    public StaffHistoryController(IHistoryService historyService)
    {
        _historyService = historyService;
    }

    [HttpPost("complete/{queueEntryId:int}")]
    public async Task<ActionResult<History>> CompleteVisit(int queueEntryId, [FromBody] HistoryCompletionRequestDTO request)
    {
        try
        {
            var historyDetails = request.HistoryDetails
                .Select(detail => new HistoryDetail
                {
                    Diagnosis = detail.Diagnosis,
                    ServiceType = detail.ServiceType,
                    Assessment = detail.Assessment,
                    Label = detail.Label
                })
                .ToList();

            var prescriptions = request.Prescriptions
                .Select(prescription => new Prescription
                {
                    PrescriptionName = prescription.PrescriptionName,
                    Amt = prescription.Amt,
                    DailyUsage = prescription.DailyUsage
                })
                .ToList();

            var history = await _historyService.CompleteVisit(
                queueEntryId,
                historyDetails,
                prescriptions);

            return Ok(history);
        }
        catch (KeyNotFoundException err)
        {
            return NotFound(new { error = err.Message });
        }
        catch (ArgumentOutOfRangeException err)
        {
            return BadRequest(new { error = err.Message });
        }
        catch (ArgumentException err)
        {
            return BadRequest(new { error = err.Message });
        }
        catch (InvalidOperationException err)
        {
            return Conflict(new { error = err.Message });
        }
        catch (Exception err)
        {
            Console.WriteLine($"Error in StaffHistoryController.CompleteVisit: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error completing visit history" });
        }
    }
}
