using Backend.Constants;
using Backend.Controllers;
using Backend.DTO;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit; // Added missing xUnit reference

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
        // FIX: Added serviceId (1) to match composite key logic
        _queueServiceMock.Setup(service => service.GetQueueById(999, 1)).ReturnsAsync((Queue?)null);

        var result = await _controller.GetQueueByIdController(999, 1);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetQueueByIdController_WhenServiceThrows_ReturnsBadRequest()
    {
        // FIX: Added serviceId (1)
        _queueServiceMock.Setup(service => service.GetQueueById(1, 1)).ThrowsAsync(new Exception("boom"));

        var result = await _controller.GetQueueByIdController(1, 1);

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
    public async Task CreateQueueController_ReturnsCreatedAtAction()
    {
        var dto = new CreateQueueDTO { ServiceId = 1, Status = QueueStatus.Open };
        // FIX: ServiceId must be set for the return object
        var createdQueue = new Queue { Id = 1, ServiceId = 1, Status = QueueStatus.Open, Date = DateTime.UtcNow };

        _queueServiceMock
            .Setup(service => service.CreateQueue(It.IsAny<Queue>()))
            .ReturnsAsync(createdQueue);

        var result = await _controller.CreateQueueController(dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(QueueController.GetQueueByIdController), createdResult.ActionName);
        
        // FIX: Must check for both parts of the composite key in the route values
        Assert.Equal(1, createdResult.RouteValues?["id"]);
        Assert.Equal(1, createdResult.RouteValues?["serviceId"]);
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
        // FIX: Passing (id: 10, serviceId: 1)
        _queueServiceMock
            .Setup(service => service.UpdateQueueStatus(10, 1, QueueStatus.Closed))
            .ThrowsAsync(new KeyNotFoundException("Queue not found"));

        var dto = new UpdateQueueStatusDTO { Status = QueueStatus.Closed };

        var result = await _controller.UpdateQueueStatusController(10, 1, dto);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueStatusController_WithValidData_ReturnsOk()
    {
        // FIX: Ensure mock return object has full composite key
        var queue = new Queue { Id = 1, ServiceId = 1, Status = QueueStatus.Closed, Date = DateTime.UtcNow };

        _queueServiceMock
            .Setup(service => service.UpdateQueueStatus(1, 1, QueueStatus.Closed))
            .ReturnsAsync(queue);

        var dto = new UpdateQueueStatusDTO { Status = QueueStatus.Closed };

        var result = await _controller.UpdateQueueStatusController(1, 1, dto);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(queue, okResult.Value);
    }

    // ... Keeping your existing Exception tests exactly as they were, just added serviceId: 1

[Fact]
public async Task GetQueuesController_WhenServiceThrows_ReturnsInternalServerError()
{
    // Arrange
    _queueServiceMock.Setup(s => s.GetQueues()).ThrowsAsync(new Exception("boom"));

    // Act
    var result = await _controller.GetQueuesController();

    // Assert
    var objectResult = Assert.IsType<ObjectResult>(result.Result);
    Assert.Equal(500, objectResult.StatusCode);
}
}