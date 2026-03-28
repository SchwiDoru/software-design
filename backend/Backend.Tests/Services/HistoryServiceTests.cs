using Backend.Constants;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Backend.Tests.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Tests.Services;

public class HistoryServiceTests : IDisposable
{
    private readonly AppDbContext _testDbContext;
    private readonly HistoryService _service;

    public HistoryServiceTests()
    {
        _testDbContext = TestDbContextFactory.CreateWithSeedData();
        _service = new HistoryService(_testDbContext, new NotificationService(_testDbContext));
    }

    private async Task<QueueEntry> AddQueueEntry(
        string userId = "history@example.com",
        QueueEntryStatus status = QueueEntryStatus.InProgress,
        int queueId = 1)
    {
        if (!await _testDbContext.UserProfiles.AnyAsync(profile => profile.Email == userId))
        {
            _testDbContext.UserProfiles.Add(new UserProfile
            {
                Email = userId,
                Name = "History User"
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
            Position = status == QueueEntryStatus.Waiting ? 0 : null
        };

        _testDbContext.QueueEntries.Add(entry);
        await _testDbContext.SaveChangesAsync();
        return entry;
    }

    [Fact]
    public async Task CompleteVisit_WithValidData_CreatesHistoryAndMarksQueueEntryCompleted()
    {
        var queueEntry = await AddQueueEntry();

        var result = await _service.CompleteVisit(
            queueEntry.Id,
            [new HistoryDetail { Diagnosis = "Migraine", ServiceType = "Consultation", Assessment = "Stable", Label = "Primary" }],
            [new Prescription { PrescriptionName = "Ibuprofen", Amt = 10, DailyUsage = "2x daily" }]);

        Assert.StartsWith("QS-", result.HistoryId);
        Assert.Equal(queueEntry.Id, result.QueueEntryId);
        Assert.Single(result.HistoryDetails);
        Assert.Single(result.Prescriptions);

        var updatedEntry = await _testDbContext.QueueEntries.FirstAsync(entry => entry.Id == queueEntry.Id);
        Assert.Equal(QueueEntryStatus.Completed, updatedEntry.Status);
        Assert.Null(updatedEntry.Position);

        var completionNotification = await _testDbContext.NotificationEvents
            .SingleAsync(notification => notification.Type == NotificationType.VisitCompleted);
        Assert.Equal(queueEntry.Id, completionNotification.QueueEntryId);
    }

    [Fact]
    public async Task CompleteVisit_WhenQueueEntryMissing_ThrowsKeyNotFoundException()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.CompleteVisit(999, [], []));
    }

    [Fact]
    public async Task CompleteVisit_WhenHistoryAlreadyExists_ThrowsInvalidOperationException()
    {
        var queueEntry = await AddQueueEntry();
        await _service.CompleteVisit(queueEntry.Id, [], []);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CompleteVisit(queueEntry.Id, [], []));
    }

    [Fact]
    public async Task CompleteVisit_WhenQueueEntryCancelled_ThrowsInvalidOperationException()
    {
        var queueEntry = await AddQueueEntry(status: QueueEntryStatus.Cancelled);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CompleteVisit(queueEntry.Id, [], []));
    }

    [Fact]
    public async Task GetPatientHistory_ReturnsNewestHistoryFirst()
    {
        var olderEntry = await AddQueueEntry(userId: "patienthistory@example.com", status: QueueEntryStatus.Completed);
        var newerEntry = await AddQueueEntry(userId: "patienthistory@example.com", status: QueueEntryStatus.Completed, queueId: 2);

        var olderHistory = new History
        {
            HistoryId = "QS-OLDER",
            Date = DateTime.UtcNow.AddDays(-2),
            QueueEntryId = olderEntry.Id
        };

        var newerHistory = new History
        {
            HistoryId = "QS-NEWER",
            Date = DateTime.UtcNow.AddDays(-1),
            QueueEntryId = newerEntry.Id
        };

        _testDbContext.Histories.AddRange(olderHistory, newerHistory);
        await _testDbContext.SaveChangesAsync();

        var result = await _service.GetPatientHistory("  PatientHistory@Example.com ");

        Assert.Equal(2, result.Count);
        Assert.Equal("QS-NEWER", result[0].HistoryId);
        Assert.Equal("QS-OLDER", result[1].HistoryId);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task GetPatientHistory_WithBlankEmail_ThrowsArgumentException(string? email)
    {
        await Assert.ThrowsAsync<ArgumentException>(() => _service.GetPatientHistory(email!));
    }

    public void Dispose()
    {
        _testDbContext.Database.EnsureDeleted();
        _testDbContext.Dispose();
    }
}
