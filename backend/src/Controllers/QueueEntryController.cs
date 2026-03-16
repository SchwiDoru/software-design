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
    private readonly QueueEntryServices _queueEntryService;

    public QueueEntryController(QueueEntryServices queueEntryServices)
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
        catch(Exception err)
        {
            Console.WriteLine($"Error in QueueEntryController.CreateQueueEntryController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error creating queue entry" });
        }
    }

    [HttpPut("{queueId:int}/{userId}")]
    public async Task<ActionResult<QueueEntry>> UpdateQueueEntryController(int queueId, string userId, UpdateQueueEntryDTO queueEntryDto)
    {
        try
        {
            var updatedQueueEntry = await _queueEntryService.UpdateQueueEntry(
                queueId,
                userId,
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
        catch(Exception err)
        {
            Console.WriteLine($"Error in QueueEntryController.UpdateQueueEntryController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error updating queue entry" });
        }
    }

    [HttpPut("{queueId:int}/{userId}/position")]
    public async Task<ActionResult<QueueEntry>> UpdateQueueEntryPositionController(int queueId, string userId, UpdateQueueEntryPositionDTO queueEntryDto)
    {
        try
        {
            var updatedQueueEntry = await _queueEntryService.UpdateQueueEntryPosition(
                queueId,
                userId,
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

    [HttpPut("{queueId:int}/{userId}/status")]
    public async Task<ActionResult<QueueEntry>> UpdateQueueEntryStatusController(int queueId, string userId, UpdateQueueEntryStatusDTO queueEntryDto)
    {
        try
        {
            var updatedQueueEntry = await _queueEntryService.UpdateQueueEntryStatus(
                queueId,
                userId,
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
        catch(Exception err)
        {
            Console.WriteLine($"Error in QueueEntryController.UpdateQueueEntryStatusController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error updating queue entry status" });
        }
    }

}