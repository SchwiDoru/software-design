using Backend.Constants;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Backend.Tests.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Tests.Services;

public class NotificationServiceTests : IDisposable
{
    private readonly AppDbContext _testDbContext;
    private readonly NotificationService _service;

    public NotificationServiceTests()
    {
        _testDbContext = TestDbContextFactory.CreateWithSeedData();
        _service = new NotificationService(_testDbContext);
    }

    private async Task<QueueEntry> AddQueueEntry(
        string userId = "notify@example.com",
        QueueEntryStatus status = QueueEntryStatus.Pending,
        int queueId = 1,
        int? position = null)
    {
        if (!await _testDbContext.UserProfiles.AnyAsync(profile => profile.Email == userId))
        {
            _testDbContext.UserProfiles.Add(new UserProfile
            {
                Email = userId,
                Name = "Notification User"
            });
            await _testDbContext.SaveChangesAsync();
        }

        var entry = new QueueEntry
        {
            QueueId = queueId,
            UserId = userId,
            JoinTime = DateTime.UtcNow,
            Status = status,
            Priority = PriorityLevel.Low,
            Position = position
        };

        _testDbContext.QueueEntries.Add(entry);
        await _testDbContext.SaveChangesAsync();
        return entry;
    }

    [Fact]
    public async Task CreateQueueJoinedNotification_WithExistingEntry_PersistsAdminStaffNotification()
    {
        var queueEntry = await AddQueueEntry();

        await _service.CreateQueueJoinedNotification(queueEntry.Id);

        var notification = await _testDbContext.NotificationEvents.SingleAsync();
        Assert.Equal(NotificationType.QueueJoined, notification.Type);
        Assert.Equal(NotificationAudience.AdminStaff, notification.Audience);
        Assert.Equal(queueEntry.UserId, notification.UserId);
    }

    [Fact]
    public async Task CreatePatientQueueApprovedNotification_DoesNotDuplicateNotification()
    {
        var queueEntry = await AddQueueEntry(status: QueueEntryStatus.Waiting, position: 0);

        await _service.CreatePatientQueueApprovedNotification(queueEntry.Id);
        await _service.CreatePatientQueueApprovedNotification(queueEntry.Id);

        var notifications = await _testDbContext.NotificationEvents
            .Where(notification => notification.Type == NotificationType.QueueApproved)
            .ToListAsync();

        Assert.Single(notifications);
    }

    [Fact]
    public async Task NotifyPatientIfFirstInLine_WithWaitingEntry_CreatesPatientNotification()
    {
        var queueEntry = await AddQueueEntry(status: QueueEntryStatus.Waiting, position: 0);

        await _service.NotifyPatientIfFirstInLine(queueEntry.QueueId);

        var notification = await _testDbContext.NotificationEvents.SingleAsync();
        Assert.Equal(NotificationType.FirstInLine, notification.Type);
        Assert.Equal(NotificationAudience.Patient, notification.Audience);
        Assert.Equal(queueEntry.Id, notification.QueueEntryId);
    }

    [Fact]
    public async Task GetNotifications_ForPatientWithoutUserId_ReturnsEmptyList()
    {
        var result = await _service.GetNotifications(UserRole.Patient, null, null);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetNotifications_FiltersByRoleAndSinceTimestamp()
    {
        _testDbContext.NotificationEvents.AddRange(
            new NotificationEvent
            {
                Type = NotificationType.QueueJoined,
                Audience = NotificationAudience.AdminStaff,
                Title = "Admin one",
                Message = "First",
                CreatedAt = DateTime.UtcNow.AddMinutes(-10),
                UserId = "admin@example.com"
            },
            new NotificationEvent
            {
                Type = NotificationType.FirstInLine,
                Audience = NotificationAudience.Patient,
                Title = "Patient one",
                Message = "Second",
                CreatedAt = DateTime.UtcNow.AddMinutes(-1),
                UserId = "patient@example.com"
            });
        await _testDbContext.SaveChangesAsync();

        var staffNotifications = await _service.GetNotifications(UserRole.Staff, null, DateTime.UtcNow.AddMinutes(-5));
        var patientNotifications = await _service.GetNotifications(UserRole.Patient, "  PATIENT@example.com ", null);

        Assert.Empty(staffNotifications);
        Assert.Single(patientNotifications);
        Assert.Equal("Patient one", patientNotifications[0].Title);
    }

    public void Dispose()
    {
        _testDbContext.Database.EnsureDeleted();
        _testDbContext.Dispose();
    }
}
