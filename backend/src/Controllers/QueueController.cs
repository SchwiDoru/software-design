using Backend.Models;
using Backend.Services;
using Backend.DTO;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class QueueController: ControllerBase
{
    private readonly QueueService _queueService;

    public QueueController(QueueService queueService)
    {
        _queueService = queueService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Queue>> GetQueueByIdController(int id)
    {
        try
        {
            var queue = await _queueService.GetQueueById(id);
            if (queue == null)
            {
                return NotFound(new { error = $"Queue with ID {id} not found" });
            }
            return Ok(queue);
        }
        catch(Exception err)
        {
            Console.WriteLine($"Error in QueueController.GetQueueByIdController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return BadRequest(new { error = err.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<Queue>>> GetQueuesController()
    {
        try
        {
            var queues = await _queueService.GetQueues();
            if(queues.Count <= 0)
            {
                return NoContent();
            }
            return Ok(queues);
        }
        catch(Exception err)
        {
            throw new Exception("Unexpected error fetching queues: ", err);
        }

    }

    [HttpPost]
    public async Task<ActionResult<Queue>> CreateQueueController(CreateQueueDTO queueDTO)
    {
        try
        {
            var queue = new Queue
            {
                Status = queueDTO.Status,
                ServiceId = queueDTO.ServiceId,
                Date = DateTime.UtcNow,
            };

            var createdQueue = await _queueService.CreateQueue(queue);
            return CreatedAtAction(
                nameof(GetQueueByIdController),
                new { id = createdQueue.Id },
                createdQueue
            );
        }
        catch(Exception err)
        {
            Console.WriteLine($"Error in QueueController.CreateQueueController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return BadRequest(new { error = err.Message });
        }
    }

    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<Queue>> UpdateQueueStatusController(int id, UpdateQueueStatusDTO queueDTO)
    {
        try
        {
            var updatedQueue = await _queueService.UpdateQueueStatus(id, queueDTO.Status);
            return Ok(updatedQueue);
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
            Console.WriteLine($"Error in QueueController.UpdateQueueStatusController: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error updating queue status" });
        }
    }
}