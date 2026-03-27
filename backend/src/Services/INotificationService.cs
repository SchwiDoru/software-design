using Backend.Constants;
using Backend.DTO;

namespace Backend.Services;

public interface INotificationService
{
    Task<List<NotificationDTO>> GetNotifications(UserRole role, string? userId, DateTime? since);
    Task CreateQueueJoinedNotification(int queueEntryId);
    Task CreatePatientQueueApprovedNotification(int queueEntryId);
    Task NotifyPatientIfFirstInLine(int queueId);
    Task CreatePatientFrontDeskNotification(int queueEntryId);
    Task CreatePatientVisitCompletedNotification(int queueEntryId);
}
