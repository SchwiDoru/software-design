using Backend.Constants;
using Backend.Controllers;
using Backend.DTO;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Backend.Tests.Controllers;

public class QueueControllerTests
{
    private readonly Mock<IQueueService> _queueServiceMock;
    private readonly QueueController _controller;

    public QueueControllerTests()
    {
        _queueServiceMock = new Mock<IQueueService>();
        _controller = new QueueController(_queueServiceMock.Object);
    }

    [Fact]
    public async Task GetQueueByIdController_WhenMissing_ReturnsNotFound()
    {
        _queueServiceMock.Setup(service => service.GetQueueById(999)).ReturnsAsync((Queue?)null);

        var result = await _controller.GetQueueByIdController(999);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetQueueByIdController_WhenServiceThrows_ReturnsBadRequest()
    {
        _queueServiceMock.Setup(service => service.GetQueueById(1)).ThrowsAsync(new Exception("boom"));

        var result = await _controller.GetQueueByIdController(1);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetQueuesController_WhenEmpty_ReturnsNoContent()
    {
        _queueServiceMock.Setup(service => service.GetQueues()).ReturnsAsync(new List<Queue>());

        var result = await _controller.GetQueuesController();

        Assert.IsType<NoContentResult>(result.Result);
    }

    [Fact]
    public async Task GetQueuesController_WhenServiceThrows_RethrowsException()
    {
        _queueServiceMock.Setup(service => service.GetQueues()).ThrowsAsync(new Exception("boom"));

        await Assert.ThrowsAsync<Exception>(() => _controller.GetQueuesController());
    }

    [Fact]
    public async Task CreateQueueController_ReturnsCreatedAtAction()
    {
        var dto = new CreateQueueDTO { ServiceId = 1, Status = QueueStatus.Open };
        var createdQueue = new Queue { ServiceId = 1, Status = QueueStatus.Open, Date = DateTime.UtcNow };

        _queueServiceMock
            .Setup(service => service.CreateQueue(It.IsAny<Queue>()))
            .ReturnsAsync(createdQueue);

        var result = await _controller.CreateQueueController(dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(QueueController.GetQueueByIdController), createdResult.ActionName);
        Assert.Equal(createdQueue, createdResult.Value);

        _queueServiceMock.Verify(service => service.CreateQueue(It.Is<Queue>(queue =>
            queue.ServiceId == dto.ServiceId &&
            queue.Status == dto.Status)), Times.Once);
    }

    [Fact]
    public async Task CreateQueueController_WhenServiceThrows_ReturnsBadRequest()
    {
        var dto = new CreateQueueDTO { ServiceId = 1, Status = QueueStatus.Open };
        _queueServiceMock.Setup(service => service.CreateQueue(It.IsAny<Queue>())).ThrowsAsync(new Exception("boom"));

        var result = await _controller.CreateQueueController(dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueStatusController_WhenQueueMissing_ReturnsNotFound()
    {
        _queueServiceMock
            .Setup(service => service.UpdateQueueStatus(10, QueueStatus.Closed))
            .ThrowsAsync(new KeyNotFoundException("Queue not found"));

        var dto = new UpdateQueueStatusDTO { Status = QueueStatus.Closed };

        var result = await _controller.UpdateQueueStatusController(10, dto);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueStatusController_WithValidData_ReturnsOk()
    {
        var queue = new Queue { ServiceId = 1, Status = QueueStatus.Closed, Date = DateTime.UtcNow };

        _queueServiceMock
            .Setup(service => service.UpdateQueueStatus(1, QueueStatus.Closed))
            .ReturnsAsync(queue);

        var dto = new UpdateQueueStatusDTO { Status = QueueStatus.Closed };

        var result = await _controller.UpdateQueueStatusController(1, dto);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(queue, okResult.Value);
    }

    [Fact]
    public async Task UpdateQueueStatusController_WhenArgumentNull_ReturnsBadRequest()
    {
        _queueServiceMock
            .Setup(service => service.UpdateQueueStatus(1, QueueStatus.Closed))
            .ThrowsAsync(new ArgumentNullException("status"));

        var dto = new UpdateQueueStatusDTO { Status = QueueStatus.Closed };

        var result = await _controller.UpdateQueueStatusController(1, dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueStatusController_WhenOutOfRange_ReturnsBadRequest()
    {
        _queueServiceMock
            .Setup(service => service.UpdateQueueStatus(1, QueueStatus.Closed))
            .ThrowsAsync(new ArgumentOutOfRangeException("id"));

        var dto = new UpdateQueueStatusDTO { Status = QueueStatus.Closed };

        var result = await _controller.UpdateQueueStatusController(1, dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueStatusController_WhenArgumentException_ReturnsBadRequest()
    {
        _queueServiceMock
            .Setup(service => service.UpdateQueueStatus(1, QueueStatus.Closed))
            .ThrowsAsync(new ArgumentException("invalid"));

        var dto = new UpdateQueueStatusDTO { Status = QueueStatus.Closed };

        var result = await _controller.UpdateQueueStatusController(1, dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueStatusController_WhenUnexpectedException_ReturnsInternalServerError()
    {
        _queueServiceMock
            .Setup(service => service.UpdateQueueStatus(1, QueueStatus.Closed))
            .ThrowsAsync(new Exception("boom"));

        var dto = new UpdateQueueStatusDTO { Status = QueueStatus.Closed };

        var result = await _controller.UpdateQueueStatusController(1, dto);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, objectResult.StatusCode);
    }
}
