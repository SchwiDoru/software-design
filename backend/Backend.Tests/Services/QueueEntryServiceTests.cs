using Xunit;
using Backend.Services;
using Backend.Models;
using Backend.Constants;
using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Backend.Tests.Data;

namespace Backend.Tests.Services;

public class QueueEntryServiceTests: IDisposable

{
    private readonly AppDbContext _testDbContext;
    private readonly QueueEntryServices _service;
    
    public QueueEntryServiceTests()
    {
 
        _testDbContext = TestDbContextFactory.CreateWithSeedData();
        _service = new QueueEntryServices(
            _testDbContext,
            new NotificationService(_testDbContext),
            new TestPriorityClassifier(),
            new TestAISettingsService(enabled: false));
    }

    private sealed class TestPriorityClassifier : IPriorityClassifier
    {
        public Task<PriorityLevel> ClassifyAsync(string? description) => Task.FromResult(PriorityLevel.Low);
    }

    private sealed class TestAISettingsService(bool enabled) : IAISettingsService
    {
        private bool _enabled = enabled;

        public Task<bool> IsAiModeEnabledAsync() => Task.FromResult(_enabled);

        public Task SetAiModeAsync(bool enabled)
        {
            _enabled = enabled;
            return Task.CompletedTask;
        }
    }

    private static QueueEntry CreateValidQueueEntry(
        int queueId = 1,
        string userId = "test@example.com",
        QueueEntryStatus status = QueueEntryStatus.Pending,
        PriorityLevel priority = PriorityLevel.Low)
        
    {
        return new QueueEntry
        {
            QueueId = queueId,
            UserId = userId,
            Status = status,
            Priority = priority,
        };
    }

    private async Task<QueueEntry> AddWaitingQueueEntry(
        int queueId = 1,
        string userId = "test@example.com",
        QueueEntryStatus status = QueueEntryStatus.Waiting,
        PriorityLevel priority = PriorityLevel.Low)
    {
        var userExists = await _testDbContext.UserProfiles.AnyAsync(u => u.Email == userId);
        if (!userExists)
        {
            _testDbContext.UserProfiles.Add(new UserProfile
            {
                Name = userId,
                Email = userId,
            });
            await _testDbContext.SaveChangesAsync();
        }

        var queueEntry = CreateValidQueueEntry(queueId, userId, status, priority);

        if (status == QueueEntryStatus.Waiting)
        {
            var waitingCount = await _testDbContext.QueueEntries
                .CountAsync(qe => qe.QueueId == queueId && qe.Status == QueueEntryStatus.Waiting);
            queueEntry.Position = waitingCount;
        }
        else
        {
            queueEntry.Position = 0;
        }

        _testDbContext.QueueEntries.Add(queueEntry);
        await _testDbContext.SaveChangesAsync();

        return queueEntry;
    }
    
