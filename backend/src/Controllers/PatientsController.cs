using Backend.Constants;
using Backend.Data;
using Backend.DTO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("patients")]
public class PatientsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public PatientsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<List<PatientSummaryDTO>>> GetPatients()
    {
        try
        {
            var profiles = await _dbContext.UserProfiles
                .OrderBy(profile => profile.Name)
                .ToListAsync();

            if (profiles.Count == 0)
            {
                return NoContent();
            }

            var queueEntries = await _dbContext.QueueEntries
                .Include(entry => entry.Queue!)
                    .ThenInclude(queue => queue.Service)
                .ToListAsync();

            var histories = await _dbContext.Histories
                .Include(history => history.QueueEntry)
                    .ThenInclude(entry => entry.Queue!)
                        .ThenInclude(queue => queue.Service)
                .ToListAsync();

            var result = profiles.Select(profile =>
            {
                var activeEntry = queueEntries
                    .Where(entry =>
                        entry.UserId == profile.Email &&
                        (entry.Status == QueueEntryStatus.Pending ||
                         entry.Status == QueueEntryStatus.Waiting ||
                         entry.Status == QueueEntryStatus.InProgress))
                    .OrderByDescending(entry => entry.JoinTime)
                    .FirstOrDefault();

                var latestHistory = histories
                    .Where(history => history.QueueEntry.UserId == profile.Email)
                    .OrderByDescending(history => history.Date)
                    .FirstOrDefault();

                return new PatientSummaryDTO
                {
                    Email = profile.Email,
                    Name = profile.Name,
                    PhoneNumber = profile.PhoneNumber,
                    CurrentStatus = activeEntry?.Status.ToString() ?? latestHistory?.QueueEntry.Status.ToString(),
                    LastVisitDate = latestHistory?.Date ?? activeEntry?.JoinTime,
                    LastService = latestHistory?.QueueEntry.Queue?.Service?.Name ?? activeEntry?.Queue?.Service?.Name
                };
            }).ToList();

            return Ok(result);
        }
        catch (Exception err)
        {
            Console.WriteLine($"Error in PatientsController.GetPatients: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error getting patients" });
        }
    }

    [HttpGet("{userId}")]
    public async Task<ActionResult<PatientDetailDTO>> GetPatient(string userId)
    {
        try
        {
            var normalizedUserId = userId?.Trim().ToLowerInvariant() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(normalizedUserId))
            {
                return BadRequest(new { error = "Patient email is required" });
            }

            var profile = await _dbContext.UserProfiles.FirstOrDefaultAsync(user => user.Email == normalizedUserId);
            if (profile == null)
            {
                return NotFound(new { error = $"Patient '{normalizedUserId}' was not found" });
            }

            var currentEntry = await _dbContext.QueueEntries
                .Include(entry => entry.Queue!)
                    .ThenInclude(queue => queue.Service)
                .Include(entry => entry.User)
                .Where(entry =>
                    entry.UserId == normalizedUserId &&
                    (entry.Status == QueueEntryStatus.Pending ||
                     entry.Status == QueueEntryStatus.Waiting ||
                     entry.Status == QueueEntryStatus.InProgress))
                .OrderByDescending(entry => entry.JoinTime)
                .FirstOrDefaultAsync();

            var histories = await _dbContext.Histories
                .Include(history => history.QueueEntry)
                    .ThenInclude(entry => entry.Queue!)
                        .ThenInclude(queue => queue.Service)
                .Include(history => history.HistoryDetails)
                .Include(history => history.Prescriptions)
                .Where(history => history.QueueEntry.UserId == normalizedUserId)
                .OrderByDescending(history => history.Date)
                .ToListAsync();

            return Ok(new PatientDetailDTO
            {
                Email = profile.Email,
                Name = profile.Name,
                PhoneNumber = profile.PhoneNumber,
                CurrentEntry = currentEntry,
                Histories = histories
            });
        }
        catch (Exception err)
        {
            Console.WriteLine($"Error in PatientsController.GetPatient: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error getting patient details" });
        }
    }
}
