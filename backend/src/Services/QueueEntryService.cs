using Backend.Constants;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class QueueEntryServices
{
    private readonly AppDbContext _dbContext;

    public QueueEntryServices(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<QueueEntry>> GetQueueEntries()
    {
        try
        {
            return await _dbContext.QueueEntries
                                    .Include(qe => qe.Queue)
                                    .Include(qe => qe.User)
                                    .ToListAsync();
        }
        catch(Exception err)
        {
            throw new Exception("Unexpected error getting queue entries: ", err);
        }
    }

    public async Task<QueueEntry> CreateQueueEntry(QueueEntry queueEntry)
    {
        if (queueEntry == null)
        {
            throw new ArgumentNullException(nameof(queueEntry), "Queue entry cannot be null");
        }
        if (!Enum.IsDefined(typeof(QueueEntryStatus), queueEntry.Status))
        {
            throw new ArgumentException(
                "Error queue entry status isn't valid: status must be (waiting, served, cancelled)",
                nameof(queueEntry.Status)
            );
        }
        if (!Enum.IsDefined(typeof(PriorityLevel), queueEntry.Priority))
        {
            throw new ArgumentException(
                "Error queue entry priority level isn't valid: status must be (High, Medium, or Low)",
                nameof(queueEntry.Priority)
            );
        }
        if (queueEntry.Position <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(queueEntry.Position), "Error queue entry position must be greater than 0");
        }
        if (string.IsNullOrWhiteSpace(queueEntry.UserId))
        {
            throw new ArgumentException("Error queue entry user id (email) is required", nameof(queueEntry.UserId));
        }

        try
        {
            var queueExists = await _dbContext.Queues.AnyAsync(q => q.Id == queueEntry.QueueId);
            if (!queueExists)
            {
                throw new KeyNotFoundException($"Queue with ID {queueEntry.QueueId} was not found");
            }

            var userExists = await _dbContext.UserProfiles.AnyAsync(u => u.Email == queueEntry.UserId);
            if (!userExists)
            {
                throw new KeyNotFoundException($"UserProfile with Email '{queueEntry.UserId}' was not found");
            }

            await _dbContext.QueueEntries.AddAsync(queueEntry);
            await _dbContext.SaveChangesAsync();
            return queueEntry;
        }
        catch(Exception err)
        {
            throw new Exception("Unexpected error creating queue entry: ", err);
        }
    }
}