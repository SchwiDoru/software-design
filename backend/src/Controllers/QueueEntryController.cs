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
    public async Task<ActionResult<QueueEntry>> CreateQueueEntryController(QueueEntry queueEntry)
    {
        try
        {
            var modifyQueueEntry = new QueueEntry{
                JoinTime = DateTime.UtcNow,
                Position = queueEntry.Position,
                Status = queueEntry.Status,
                Priority = queueEntry.Priority,
                QueueId = queueEntry.QueueId,
                UserId = queueEntry.UserId,
                Description = queueEntry.Description
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
    public async Task<ActionResult<QueueEntry>> UpdateQueueEntryController(int queueId, string userId, UpdateQueueEntryDTO queueEntry)
    {
        try
        {
            var updatedQueueEntry = await _queueEntryService.UpdateQueueEntry(
                queueId,
                userId,
                queueEntry.Status,
                queueEntry.Priority
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
}