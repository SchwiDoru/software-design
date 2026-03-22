using Backend.Constants;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Backend.Tests.Data;
using Microsoft.EntityFrameworkCore;

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
        var queue = await _service.GetQueueById(1);

        Assert.NotNull(queue);
        Assert.Equal(1, queue.Id);
        Assert.NotNull(queue.Service);
    }

    [Theory]
    [InlineData(999)]
    [InlineData(-1)]
    public async Task GetQueueById_WhenQueueDoesNotExist_ReturnsNull(int id)
    {
        var queue = await _service.GetQueueById(id);

        Assert.Null(queue);
    }

    [Fact]
    public async Task GetQueues_ReturnsSeededQueues()
    {
        var queues = await _service.GetQueues();

        Assert.NotNull(queues);
        Assert.True(queues.Count >= 3);
        Assert.All(queues, queue => Assert.NotNull(queue.Service));
    }

    [Fact]
    public async Task CreateQueue_WithNullQueue_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() => _service.CreateQueue(null!));
    }

    [Fact]
    public async Task CreateQueue_WithInvalidStatus_ThrowsArgumentException()
    {
        var queue = CreateValidQueue(status: (QueueStatus)999);

        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateQueue(queue));
    }

    [Fact]
    public async Task CreateQueue_WhenServiceDoesNotExist_ThrowsExceptionWithInnerKeyNotFound()
    {
        var queue = CreateValidQueue(serviceId: 999);

        var exception = await Assert.ThrowsAsync<Exception>(() => _service.CreateQueue(queue));

        Assert.NotNull(exception.InnerException);
        Assert.IsType<KeyNotFoundException>(exception.InnerException);
    }

    [Fact]
    public async Task CreateQueue_WithValidData_ReturnsCreatedQueue()
    {
        var queue = CreateValidQueue();

        var createdQueue = await _service.CreateQueue(queue);

        Assert.NotNull(createdQueue);
        Assert.True(createdQueue.Id > 0);
        Assert.Equal(1, createdQueue.ServiceId);
        Assert.Equal(QueueStatus.Open, createdQueue.Status);
        Assert.NotNull(createdQueue.Service);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task UpdateQueueStatus_WithInvalidId_ThrowsArgumentOutOfRangeException(int id)
    {
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
            _service.UpdateQueueStatus(id, QueueStatus.Closed));
    }

    [Fact]
    public async Task UpdateQueueStatus_WithInvalidStatus_ThrowsArgumentException()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.UpdateQueueStatus(1, (QueueStatus)999));
    }

    [Theory]
    [InlineData(999)]
    [InlineData(4)]
    public async Task UpdateQueueStatus_WhenQueueDoesNotExist_ThrowsKeyNotFoundException(int id)
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.UpdateQueueStatus(id, QueueStatus.Closed));
    }

    [Fact]
    public async Task UpdateQueueStatus_WithValidData_UpdatesQueueStatus()
    {
        var updatedQueue = await _service.UpdateQueueStatus(1, QueueStatus.Closed);

        Assert.Equal(1, updatedQueue.Id);
        Assert.Equal(QueueStatus.Closed, updatedQueue.Status);

        var queueInDb = await _testDbContext.Queues.FirstAsync(queue => queue.Id == 1);
        Assert.Equal(QueueStatus.Closed, queueInDb.Status);
    }

    public void Dispose()
    {
        _testDbContext.Database.EnsureDeleted();
        _testDbContext.Dispose();
    }
}
