using Backend.Constants;
using Backend.Models;
using Backend.Services;
using Backend.DTO;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class QueueController: ControllerBase
{
    private readonly IQueueService _queueService;

    public QueueController(IQueueService queueService)
    {
        _queueService = queueService;
    }

    // FIX: Route now expects both parts of the key [controller]/{serviceId}/{id}
    [HttpGet("{serviceId:int}/{id:int}")]
    public async Task<ActionResult<Queue>> GetQueueByIdController(int id, int serviceId)
    {
        try
        {
            // Updated service call to use composite key
            var queue = await _queueService.GetQueueById(id, serviceId);
            if (queue == null)
            {
                return NotFound(new { error = $"Queue with ID {id} for Service {serviceId} not found" });
            }
            return Ok(queue);
        }
        catch(Exception err)
        {
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
            return StatusCode(500, new { error = "Unexpected error fetching queues", details = err.Message });
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
            
            // FIX: CreatedAtAction must return both IDs in the route values
            return CreatedAtAction(
                nameof(GetQueueByIdController),
                new { id = createdQueue.Id, serviceId = createdQueue.ServiceId },
                createdQueue
            );
        }
        catch(Exception err)
        {
            return BadRequest(new { error = err.Message });
        }
    }

    // FIX: Status update now requires serviceId in route to locate the specific record
    [HttpPut("{serviceId:int}/{id:int}/status")]
    public async Task<ActionResult<Queue>> UpdateQueueStatusController(int id, int serviceId, UpdateQueueStatusDTO queueDTO)
    {
        try
        {
            // Updated service call to use composite key
            var updatedQueue = await _queueService.UpdateQueueStatus(id, serviceId, queueDTO.Status);
            return Ok(updatedQueue);
        }
        catch (KeyNotFoundException err)
        {
            return NotFound(new { error = err.Message });
        }
        catch (ArgumentException err)
        {
            return BadRequest(new { error = err.Message });
        }
        catch(Exception)
        {
            return StatusCode(500, new { error = "Unexpected error updating queue status" });
        }
    }
}