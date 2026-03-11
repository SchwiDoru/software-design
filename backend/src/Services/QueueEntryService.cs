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

    public async Task<QueueEntry> UpdateQueueEntry(int queueId, string userId, QueueEntryStatus status, PriorityLevel priority)
    {
        if (queueId <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(queueId), "Queue ID must be greater than 0");
        }
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("Queue entry user id (email) is required", nameof(userId));
        }
        if (!Enum.IsDefined(typeof(QueueEntryStatus), status))
        {
            throw new ArgumentException(
                "Error queue entry status isn't valid: status must be (Waiting, Served, Cancelled, Pending)",
                nameof(status)
            );
        }
        if (!Enum.IsDefined(typeof(PriorityLevel), priority))
        {
            throw new ArgumentException(
                "Error queue entry priority level isn't valid: priority must be (High, Medium, or Low)",
                nameof(priority)
            );
        }

        var normalizedUserId = userId.Trim();

        try
        {
            var existingQueueEntry = await _dbContext.QueueEntries
                .Include(qe => qe.Queue)
                .Include(qe => qe.User)
                .FirstOrDefaultAsync(qe => qe.QueueId == queueId && qe.UserId == normalizedUserId);

            if (existingQueueEntry == null)
            {
                throw new KeyNotFoundException($"Queue entry for queue ID {queueId} and user '{normalizedUserId}' was not found");
            }

            var queueExists = await _dbContext.Queues.AnyAsync(q => q.Id == queueId);
            if (!queueExists)
            {
                throw new KeyNotFoundException($"Queue with ID {queueId} was not found");
            }

            var userExists = await _dbContext.UserProfiles.AnyAsync(u => u.Email == normalizedUserId);
            if (!userExists)
            {
                throw new KeyNotFoundException($"UserProfile with Email '{normalizedUserId}' was not found");
            }

            existingQueueEntry.Status = status;
            existingQueueEntry.Priority = priority;

            await _dbContext.SaveChangesAsync();
            return existingQueueEntry;
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch(Exception err)
        {
            throw new Exception("Unexpected error updating queue entry: ", err);
        }
    }
}