    [Fact]
    public async Task CreateQueueEntry_WithNullQueueEntry_ThrowsArgumentNullException()
    {
        // Arrange
        QueueEntry? emptyQueueEntry = null;
        
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _service.CreateQueueEntry(emptyQueueEntry));
    }
    
    [Fact]
    public async Task CreateQueueEntry_WithInvalidStatus_ThrowsArgumentException()
    {
        // Arrange
        
        var invalidQueueEntry = CreateValidQueueEntry(status: (QueueEntryStatus)999);
        
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateQueueEntry(invalidQueueEntry));
    }
    
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("     ")]
    public async Task CreateQueueEntry_WithBlankOrNullUserId_ThrowsArgumentException(string? userId)
    {
        // Arrange
        var emptyUserQueueEntry = CreateValidQueueEntry(userId: userId!);
        
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateQueueEntry(emptyUserQueueEntry));
    }
    
    [Theory]
    [InlineData(4)]
    [InlineData(999)]
    public async Task CreateQueueEntry_WhenQueueDoesNotExist_ThrowsKeyNotFoundException(int queueId)
    {
        // Arrange
        var queueEntry = CreateValidQueueEntry(queueId: queueId);
        
        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.CreateQueueEntry(queueEntry));
    }
    
    [Fact]
    public async Task CreateQueueEntry_WhenQueueIsClosed_ThrowsInvalidOperationException()
    {
        // Arrange
        var queueEntry = CreateValidQueueEntry(queueId: 3);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateQueueEntry(queueEntry));
    }
    
    [Fact]
    public async Task CreateQueueEntry_WhenUserProfileDoesNotExist_ThrowsKeyNotFoundException()
    {
        // Arrange
        var queueEntry = CreateValidQueueEntry(userId: "random_email_that_doesnt_exist@gmail.com");
        
        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.CreateQueueEntry(queueEntry));
    }
    
    [Theory]
    [InlineData(QueueEntryStatus.Waiting)]
    [InlineData(QueueEntryStatus.InProgress)]
    [InlineData(QueueEntryStatus.Pending)]
    public async Task CreateQueueEntry_WhenUserHasActiveEntry_ThrowsArgumentException(QueueEntryStatus status)
    {
        // Arrange
        var activeQueueEntry = CreateValidQueueEntry(status: status);
        
        await _service.CreateQueueEntry(activeQueueEntry);

        var queueEntryWhileActive = CreateValidQueueEntry(queueId: 2);
        
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateQueueEntry(queueEntryWhileActive));
    }
    
    [Fact]
    public async Task CreateQueueEntry_WithValidData_ReturnsQueueEntry()
    {
        // Arrange
        var queueEntry = CreateValidQueueEntry(queueId: 2, userId: "test2@example.com");
        
        // Act
        var result = await _service.CreateQueueEntry(queueEntry);
        
        // Assert
        Assert.NotNull(result);
        Assert.Equal(queueEntry.QueueId, result.QueueId);
        Assert.Equal(queueEntry.UserId, result.UserId);
        Assert.Equal(queueEntry.Status, result.Status);
        Assert.Equal(queueEntry.Priority, result.Priority);

        var createdEntry = await _testDbContext.QueueEntries.FirstOrDefaultAsync(qe => qe.Id == result.Id);
        Assert.NotNull(createdEntry);
    }

    [Fact]
    public async Task CreateQueueEntry_WhenQueueAlreadyHasInProgress_ThrowsInvalidOperationException()
    {
        // Arrange
        await AddWaitingQueueEntry(queueId: 1, userId: "create-inprogress-existing@example.com", status: QueueEntryStatus.InProgress);
        var queueEntry = CreateValidQueueEntry(
            queueId: 1,
            userId: "create-inprogress-target@example.com",
            status: QueueEntryStatus.InProgress,
            priority: PriorityLevel.Low);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateQueueEntry(queueEntry));
    }

    [Fact]
    public async Task CreateQueueEntry_WithTrimmedUserId_ReturnsNormalizedUserId()
    {
        // Arrange
        var queueEntry = CreateValidQueueEntry(userId: "  test2@example.com  ");

        // Act
        var result = await _service.CreateQueueEntry(queueEntry);

        // Assert
        Assert.Equal("test2@example.com", result.UserId);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task UpdateQueueEntryPosition_WithOutOfRangeQueueEntryId_ThrowsArgumentOutOfRangeException(int id)
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry();
    
        // Assert & Act
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => _service.UpdateQueueEntryPosition(id, 0));
    }

    [Fact]
    public async Task UpdateQueueEntryPosition_WithOutOfRangePosition_ThrowsArgumentOutOfRangeException()
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry();
    
        // Assert & Act
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => _service.UpdateQueueEntryPosition(queueEntry.Id, -1));
    }

    [Fact]
    public async Task UpdateQueueEntryPosition_WhenQueueEntryDoesntExist_ThrowsKeyNotFoundException()
    {
        // Arrange
        int nonExistentId = 999;

       // Assert & Act
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.UpdateQueueEntryPosition(nonExistentId, 0));
    }
    
    [Theory]
    [InlineData(QueueEntryStatus.Cancelled)]
    [InlineData(QueueEntryStatus.Completed)]
    [InlineData(QueueEntryStatus.InProgress)]
    [InlineData(QueueEntryStatus.Pending)]
    [InlineData(QueueEntryStatus.Removed)]
    [InlineData((QueueEntryStatus)999)]
    public async Task UpdateQueueEntryPosition_WhenQueueEntryStatusIsNotWaiting_ThrowsArgumentException(QueueEntryStatus status)
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry(status: status);

        // Assert & Act
        await Assert.ThrowsAsync<ArgumentException>(() => _service.UpdateQueueEntryPosition(queueEntry.Id, 0));
    }

    [Fact]
    public async Task UpdateQueueEntryPosition_WhenPositionIsOutsideWaitingQueueRange_ThrowsArgumentOutOfRangeException()
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry();

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => _service.UpdateQueueEntryPosition(queueEntry.Id, 2));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    public async Task UpdateQueueEntryPosition_WhenEntryIsReordered_UpdatesAllWaitingPositionsCorrectly(int position)
    {
        // Arrange
        var queueEntry1 = await AddWaitingQueueEntry(userId: "test1@example.com");
        var queueEntry2 = await AddWaitingQueueEntry(userId: "test2@example.com");
        var queueEntry3 = await AddWaitingQueueEntry(userId: "test3@example.com");

        var queueEntryReorder = await AddWaitingQueueEntry(userId: "test4@example.com");

        // Act
        await _service.UpdateQueueEntryPosition(queueEntryReorder.Id, position);

        // Assert
        var waitingQueueEntries = await _testDbContext.QueueEntries
            .Where(qe => qe.QueueId == 1 && qe.Status == QueueEntryStatus.Waiting)
            .OrderBy(qe => qe.Position)
            .ToListAsync();

        Assert.Equal(4, waitingQueueEntries.Count);
        Assert.All(waitingQueueEntries, qe => Assert.NotNull(qe.Position));

        var expectedOrder = new List<int> { queueEntry1.Id, queueEntry2.Id, queueEntry3.Id };
        expectedOrder.Insert(position, queueEntryReorder.Id);

        var actualOrder = waitingQueueEntries.Select(qe => qe.Id).ToList();
        Assert.Equal(expectedOrder, actualOrder);

        var actualPositions = waitingQueueEntries.Select(qe => qe.Position).ToList();
        Assert.Equal(new int?[] { 0, 1, 2, 3 }, actualPositions);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task UpdateQueueEntryStatus_WhenQueueEntryIdIsInvalid_ThrowsArgumentOutOfRangeException(int id)
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry();

        // Act
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>_service.UpdateQueueEntryStatus(id, QueueEntryStatus.InProgress));
    }

    [Fact]
    public async Task UpdateQueueEntryStatus_WhenEnumIsInvalid_ThrowsArgumentException()
    {
        var queueEntry = await AddWaitingQueueEntry();

        await Assert.ThrowsAsync<ArgumentException>(() =>_service.UpdateQueueEntryStatus(queueEntry.Id, (QueueEntryStatus)999));
    }

    [Theory]
    [InlineData(2)]
    [InlineData(999)]
    public async Task UpdateQueueEntryStatus_WhenQueueEntryDoesNotExist_ThrowsKeyNotFoundException(int id)
    {
        var queueEntry = await AddWaitingQueueEntry();

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>_service.UpdateQueueEntryStatus(id, QueueEntryStatus.InProgress));
    }

    [Theory]
    [InlineData(QueueEntryStatus.Waiting, QueueEntryStatus.Pending)]
    [InlineData(QueueEntryStatus.Pending, QueueEntryStatus.Completed)]
    public async Task UpdateQueueEntryStatus_WhenQueueIsClosed_ThrowsInvalidOperationException(QueueEntryStatus status, QueueEntryStatus previousStatus)
    {
        var queueEntry = await AddWaitingQueueEntry(queueId: 2, status: previousStatus);
        var queue = await _testDbContext.Queues.FirstAsync(q => q.Id == 2);
        queue.Status = QueueStatus.Closed;
        await _testDbContext.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UpdateQueueEntryStatus(queueEntry.Id, status));
    }

    [Fact]
    public async Task UpdateQueueEntryStatus_WhenStatusChangesAndQueueIsOpen_UpdatesSuccessfully()
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry(queueId: 2, status: QueueEntryStatus.Pending, userId: "statusopen@example.com");

        // Act
        var updatedQueueEntry = await _service.UpdateQueueEntryStatus(queueEntry.Id, QueueEntryStatus.Waiting);

        // Assert
        Assert.Equal(QueueEntryStatus.Waiting, updatedQueueEntry.Status);
        Assert.NotNull(updatedQueueEntry.Position);
    }

    [Fact]
    public async Task UpdateQueueEntryStatus_WhenAnotherEntryInSameQueueIsInProgress_ThrowsInvalidOperationException()
    {
        // Arrange
        await AddWaitingQueueEntry(queueId: 1, userId: "inprogress-existing@example.com", status: QueueEntryStatus.InProgress);
        var queueEntryToPromote = await AddWaitingQueueEntry(queueId: 1, userId: "inprogress-target@example.com", status: QueueEntryStatus.Waiting);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.UpdateQueueEntryStatus(queueEntryToPromote.Id, QueueEntryStatus.InProgress));
    }

    [Fact]
    public async Task UpdateQueueEntryStatus_WhenOtherQueueHasInProgress_AllowsInProgressForCurrentQueue()
    {
        // Arrange
        await AddWaitingQueueEntry(queueId: 1, userId: "inprogress-other-queue@example.com", status: QueueEntryStatus.InProgress);
        var queueEntryToPromote = await AddWaitingQueueEntry(queueId: 2, userId: "inprogress-queue2@example.com", status: QueueEntryStatus.Waiting);

        // Act
        var updatedQueueEntry = await _service.UpdateQueueEntryStatus(queueEntryToPromote.Id, QueueEntryStatus.InProgress);

        // Assert
        Assert.Equal(QueueEntryStatus.InProgress, updatedQueueEntry.Status);
        Assert.Null(updatedQueueEntry.Position);
    }

    [Fact]
    public async Task UpdateQueueEntryStatus_WhenStatusIsUnchanged_DoesNotThrowEvenIfQueueIsClosed()
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry(queueId: 2, status: QueueEntryStatus.Pending, userId: "statussame@example.com");
        var queue = await _testDbContext.Queues.FirstAsync(q => q.Id == 2);
        queue.Status = QueueStatus.Closed;
        await _testDbContext.SaveChangesAsync();

        // Act
        var updatedQueueEntry = await _service.UpdateQueueEntryStatus(queueEntry.Id, QueueEntryStatus.Pending);

        // Assert
        Assert.Equal(QueueEntryStatus.Pending, updatedQueueEntry.Status);
    }

    [Theory]
    [InlineData(QueueEntryStatus.Cancelled)]
    [InlineData(QueueEntryStatus.Completed)]
    [InlineData(QueueEntryStatus.InProgress)]
    [InlineData(QueueEntryStatus.Pending)]
    [InlineData(QueueEntryStatus.Removed)]    
    public async Task UpdateQueueEntryStatus_WhenStatusNotWaiting_PositionIsNull(QueueEntryStatus status)
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry();

        // Act
        var updatedQueueEntry = await _service.UpdateQueueEntryStatus(queueEntry.Id, status);

        // Assert
        Assert.Null(updatedQueueEntry.Position);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task UpdateQueueEntryStatusAndPriority_WhenQueueEntryIdInvalid_ThrowsArgumentOutOfRange(int id)
    {
        var queueEntry = await AddWaitingQueueEntry(status: QueueEntryStatus.Pending);

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => _service.UpdateQueueEntryStatusAndPriority(id, QueueEntryStatus.Waiting, PriorityLevel.Low));
    }

    [Theory]
    [InlineData(QueueEntryStatus.Cancelled)]
    [InlineData(QueueEntryStatus.Completed)]
    [InlineData(QueueEntryStatus.InProgress)]
    [InlineData(QueueEntryStatus.Removed)]
    public async Task UpdateQueueEntryStatusAndPriority_WhenStatusIsNotWaitingOrPending_ThrowsArgumentException(QueueEntryStatus status)
    {
        var queueEntry = await AddWaitingQueueEntry(status: QueueEntryStatus.Pending);

        await Assert.ThrowsAsync<ArgumentException>(() => _service.UpdateQueueEntryStatusAndPriority(queueEntry.Id, status, PriorityLevel.Low));
    }

    [Fact]
    public async Task UpdateQueueEntryStatusAndPriority_WhenPriorityInvalid_ThrowsArgumentException()
    {
        var queueEntry = await AddWaitingQueueEntry(status: QueueEntryStatus.Pending);

        await Assert.ThrowsAsync<ArgumentException>(() => _service.UpdateQueueEntryStatusAndPriority(queueEntry.Id, QueueEntryStatus.Waiting, (PriorityLevel)999));
    }

    [Theory]
    [InlineData(2)]
    [InlineData(999)]
    public async Task UpdateQueueEntryStatusAndPriority_WhenQueueEntryDoesntExist_ThrowsKeyNotFoundException(int id)
    {
        var queueEntry = await AddWaitingQueueEntry(status: QueueEntryStatus.Pending);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.UpdateQueueEntryStatusAndPriority(id, QueueEntryStatus.Waiting, PriorityLevel.Low));
    }

    [Theory]
    [InlineData("     test@example.com  ")]
    [InlineData(" test@example.com")]
    [InlineData("test@example.com ")]
    public async Task UpdateQueueEntryStatusAndPriority_WhenUserIdHasLeadingOrTrailingSpaces_ReturnsNormalizedUserId(string userId)
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry(status: QueueEntryStatus.Pending, userId: userId);

        // Act
        var updatedQueueEntry = await _service.UpdateQueueEntryStatusAndPriority(queueEntry.Id, QueueEntryStatus.Waiting, PriorityLevel.Low);

        // Assert
        Assert.Equal("test@example.com", updatedQueueEntry.UserId);
    }

    [Fact]
    public async Task UpdateQueueEntryStatusAndPriority_WhenUserNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        var queueEntry = new QueueEntry
        {
            QueueId = 1,
            UserId = "random_user_not_found_123@example.com",
            Status = QueueEntryStatus.Pending,
            Priority = PriorityLevel.Low,
        };

        _testDbContext.QueueEntries.Add(queueEntry);
        await _testDbContext.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.UpdateQueueEntryStatusAndPriority(queueEntry.Id, QueueEntryStatus.Waiting, PriorityLevel.Low));
    }

    [Fact]
    public async Task UpdateQueueEntryStatusAndPriority_WhenStatusChangesAndQueueIsOpen_UpdatesSuccessfully()
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry(queueId: 2, status: QueueEntryStatus.Pending, userId: "statuspriorityopen@example.com", priority: PriorityLevel.Low);

        // Act
        var updatedQueueEntry = await _service.UpdateQueueEntryStatusAndPriority(queueEntry.Id, QueueEntryStatus.Waiting, PriorityLevel.High);

        // Assert
        Assert.Equal(QueueEntryStatus.Waiting, updatedQueueEntry.Status);
        Assert.Equal(PriorityLevel.High, updatedQueueEntry.Priority);
        Assert.NotNull(updatedQueueEntry.Position);
    }

    [Fact]
    public async Task UpdateQueueEntryStatusAndPriority_WhenStatusChangesAndQueueIsClosed_ThrowsInvalidOperationException()
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry(queueId: 2, status: QueueEntryStatus.Pending, userId: "statuspriorityclosed@example.com", priority: PriorityLevel.Low);
        var queue = await _testDbContext.Queues.FirstAsync(q => q.Id == 2);
        queue.Status = QueueStatus.Closed;
        await _testDbContext.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.UpdateQueueEntryStatusAndPriority(queueEntry.Id, QueueEntryStatus.Waiting, PriorityLevel.High));
    }

    [Fact]
    public async Task UpdateQueueEntryStatusAndPriority_WhenStatusIsUnchanged_DoesNotThrowEvenIfQueueIsClosed()
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry(queueId: 2, status: QueueEntryStatus.Pending, userId: "statusprioritysame@example.com", priority: PriorityLevel.Low);
        var queue = await _testDbContext.Queues.FirstAsync(q => q.Id == 2);
        queue.Status = QueueStatus.Closed;
        await _testDbContext.SaveChangesAsync();

        // Act
        var updatedQueueEntry = await _service.UpdateQueueEntryStatusAndPriority(queueEntry.Id, QueueEntryStatus.Pending, PriorityLevel.High);

        // Assert
        Assert.Equal(QueueEntryStatus.Pending, updatedQueueEntry.Status);
        Assert.Equal(PriorityLevel.High, updatedQueueEntry.Priority);
        Assert.Null(updatedQueueEntry.Position);
    }

    [Fact]
    public async Task DeleteQueueEntry_WhenValidQueueIdAndUserId_CancelsEntryAndReordersPositions()
    {
        // Arrange
        var entry1 = await AddWaitingQueueEntry(userId: "leave1@example.com");
        var entry2 = await AddWaitingQueueEntry(userId: "leave2@example.com");
        var entry3 = await AddWaitingQueueEntry(userId: "leave3@example.com");

        // Act
        var cancelled = await _service.DeleteQueueEntry(1, "leave2@example.com");

        // Assert
        Assert.True(cancelled);
        var cancelledEntry = await _testDbContext.QueueEntries
            .FirstOrDefaultAsync(qe => qe.QueueId == 1 && qe.UserId == "leave2@example.com");
        Assert.NotNull(cancelledEntry);
        Assert.Equal(QueueEntryStatus.Cancelled, cancelledEntry.Status);
        Assert.Null(cancelledEntry.Position);

        var remainingWaiting = await _testDbContext.QueueEntries
            .Where(qe => qe.QueueId == 1 && qe.Status == QueueEntryStatus.Waiting)
            .OrderBy(qe => qe.Position)
            .ToListAsync();

        Assert.Equal(2, remainingWaiting.Count);
        Assert.Equal(new int?[] { 0, 1 }, remainingWaiting.Select(qe => qe.Position).ToArray());
    }

    [Fact]
    public async Task DeleteQueueEntry_WhenEntryDoesNotExist_ThrowsKeyNotFoundException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.DeleteQueueEntry(1, "missing-user@example.com"));
    }

    [Fact]
    public async Task EstimateWaitTime_WhenUserIsWaiting_ReturnsCalculatedWaitTime()
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry(queueId: 1, userId: "etw1@example.com", status: QueueEntryStatus.Waiting, priority: PriorityLevel.Low);

        // Act
        var estimated = await _service.EstimateWaitTime(1, "etw1@example.com");

        // Assert
        Assert.Equal(queueEntry.Position ?? -1, estimated.Position);
        Assert.Equal(15 * (queueEntry.Position ?? 0), estimated.EstimatedWaitTimeMinutes);
        Assert.Equal(15, estimated.ServiceDurationMinutes);
        Assert.Equal("etw1@example.com", estimated.UserId);
        Assert.Equal(1, estimated.QueueId);
    }

    [Fact]
    public async Task EstimateWaitTime_WhenQueueHasInProgressEntry_IncludesRemainingInProgressTime()
    {
        // Arrange
        const int queueId = 1;
        const string waitingUserId = "etw-inprogress-waiting@example.com";
        const string inProgressUserId = "etw-inprogress-current@example.com";

        _testDbContext.UserProfiles.Add(new UserProfile { Email = waitingUserId, Name = "Waiting User" });
        _testDbContext.UserProfiles.Add(new UserProfile { Email = inProgressUserId, Name = "Current User" });

        var inProgressEntry = new QueueEntry
        {
            QueueId = queueId,
            UserId = inProgressUserId,
            Status = QueueEntryStatus.InProgress,
            Priority = PriorityLevel.Low,
            JoinTime = DateTime.UtcNow.AddMinutes(-5)
        };

        _testDbContext.QueueEntries.Add(inProgressEntry);
        await _testDbContext.SaveChangesAsync();

        var waitingEntry = await AddWaitingQueueEntry(
            queueId: queueId,
            userId: waitingUserId,
            status: QueueEntryStatus.Waiting,
            priority: PriorityLevel.Low);

        // Act
        var estimated = await _service.EstimateWaitTime(queueId, waitingUserId);

        // Assert
        Assert.Equal(waitingEntry.Position ?? -1, estimated.Position);
        Assert.InRange(estimated.EstimatedWaitTimeMinutes, 10, 11);
        Assert.Contains("Current patient has been in progress for", estimated.Message);
        Assert.Equal(15, estimated.ServiceDurationMinutes);
    }

    [Fact]
    public async Task EstimateWaitTime_WhenQueueEntryNotFound_ThrowsKeyNotFoundException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.EstimateWaitTime(1, "no-such-user@example.com"));
    }

    [Fact]
    public async Task UpdateQueueEntryStatus_WhenStatusIsCancelled_AllowsEvenIfQueueIsClosed()
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry(queueId: 2, status: QueueEntryStatus.Waiting, userId: "cancel-closed@example.com");
        var queue = await _testDbContext.Queues.FirstAsync(q => q.Id == 2);
        queue.Status = QueueStatus.Closed;
        await _testDbContext.SaveChangesAsync();

        // Act - Should not throw even though queue is closed
        var updatedEntry = await _service.UpdateQueueEntryStatus(queueEntry.Id, QueueEntryStatus.Cancelled);

        // Assert
        Assert.Equal(QueueEntryStatus.Cancelled, updatedEntry.Status);
        Assert.Null(updatedEntry.Position);
    }

    [Fact]
    public async Task UpdateQueueEntryStatus_WhenStatusIsRemoved_AllowsEvenIfQueueIsClosed()
    {
        // Arrange
        var queueEntry = await AddWaitingQueueEntry(queueId: 2, status: QueueEntryStatus.Waiting, userId: "remove-closed@example.com");
        var queue = await _testDbContext.Queues.FirstAsync(q => q.Id == 2);
        queue.Status = QueueStatus.Closed;
        await _testDbContext.SaveChangesAsync();

        // Act - Should not throw even though queue is closed
        var updatedEntry = await _service.UpdateQueueEntryStatus(queueEntry.Id, QueueEntryStatus.Removed);

        // Assert
        Assert.Equal(QueueEntryStatus.Removed, updatedEntry.Status);
        Assert.Null(updatedEntry.Position);
    }

    public void Dispose()
    {
        _testDbContext.Database.EnsureDeleted();
        _testDbContext.Dispose();
    }
}