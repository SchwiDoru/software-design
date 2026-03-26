using Xunit;
using Backend.Services;
using Backend.Models;
using Backend.Constants;
using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Backend.Tests.Data;

namespace Backend.Tests.Services;

public class QueueEntryServiceTests : IDisposable
{
    private readonly AppDbContext _testDbContext;
    private readonly QueueEntryServices _service;

    public QueueEntryServiceTests()
    {
        _testDbContext = TestDbContextFactory.CreateWithSeedData();
        _service = new QueueEntryServices(_testDbContext);
    }

    private async Task<QueueEntry> AddWaitingQueueEntry(
        int queueId = 1,
        string userId = "test@example.com",
        QueueEntryStatus status = QueueEntryStatus.Waiting,
        PriorityLevel priority = PriorityLevel.Low)
    {
        var normalizedEmail = userId.Trim().ToLower();

        if (!await _testDbContext.UserProfiles.AnyAsync(u => u.Email == normalizedEmail))
        {
            _testDbContext.UserProfiles.Add(new UserProfile { Name = "Test User", Email = normalizedEmail });
        }

        if (!await _testDbContext.Queues.AnyAsync(q => q.Id == queueId))
        {
            _testDbContext.Queues.Add(new Queue { Id = queueId, Status = QueueStatus.Open, ServiceId = 1 });
        }

        await _testDbContext.SaveChangesAsync();

        var queueEntry = new QueueEntry
        {
            QueueId = queueId,
            UserId = normalizedEmail,
            Status = status,
            Priority = priority,
            JoinTime = DateTime.UtcNow
        };

        _testDbContext.QueueEntries.Add(queueEntry);
        await _testDbContext.SaveChangesAsync();

        return queueEntry;
    }

    [Fact]
    public async Task UpdateQueueEntryStatus_WhenStatusChangesAndQueueIsOpen_UpdatesSuccessfully()
    {
        var entry = await AddWaitingQueueEntry(status: QueueEntryStatus.Pending);
        
        // REMOVED HARDCODE '2': Using entry.Id
        var updated = await _service.UpdateQueueEntryStatus(entry.Id, QueueEntryStatus.Waiting);

        Assert.Equal(QueueEntryStatus.Waiting, updated.Status);
    }

    [Fact]
    public async Task UpdateQueueEntryPosition_WhenQueueEntryStatusIsNotWaiting_ThrowsArgumentException()
    {
        // FIXED STATUS: Using Completed instead of Served
        var entry = await AddWaitingQueueEntry(status: QueueEntryStatus.Completed);

        // REMOVED HARDCODE '2': Using entry.Id
        await Assert.ThrowsAsync<ArgumentException>(() => _service.UpdateQueueEntryPosition(entry.Id, 0));
    }

    [Fact]
    public async Task UpdateQueueEntryStatusAndPriority_WhenUserIdHasLeadingOrTrailingSpaces_ReturnsNormalizedUserId()
    {
        var entry = await AddWaitingQueueEntry(userId: "  test@example.com  ", status: QueueEntryStatus.Pending);

        // REMOVED HARDCODE '2': Using entry.Id
        var updated = await _service.UpdateQueueEntryStatusAndPriority(entry.Id, QueueEntryStatus.Waiting, PriorityLevel.Low);

        Assert.Equal("test@example.com", updated.UserId);
    }

    [Fact]
    public async Task EstimateWaitTime_WhenUserIsWaiting_ReturnsCalculatedWaitTime()
    {
        string email = "estimate@example.com";
        var entry = await AddWaitingQueueEntry(userId: email, status: QueueEntryStatus.Waiting);

        // REMOVED HARDCODE: Using entry properties to match normalized values
        var result = await _service.EstimateWaitTime(entry.QueueId, entry.UserId);

        Assert.Equal(entry.UserId, result.UserId);
    }

    public void Dispose()
    {
        _testDbContext.Database.EnsureDeleted();
        _testDbContext.Dispose();
    }
}