using Backend.Constants;
using Backend.DTO;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class QueueEntryController: ControllerBase
{
    private readonly IQueueEntryServices _queueEntryService;

    public QueueEntryController(IQueueEntryServices queueEntryServices)
    {
        _queueEntryService = queueEntryServices;
    }

    [HttpGet]
    public async Task<ActionResult<List<QueueEntry>>> GetQueueEntryController()
    {
        try
        {
            var queueEntries = await _queueEntryService.GetQueueEntries();

            if (queueEntries.Count <= 0)
            {
                return NoContent();
            }
            return Ok(queueEntries);
        }
        catch(Exception err)
        {
            throw new Exception("Unexpected error getting queue entries from controller: ", err);
        }
    }

    [HttpPost]
    public async Task<ActionResult<QueueEntry>> CreateQueueEntryController(CreateQueueEntryDTO queueEntryDto)
    {
        try
        {
            var modifyQueueEntry = new QueueEntry{
                JoinTime = DateTime.UtcNow,
                Position = null,
                Status = QueueEntryStatus.Pending,
                Priority = PriorityLevel.Low, 
                QueueId = queueEntryDto.QueueId,
                UserId = queueEntryDto.UserId,
                Description = queueEntryDto.Description
            };
            var createdQueueEntry = await _queueEntryService.CreateQueueEntry(modifyQueueEntry);

            return CreatedAtAction(
                nameof(GetQueueEntryController),
                createdQueueEntry
            );
        }
        catch (KeyNotFoundException err)
        {
            return NotFound(new { error = err.Message });
        }
        catch (ArgumentNullException err)
        {
            return BadRequest(new { error = err.Message });
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
        catch(Exception err)
        {
            Console.WriteLine($"Error in QueueEntryController.CreateQueueEntryController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error creating queue entry" });
        }
    }

    [HttpPost("join")]
    public async Task<ActionResult<QueueEntry>> JoinQueueController(CreateQueueEntryDTO queueEntryDto)
    {
        // forward to existing create endpoint logic (queue entry in pending state)
        return await CreateQueueEntryController(queueEntryDto);
    }

    [HttpDelete("leave")]
    public async Task<IActionResult> LeaveQueueController([FromQuery] int queueId, [FromQuery] string userId)
    {
        try
        {
            var deleted = await _queueEntryService.DeleteQueueEntry(queueId, userId);
            if (!deleted)
            {
                return NotFound(new { error = $"Queue entry for queue {queueId} and user '{userId}' not found" });
            }
            return NoContent();
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
        catch(Exception err)
        {
            Console.WriteLine($"Error in QueueEntryController.LeaveQueueController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error leaving queue" });
        }
    }

    [HttpGet("wait-time")]
    public async Task<ActionResult<EstimatedWaitTimeDTO>> EstimateWaitTimeController([FromQuery] int queueId, [FromQuery] string userId)
    {
        try
        {
            var waitingTime = await _queueEntryService.EstimateWaitTime(queueId, userId);
            return Ok(waitingTime);
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
        catch(Exception err)
        {
            Console.WriteLine($"Error in QueueEntryController.EstimateWaitTimeController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error estimating wait time" });
        }
    }

    [HttpPut("{id:int}/update-pending")]
    public async Task<ActionResult<QueueEntry>> UpdateQueueEntryController(int id, UpdateQueueEntryDTO queueEntryDto)
    {
        try
        {
            var updatedQueueEntry = await _queueEntryService.UpdateQueueEntryStatusAndPriority(
                id,
                queueEntryDto.Status,
                queueEntryDto.Priority
            );

            return Ok(updatedQueueEntry);
        }
        catch (KeyNotFoundException err)
        {
            return NotFound(new { error = err.Message });
        }
        catch (ArgumentNullException err)
        {
            return BadRequest(new { error = err.Message });
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
        catch(Exception err)
        {
            Console.WriteLine($"Error in QueueEntryController.UpdateQueueEntryController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error updating queue entry" });
        }
    }

    [HttpPut("{id:int}/position")]
    public async Task<ActionResult<QueueEntry>> UpdateQueueEntryPositionController(int id, UpdateQueueEntryPositionDTO queueEntryDto)
    {
        try
        {
            var updatedQueueEntry = await _queueEntryService.UpdateQueueEntryPosition(
                id,
                queueEntryDto.Position
            );

            return Ok(updatedQueueEntry);
        }
        catch (KeyNotFoundException err)
        {
            return NotFound(new { error = err.Message });
        }
        catch (ArgumentNullException err)
        {
            return BadRequest(new { error = err.Message });
        }
        catch (ArgumentOutOfRangeException err)
        {
            return BadRequest(new { error = err.Message });
        }
        catch (ArgumentException err)
        {
            return BadRequest(new { error = err.Message });
        }
        catch(Exception err)
        {
            Console.WriteLine($"Error in QueueEntryController.UpdateQueueEntryPositionController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error updating queue entry position" });
        }
    }

    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<QueueEntry>> UpdateQueueEntryStatusController(int id, UpdateQueueEntryStatusDTO queueEntryDto)
    {
        try
        {
            var updatedQueueEntry = await _queueEntryService.UpdateQueueEntryStatus(
                id,
                queueEntryDto.Status
            );

            return Ok(updatedQueueEntry);
        }
        catch (KeyNotFoundException err)
        {
            return NotFound(new { error = err.Message });
        }
        catch (ArgumentNullException err)
        {
            return BadRequest(new { error = err.Message });
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
        catch(Exception err)
        {
            Console.WriteLine($"Error in QueueEntryController.UpdateQueueEntryStatusController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error updating queue entry status" });
        }
    }

}