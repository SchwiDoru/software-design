using Backend.Constants;
using Backend.Data;
using Backend.DTO;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _dbContext;

    public NotificationService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<NotificationDTO>> GetNotifications(UserRole role, string? userId, DateTime? since)
    {
        var query = _dbContext.NotificationEvents.AsQueryable();

        if (role == UserRole.Patient)
        {
            var normalizedUserId = userId?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(normalizedUserId))
            {
                return [];
            }

            query = query.Where(notification =>
                notification.Audience == NotificationAudience.Patient &&
                notification.UserId == normalizedUserId);
        }
        else if (role == UserRole.Admin || role == UserRole.Staff)
        {
            query = query.Where(notification => notification.Audience == NotificationAudience.AdminStaff);
        }
        else
        {
            return [];
        }

        if (since.HasValue)
        {
            query = query.Where(notification => notification.CreatedAt > since.Value);
        }

        return await query
            .OrderBy(notification => notification.CreatedAt)
            .Take(20)
            .Select(notification => new NotificationDTO
            {
                Id = notification.Id,
                Type = notification.Type,
                Audience = notification.Audience,
                Title = notification.Title,
                Message = notification.Message,
                CreatedAt = notification.CreatedAt,
                UserId = notification.UserId,
                QueueId = notification.QueueId,
                QueueEntryId = notification.QueueEntryId
            })
            .ToListAsync();
    }

    public async Task CreateQueueJoinedNotification(int queueEntryId)
    {
        var queueEntry = await _dbContext.QueueEntries
            .Include(entry => entry.User)
            .Include(entry => entry.Queue!)
                .ThenInclude(queue => queue.Service)
            .FirstOrDefaultAsync(entry => entry.Id == queueEntryId);

        if (queueEntry == null)
        {
            return;
        }

        var patientName = queueEntry.User?.Name ?? queueEntry.UserId;
        var serviceName = queueEntry.Queue?.Service?.Name ?? "the queue";

        _dbContext.NotificationEvents.Add(new NotificationEvent
        {
            Type = NotificationType.QueueJoined,
            Audience = NotificationAudience.AdminStaff,
            Title = "New patient joined",
            Message = $"{patientName} joined {serviceName} and is waiting for review.",
            CreatedAt = DateTime.UtcNow,
            UserId = queueEntry.UserId,
            QueueId = queueEntry.QueueId,
            QueueEntryId = queueEntry.Id
        });

        await _dbContext.SaveChangesAsync();
    }

    public async Task CreatePatientQueueApprovedNotification(int queueEntryId)
    {
        var queueEntry = await _dbContext.QueueEntries
            .Include(entry => entry.User)
            .Include(entry => entry.Queue!)
                .ThenInclude(queue => queue.Service)
            .FirstOrDefaultAsync(entry => entry.Id == queueEntryId);

        if (queueEntry == null)
        {
            return;
        }

        var notificationAlreadyExists = await _dbContext.NotificationEvents.AnyAsync(notification =>
            notification.Type == NotificationType.QueueApproved &&
            notification.Audience == NotificationAudience.Patient &&
            notification.QueueEntryId == queueEntry.Id);

        if (notificationAlreadyExists)
        {
            return;
        }

        var serviceName = queueEntry.Queue?.Service?.Name ?? "your queue";

        _dbContext.NotificationEvents.Add(new NotificationEvent
        {
            Type = NotificationType.QueueApproved,
            Audience = NotificationAudience.Patient,
            Title = "Queue request approved",
            Message = $"Your request for {serviceName} was approved. We will notify you again when you are first in line.",
            CreatedAt = DateTime.UtcNow,
            UserId = queueEntry.UserId,
            QueueId = queueEntry.QueueId,
            QueueEntryId = queueEntry.Id
        });

        await _dbContext.SaveChangesAsync();
    }

    public async Task NotifyPatientIfFirstInLine(int queueId)
    {
        var firstWaitingEntry = await _dbContext.QueueEntries
            .Include(entry => entry.User)
            .Include(entry => entry.Queue!)
                .ThenInclude(queue => queue.Service)
            .Where(entry =>
                entry.QueueId == queueId &&
                entry.Status == QueueEntryStatus.Waiting &&
                entry.Position == 0)
            .FirstOrDefaultAsync();

        if (firstWaitingEntry == null)
        {
            return;
        }

        var notificationAlreadyExists = await _dbContext.NotificationEvents.AnyAsync(notification =>
            notification.Type == NotificationType.FirstInLine &&
            notification.Audience == NotificationAudience.Patient &&
            notification.QueueEntryId == firstWaitingEntry.Id);

        if (notificationAlreadyExists)
        {
            return;
        }

        var patientName = firstWaitingEntry.User?.Name ?? "Patient";
        var serviceName = firstWaitingEntry.Queue?.Service?.Name ?? "your queue";

        _dbContext.NotificationEvents.Add(new NotificationEvent
        {
            Type = NotificationType.FirstInLine,
            Audience = NotificationAudience.Patient,
            Title = "You are first in line",
            Message = $"{patientName}, please get ready. You are first in line for {serviceName}.",
            CreatedAt = DateTime.UtcNow,
            UserId = firstWaitingEntry.UserId,
            QueueId = firstWaitingEntry.QueueId,
            QueueEntryId = firstWaitingEntry.Id
        });

        await _dbContext.SaveChangesAsync();
    }
}
