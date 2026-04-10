using Backend.Constants;
using Backend.DTO;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend.Services;

public class QueueEntryServices : IQueueEntryServices
{
    private readonly AppDbContext _dbContext;
    private readonly INotificationService _notificationService;

    public QueueEntryServices(AppDbContext dbContext, INotificationService notificationService)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
    }

    private async Task EnsureQueueIsOpen(int queueId)
    {
        var isQueueClosed = await _dbContext.Queues.AnyAsync(queue =>
            queue.Id == queueId &&
            queue.Status == QueueStatus.Closed);

        if (isQueueClosed)
        {
            throw new InvalidOperationException("Queue is currently closed");
        }
    }

    private async Task EnsureNoOtherInProgressEntryInQueue(int queueId, int? excludedQueueEntryId = null)
    {
        if (queueId <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(queueId), "Queue ID must be greater than 0");
        }

        var hasAnotherInProgressEntry = await _dbContext.QueueEntries.AnyAsync(queueEntry =>
            queueEntry.QueueId == queueId &&
            queueEntry.Status == QueueEntryStatus.InProgress &&
            (!excludedQueueEntryId.HasValue || queueEntry.Id != excludedQueueEntryId.Value));

        if (hasAnotherInProgressEntry)
        {
            throw new InvalidOperationException($"Queue with ID {queueId} already has an entry in progress");
        }
    }

    private async Task<int> CalculateQueueEntryPosition(QueueEntry queueEntry)
    {
        if (queueEntry == null)
        {
            throw new ArgumentNullException(nameof(queueEntry), "Queue entry cannot be null");
        }
        if (queueEntry.QueueId <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(queueEntry.QueueId), "Queue ID must be greater than 0");
        }
        if (!Enum.IsDefined(typeof(PriorityLevel), queueEntry.Priority))
        {
            throw new ArgumentException(
                "Error queue entry priority level isn't valid: priority must be (High, Medium, or Low)",
                nameof(queueEntry.Priority)
            );
        }
        if (queueEntry.Status != QueueEntryStatus.Waiting)
        {
            throw new ArgumentException("Queue entry position is only calculated for entries in Waiting status", nameof(queueEntry.Status));
        }
        if (string.IsNullOrWhiteSpace(queueEntry.UserId))
        {
            throw new ArgumentException("Error queue entry user id (email) is required", nameof(queueEntry.UserId));
        }

        var normalizedUserId = queueEntry.UserId.Trim().ToLowerInvariant();
        var joinTime = queueEntry.JoinTime;

        try
        {
            var higherRankedEntriesCount = await _dbContext.QueueEntries
                .Where(existingQueueEntry => existingQueueEntry.QueueId == queueEntry.QueueId && existingQueueEntry.Status == QueueEntryStatus.Waiting)
                .CountAsync(existingQueueEntry =>
                    existingQueueEntry.Priority > queueEntry.Priority ||
                    (existingQueueEntry.Priority == queueEntry.Priority && existingQueueEntry.JoinTime < joinTime) ||
                    (existingQueueEntry.Priority == queueEntry.Priority && existingQueueEntry.JoinTime == joinTime && string.Compare(existingQueueEntry.UserId, normalizedUserId) < 0));

            return higherRankedEntriesCount;
        }
        catch (Exception err)
        {
            throw new Exception("Unexpected error calculating queue entry position: ", err);
        }
    }

    private async Task RecalculateQueuePositions(int queueId, string userId, int? previousPosition, int? newPosition)
    {
        var normalizedUserId = userId.Trim().ToLowerInvariant();

        if (newPosition.HasValue && !previousPosition.HasValue)
        {
            var insertedEntries = await _dbContext.QueueEntries
                .Where(queueEntry =>
                    queueEntry.QueueId == queueId &&
                    queueEntry.Status == QueueEntryStatus.Waiting &&
                    queueEntry.UserId != normalizedUserId &&
                    queueEntry.Position != null &&
                    queueEntry.Position >= newPosition.Value)
                .ToListAsync();

            foreach (var queueEntry in insertedEntries)
            {
                queueEntry.Position += 1;
            }

            return;
        }

        if (!newPosition.HasValue && previousPosition.HasValue)
        {
            var removedEntries = await _dbContext.QueueEntries
                .Where(queueEntry =>
                    queueEntry.QueueId == queueId &&
                    queueEntry.Status == QueueEntryStatus.Waiting &&
                    queueEntry.UserId != normalizedUserId &&
                    queueEntry.Position != null &&
                    queueEntry.Position > previousPosition.Value)
                .ToListAsync();

            foreach (var queueEntry in removedEntries)
            {
                queueEntry.Position -= 1;
            }

            return;
        }

        if (!previousPosition.HasValue || !newPosition.HasValue || previousPosition == newPosition)
        {
            return;
        }

        if (newPosition.Value < previousPosition.Value)
        {
            var movedUpEntries = await _dbContext.QueueEntries
                .Where(queueEntry =>
                    queueEntry.QueueId == queueId &&
                    queueEntry.Status == QueueEntryStatus.Waiting &&
                    queueEntry.UserId != normalizedUserId &&
                    queueEntry.Position != null &&
                    queueEntry.Position >= newPosition.Value &&
                    queueEntry.Position < previousPosition.Value)
                .ToListAsync();

            foreach (var queueEntry in movedUpEntries)
            {
                queueEntry.Position += 1;
            }

            return;
        }

        var movedDownEntries = await _dbContext.QueueEntries
            .Where(queueEntry =>
                queueEntry.QueueId == queueId &&
                queueEntry.Status == QueueEntryStatus.Waiting &&
                queueEntry.UserId != normalizedUserId &&
                queueEntry.Position != null &&
                queueEntry.Position > previousPosition.Value &&
                queueEntry.Position <= newPosition.Value)
            .ToListAsync();

        foreach (var queueEntry in movedDownEntries)
        {
            queueEntry.Position -= 1;
        }
    }



    public async Task<List<QueueEntry>> GetQueueEntries()
    {
        try
        {
            return await _dbContext.QueueEntries
                                    .Include(qe => qe.Queue)
                                        .ThenInclude(queue => queue!.Service)
                                    .Include(qe => qe.User)
                                    .OrderBy(qe => qe.Position)
                                    .ToListAsync();
        }
        catch(Exception err)
        {
            throw new Exception("Unexpected error getting queue entries: ", err);
        }
    }

    public async Task<QueueEntry?> GetActiveQueueEntry(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("Queue entry user id (email) is required", nameof(userId));
        }

        var normalizedUserId = userId.Trim().ToLowerInvariant();

        return await _dbContext.QueueEntries
            .Include(qe => qe.Queue!)
                .ThenInclude(queue => queue.Service)
            .Include(qe => qe.User)
            .Where(qe =>
                qe.UserId == normalizedUserId &&
                (qe.Status == QueueEntryStatus.Pending ||
                 qe.Status == QueueEntryStatus.Waiting ||
                 qe.Status == QueueEntryStatus.InProgress))
            .OrderByDescending(qe => qe.JoinTime)
            .FirstOrDefaultAsync();
    }

     public async Task<QueueEntry> CreateQueueEntry(QueueEntry? queueEntry)
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
        if (string.IsNullOrWhiteSpace(queueEntry.UserId))
        {
            throw new ArgumentException("Error queue entry user id (email) is required", nameof(queueEntry.UserId));
        }
        var normalizedUserId = queueEntry.UserId.Trim().ToLowerInvariant();
        queueEntry.UserId = normalizedUserId;

        try
        {
            var queueExists = await _dbContext.Queues.AnyAsync(q => q.Id == queueEntry.QueueId);
            if (!queueExists)
            {
                throw new KeyNotFoundException($"Queue with ID {queueEntry.QueueId} was not found");
            }

            await EnsureQueueIsOpen(queueEntry.QueueId);

            if (queueEntry.Status == QueueEntryStatus.InProgress)
            {
                await EnsureNoOtherInProgressEntryInQueue(queueEntry.QueueId);
            }

            var userExists = await _dbContext.UserProfiles.AnyAsync(u => u.Email == normalizedUserId);
            if (!userExists)
            {
                throw new KeyNotFoundException($"UserProfile with Email '{normalizedUserId}' was not found");
            }

            var hasActiveQueueEntry = await _dbContext.QueueEntries.AnyAsync(existingQueueEntry =>
                existingQueueEntry.UserId == normalizedUserId &&
                (existingQueueEntry.Status == QueueEntryStatus.Pending ||
                 existingQueueEntry.Status == QueueEntryStatus.Waiting ||
                 existingQueueEntry.Status == QueueEntryStatus.InProgress));
            if (hasActiveQueueEntry)
            {
                throw new ArgumentException($"User '{normalizedUserId}' already has an active queue entry");
            }

            await _dbContext.QueueEntries.AddAsync(queueEntry);
            await _dbContext.SaveChangesAsync();
            await _notificationService.CreateQueueJoinedNotification(queueEntry.Id);
            return queueEntry;
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception err)
        {
            throw new Exception("Unexpected error creating queue entry: ", err);
        }

    }

    public async Task<QueueEntry> UpdateQueueEntryPosition(int id, int position)
    {
        if (id <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(id), "Queue entry ID must be greater than 0");
        }
        if (position < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(position), "Position must be zero-based and cannot be negative");
        }

        try
        {
            var existingQueueEntry = await _dbContext.QueueEntries
                .Include(qe => qe.Queue)
                .Include(qe => qe.User)
                .FirstOrDefaultAsync(qe => qe.Id == id);

            if (existingQueueEntry == null)
            {
                throw new KeyNotFoundException($"Queue entry with ID {id} was not found");
            }

            var normalizedUserId = existingQueueEntry.UserId.Trim().ToLowerInvariant();

            if (existingQueueEntry.Status != QueueEntryStatus.Waiting || existingQueueEntry.Position == null)
            {
                throw new ArgumentException("Only waiting queue entries with a position can be reordered");
            }

            var waitingEntriesCount = await _dbContext.QueueEntries.CountAsync(qe => qe.QueueId == existingQueueEntry.QueueId && qe.Status == QueueEntryStatus.Waiting);
            if (position >= waitingEntriesCount)
            {
                throw new ArgumentOutOfRangeException(nameof(position), "Position must be within the waiting queue range");
            }

            var previousPosition = existingQueueEntry.Position;
            existingQueueEntry.Position = position;

            await _dbContext.SaveChangesAsync();

            await RecalculateQueuePositions(existingQueueEntry.QueueId, normalizedUserId, previousPosition, existingQueueEntry.Position);
            await _dbContext.SaveChangesAsync();
            await _notificationService.NotifyPatientIfFirstInLine(existingQueueEntry.QueueId);

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
            throw new Exception("Unexpected error updating queue entry position: ", err);
        }
    }
    public async Task<QueueEntry> UpdateQueueEntryStatus(int id, QueueEntryStatus status)
    {
        if (id <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(id), "Queue entry ID must be greater than 0");
        }
        if (!Enum.IsDefined(typeof(QueueEntryStatus), status))
        {
            throw new ArgumentException(
                "Error queue entry status isn't valid: status must be (Waiting, Served, Cancelled, Pending)",
                nameof(status)
            );
        }

        try
        {
            var existingQueueEntry = await _dbContext.QueueEntries
                .Include(qe => qe.Queue)
                .Include(qe => qe.User)
                .FirstOrDefaultAsync(qe => qe.Id == id);

            if (existingQueueEntry == null)
            {
                throw new KeyNotFoundException($"Queue entry with ID {id} was not found");
            }

            var normalizedUserId = existingQueueEntry.UserId.Trim().ToLowerInvariant();

            var previousStatus = existingQueueEntry.Status;
            var previousPosition = existingQueueEntry.Position;

            if (previousStatus != status)
            {
                var isCancelOrRemove = status == QueueEntryStatus.Cancelled || status == QueueEntryStatus.Removed;
                
                if (!isCancelOrRemove)
                {
                    await EnsureQueueIsOpen(existingQueueEntry.QueueId);
                }

                if (status == QueueEntryStatus.InProgress)
                {
                    await EnsureNoOtherInProgressEntryInQueue(existingQueueEntry.QueueId, existingQueueEntry.Id);
                }
            }

            existingQueueEntry.Status = status;

            if (status == QueueEntryStatus.Waiting)
            {
                if (existingQueueEntry.Position == null)
                {
                    existingQueueEntry.JoinTime = DateTime.UtcNow;
                }

                existingQueueEntry.Position = await CalculateQueueEntryPosition(existingQueueEntry);
            }
            else
            {
                existingQueueEntry.Position = null;
            }

            if (previousStatus != QueueEntryStatus.Waiting)
            {
                previousPosition = null;
            }

            var updatedPosition = status == QueueEntryStatus.Waiting ? existingQueueEntry.Position : null;

            await _dbContext.SaveChangesAsync();

            await RecalculateQueuePositions(existingQueueEntry.QueueId, normalizedUserId, previousPosition, updatedPosition);
            await _dbContext.SaveChangesAsync();
            if (previousStatus == QueueEntryStatus.Pending && status == QueueEntryStatus.Waiting)
            {
                await _notificationService.CreatePatientQueueApprovedNotification(existingQueueEntry.Id);
            }
            if (previousStatus != QueueEntryStatus.InProgress && status == QueueEntryStatus.InProgress)
            {
                await _notificationService.CreatePatientFrontDeskNotification(existingQueueEntry.Id);
            }
            await _notificationService.NotifyPatientIfFirstInLine(existingQueueEntry.QueueId);

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
        catch (InvalidOperationException)
        {
            throw;
        }
        catch(Exception err)
        {
            throw new Exception("Unexpected error updating queue entry status: ", err);
        }
    }

    public async Task<QueueEntry> UpdateQueueEntryStatusAndPriority(int id, QueueEntryStatus status, PriorityLevel priority)
    {
        if (id <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(id), "Queue entry ID must be greater than 0");
        }
        if (status != QueueEntryStatus.Pending && status != QueueEntryStatus.Waiting)
        {
            throw new ArgumentException(
                "Error queue entry status isn't valid: status must be Pending or Waiting",
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

        try
        {
            var existingQueueEntry = await _dbContext.QueueEntries
                .Include(qe => qe.Queue)
                .Include(qe => qe.User)
                .FirstOrDefaultAsync(qe => qe.Id == id);

            if (existingQueueEntry == null)
            {
                throw new KeyNotFoundException($"Queue entry with ID {id} was not found");
            }

            var normalizedUserId = existingQueueEntry.UserId.Trim().ToLowerInvariant();
            existingQueueEntry.UserId = normalizedUserId;

            var queueExists = await _dbContext.Queues.AnyAsync(q => q.Id == existingQueueEntry.QueueId);
            if (!queueExists)
            {
                throw new KeyNotFoundException($"Queue with ID {existingQueueEntry.QueueId} was not found");
            }

            var userExists = await _dbContext.UserProfiles.AnyAsync(u => u.Email == normalizedUserId);
            if (!userExists)
            {
                throw new KeyNotFoundException($"UserProfile with Email '{normalizedUserId}' was not found");
            }

            var previousStatus = existingQueueEntry.Status;
            var previousPosition = existingQueueEntry.Position;

            if ((status == QueueEntryStatus.Waiting || status == QueueEntryStatus.Pending) && previousStatus != status)
            {
                await EnsureQueueIsOpen(existingQueueEntry.QueueId);
            }

            existingQueueEntry.Status = status;
            existingQueueEntry.Priority = priority;

            if (status == QueueEntryStatus.Waiting)
            {
                if (existingQueueEntry.Position == null)
                {
                    existingQueueEntry.JoinTime = DateTime.UtcNow;
                }

                existingQueueEntry.Position = await CalculateQueueEntryPosition(existingQueueEntry);
            }
            else
            {
                existingQueueEntry.Position = null;
            }

            if (previousStatus != QueueEntryStatus.Waiting)
            {
                previousPosition = null;
            }

            var updatedPosition = status == QueueEntryStatus.Waiting ? existingQueueEntry.Position : null;

            await _dbContext.SaveChangesAsync();

            await RecalculateQueuePositions(existingQueueEntry.QueueId, normalizedUserId, previousPosition, updatedPosition);
            await _dbContext.SaveChangesAsync();
            if (previousStatus == QueueEntryStatus.Pending && status == QueueEntryStatus.Waiting)
            {
                await _notificationService.CreatePatientQueueApprovedNotification(existingQueueEntry.Id);
            }
            await _notificationService.NotifyPatientIfFirstInLine(existingQueueEntry.QueueId);
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
        catch (InvalidOperationException)
        {
            throw;
        }
        catch(Exception err)
        {
            Console.WriteLine(err.InnerException?.Message ?? err.Message);
            throw new Exception("Unexpected error updating queue entry: ", err);
        }
    }

    public async Task<bool> DeleteQueueEntry(int queueId, string userId)
    {
        if (queueId <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(queueId), "Queue ID must be greater than 0");
        }
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("Queue entry user id (email) is required", nameof(userId));
        }

        var normalizedUserId = userId.Trim().ToLowerInvariant();

        try
        {
            var existingQueueEntry = await _dbContext.QueueEntries
                .FirstOrDefaultAsync(qe => qe.QueueId == queueId && qe.UserId == normalizedUserId);

            if (existingQueueEntry == null)
            {
                throw new KeyNotFoundException($"Queue entry for queue ID {queueId} and user '{normalizedUserId}' was not found");
            }

            var previousPosition = existingQueueEntry.Position;

            existingQueueEntry.Status = QueueEntryStatus.Cancelled;
            existingQueueEntry.Position = null;

            await _dbContext.SaveChangesAsync();

            // Recalculate positions for remaining entries if the cancelled entry was in the waiting queue
            if (previousPosition.HasValue)
            {
                await RecalculateQueuePositions(queueId, normalizedUserId, previousPosition, null);
                await _dbContext.SaveChangesAsync();
            }

            await _notificationService.NotifyPatientIfFirstInLine(queueId);

            return true;
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (Exception err)
        {
            throw new Exception("Unexpected error cancelling queue entry: ", err);
        }
    }

    public async Task<EstimatedWaitTimeDTO> EstimateWaitTime(int queueId, string userId)
    {
        if (queueId <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(queueId), "Queue ID must be greater than 0");
        }
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("Queue entry user id (email) is required", nameof(userId));
        }

        var normalizedUserId = userId.Trim().ToLowerInvariant();

        try
        {
            // Get the queue entry with related queue and service data
            var queueEntry = await _dbContext.QueueEntries
                .Include(qe => qe.Queue!)
                    .ThenInclude(q => q.Service)
                .FirstOrDefaultAsync(qe => qe.QueueId == queueId && qe.UserId == normalizedUserId);

            if (queueEntry == null)
            {
                throw new KeyNotFoundException($"Queue entry for queue ID {queueId} and user '{normalizedUserId}' was not found");
            }

            var queue = queueEntry.Queue;
            if (queue == null)
            {
                throw new KeyNotFoundException($"Queue with ID {queueId} was not found");
            }

            var service = queue.Service;
            if (service == null)
            {
                throw new KeyNotFoundException($"Service for queue {queueId} was not found");
            }

            var currentInProgressEntry = await _dbContext.QueueEntries
                .Where(qe => qe.QueueId == queueId && qe.Status == QueueEntryStatus.InProgress)
                .OrderBy(qe => qe.JoinTime)
                .FirstOrDefaultAsync();

            var inProgressElapsedMinutes = 0;
            var inProgressRemainingMinutes = 0;

            if (currentInProgressEntry != null)
            {
                inProgressElapsedMinutes = Math.Max(0, (int)Math.Floor((DateTime.UtcNow - currentInProgressEntry.JoinTime).TotalMinutes));
                inProgressRemainingMinutes = Math.Max(0, service.Duration - inProgressElapsedMinutes);
            }

            // Calculate wait time based on position and service duration
            // Formula when a patient is in progress: Remaining current service + (Position × Service Duration)
            // Formula otherwise: Position × Service Duration
            int estimatedWaitTimeMinutes = 0;
            string message = string.Empty;

            if (queueEntry.Status == QueueEntryStatus.Waiting && queueEntry.Position.HasValue)
            {
                estimatedWaitTimeMinutes = (queueEntry.Position.Value * service.Duration) + inProgressRemainingMinutes;

                if (currentInProgressEntry != null)
                {
                    message = $"You are at position {queueEntry.Position + 1}. Current patient has been in progress for {inProgressElapsedMinutes} minutes. Estimated wait time is approximately {estimatedWaitTimeMinutes} minutes.";
                }
                else
                {
                    message = $"You are at position {queueEntry.Position + 1}. Estimated wait time is approximately {estimatedWaitTimeMinutes} minutes.";
                }
            }
            else if (queueEntry.Status == QueueEntryStatus.Pending)
            {
                message = "Your position has not been assigned yet. Please wait for confirmation.";
            }
            else if (queueEntry.Status == QueueEntryStatus.InProgress)
            {
                message = $"Your consultation is currently in progress. Elapsed time: {inProgressElapsedMinutes} minutes.";
            }
            else if (queueEntry.Status == QueueEntryStatus.Completed)
            {
                message = "You have already been served.";
            }
            else if (queueEntry.Status == QueueEntryStatus.Cancelled)
            {
                message = "Your queue entry has been cancelled.";
            }

            return new EstimatedWaitTimeDTO
            {
                Position = queueEntry.Position ?? -1,
                EstimatedWaitTimeMinutes = estimatedWaitTimeMinutes,
                ServiceDurationMinutes = service.Duration,
                UserId = normalizedUserId,
                QueueId = queueId,
                Message = message
            };
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (Exception err)
        {
            throw new Exception("Unexpected error estimating wait time: ", err);
        }
    }
}