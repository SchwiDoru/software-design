using Backend.Constants;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Backend.Tests.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests.Services;

public class QueueServiceTests : IDisposable
{
    private readonly AppDbContext _testDbContext;
    private readonly QueueService _service;

    public QueueServiceTests()
    {
        _testDbContext = TestDbContextFactory.CreateWithSeedData();
        _service = new QueueService(_testDbContext);
    }

    private static Queue CreateValidQueue(int serviceId = 1, QueueStatus status = QueueStatus.Open)
    {
        return new Queue
        {
            ServiceId = serviceId,
            Status = status,
            Date = DateTime.UtcNow,
        };
    }

    [Fact]
    public async Task GetQueueById_WhenQueueExists_ReturnsQueueWithService()
    {
        // FIX: Added serviceId (1) to match IQueueService signature
        var queue = await _service.GetQueueById(1, 1);

        Assert.NotNull(queue);
        Assert.Equal(1, queue.Id);
        Assert.NotNull(queue.Service);
    }

    [Theory]
    [InlineData(999, 1)]
    [InlineData(-1, 1)]
    public async Task GetQueueById_WhenQueueDoesNotExist_ReturnsNull(int id, int serviceId)
    {
        // FIX: Added serviceId to parameters
        var queue = await _service.GetQueueById(id, serviceId);

        Assert.Null(queue);
    }

    [Fact]
    public async Task GetQueues_ReturnsSeededQueues()
    {
        var queues = await _service.GetQueues();

        Assert.NotNull(queues);
        Assert.True(queues.Count >= 1); // Adjusted based on factory seeding
        Assert.All(queues, queue => Assert.NotNull(queue.Service));
    }

    [Fact]
    public async Task CreateQueue_WithNullQueue_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() => _service.CreateQueue(null!));
    }

    [Fact]
    public async Task CreateQueue_WhenServiceDoesNotExist_ThrowsKeyNotFoundException()
    {
        var queue = CreateValidQueue(serviceId: 999);

        // Your Service throws KeyNotFoundException directly now
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.CreateQueue(queue));
    }

[Fact]
public async Task CreateQueue_WithValidData_ReturnsCreatedQueue()
{
    // ... Arrange ...
    var queue = new Queue { ServiceId = 1, Status = QueueStatus.Open };

    // Act
    var result = await _service.CreateQueue(queue);

    // Assert
    Assert.NotNull(result);
    Assert.Equal(1, result.ServiceId);
    Assert.Equal(QueueStatus.Open, result.Status);
}

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-1, 1)]
    public async Task UpdateQueueStatus_WithInvalidId_ThrowsArgumentOutOfRangeException(int id, int serviceId)
    {
        // FIX: Added serviceId (1)
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
            _service.UpdateQueueStatus(id, serviceId, QueueStatus.Closed));
    }

    [Theory]
    [InlineData(999, 1)]
    [InlineData(4, 1)]
    public async Task UpdateQueueStatus_WhenQueueDoesNotExist_ThrowsKeyNotFoundException(int id, int serviceId)
    {
        // FIX: Added serviceId (1)
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.UpdateQueueStatus(id, serviceId, QueueStatus.Closed));
    }

    [Fact]
    public async Task UpdateQueueStatus_WithValidData_UpdatesQueueStatus()
    {
        // FIX: Passing id (1) and serviceId (1)
        var updatedQueue = await _service.UpdateQueueStatus(1, 1, QueueStatus.Closed);

        Assert.Equal(1, updatedQueue.Id);
        Assert.Equal(QueueStatus.Closed, updatedQueue.Status);

        // Assert directly against DB using composite key
        var queueInDb = await _testDbContext.Queues
            .FirstAsync(q => q.Id == 1 && q.ServiceId == 1); 
        Assert.Equal(QueueStatus.Closed, queueInDb.Status);
    }

    public void Dispose()
    {
        _testDbContext.Database.EnsureDeleted();
        _testDbContext.Dispose();
    }
}