using Backend.Constants;
using Backend.Controllers;
using Backend.DTO;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Backend.Tests.Controllers;

public class QueueEntryControllerTests
{
    private readonly Mock<IQueueEntryServices> _queueEntryServiceMock;
    private readonly QueueEntryController _controller;

    public QueueEntryControllerTests()
    {
        _queueEntryServiceMock = new Mock<IQueueEntryServices>();
        _controller = new QueueEntryController(_queueEntryServiceMock.Object);
    }

    [Fact]
    public async Task GetQueueEntryController_WhenEmpty_ReturnsNoContent()
    {
        _queueEntryServiceMock.Setup(service => service.GetQueueEntries()).ReturnsAsync(new List<QueueEntry>());

        var result = await _controller.GetQueueEntryController();

        Assert.IsType<NoContentResult>(result.Result);
    }

    [Fact]
    public async Task GetQueueEntryController_WhenServiceThrows_RethrowsException()
    {
        _queueEntryServiceMock.Setup(service => service.GetQueueEntries()).ThrowsAsync(new Exception("boom"));

        await Assert.ThrowsAsync<Exception>(() => _controller.GetQueueEntryController());
    }

    [Fact]
    public async Task CreateQueueEntryController_ReturnsCreatedAtAction()
    {
        var dto = new CreateQueueEntryDTO
        {
            QueueId = 1,
            UserId = "test@example.com",
            Description = "description"
        };

        var createdQueueEntry = new QueueEntry
        {
            QueueId = 1,
            UserId = "test@example.com",
            Status = QueueEntryStatus.Pending,
            Priority = PriorityLevel.Low,
            JoinTime = DateTime.UtcNow,
            Position = null,
            Description = "description"
        };

        _queueEntryServiceMock
            .Setup(service => service.CreateQueueEntry(It.IsAny<QueueEntry>()))
            .ReturnsAsync(createdQueueEntry);

        var result = await _controller.CreateQueueEntryController(dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(QueueEntryController.GetQueueEntryController), createdResult.ActionName);
        Assert.Equal(createdQueueEntry, createdResult.Value);

        _queueEntryServiceMock.Verify(service => service.CreateQueueEntry(It.Is<QueueEntry>(entry =>
            entry.QueueId == dto.QueueId &&
            entry.UserId == dto.UserId &&
            entry.Description == dto.Description &&
            entry.Status == QueueEntryStatus.Pending &&
            entry.Priority == PriorityLevel.Low)), Times.Once);
    }

    [Fact]
    public async Task CreateQueueEntryController_WhenKeyNotFound_ReturnsNotFound()
    {
        var dto = new CreateQueueEntryDTO { QueueId = 1, UserId = "test@example.com" };
        _queueEntryServiceMock.Setup(service => service.CreateQueueEntry(It.IsAny<QueueEntry>()))
            .ThrowsAsync(new KeyNotFoundException("missing"));

        var result = await _controller.CreateQueueEntryController(dto);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateQueueEntryController_WhenArgumentNull_ReturnsBadRequest()
    {
        var dto = new CreateQueueEntryDTO { QueueId = 1, UserId = "test@example.com" };
        _queueEntryServiceMock.Setup(service => service.CreateQueueEntry(It.IsAny<QueueEntry>()))
            .ThrowsAsync(new ArgumentNullException("queueEntry"));

        var result = await _controller.CreateQueueEntryController(dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateQueueEntryController_WhenOutOfRange_ReturnsBadRequest()
    {
        var dto = new CreateQueueEntryDTO { QueueId = 1, UserId = "test@example.com" };
        _queueEntryServiceMock.Setup(service => service.CreateQueueEntry(It.IsAny<QueueEntry>()))
            .ThrowsAsync(new ArgumentOutOfRangeException("queueId"));

        var result = await _controller.CreateQueueEntryController(dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateQueueEntryController_WhenArgumentException_ReturnsBadRequest()
    {
        var dto = new CreateQueueEntryDTO { QueueId = 1, UserId = "test@example.com" };
        _queueEntryServiceMock.Setup(service => service.CreateQueueEntry(It.IsAny<QueueEntry>()))
            .ThrowsAsync(new ArgumentException("invalid"));

        var result = await _controller.CreateQueueEntryController(dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateQueueEntryController_WhenInvalidOperation_ReturnsConflict()
    {
        var dto = new CreateQueueEntryDTO { QueueId = 1, UserId = "test@example.com" };
        _queueEntryServiceMock.Setup(service => service.CreateQueueEntry(It.IsAny<QueueEntry>()))
            .ThrowsAsync(new InvalidOperationException("closed"));

        var result = await _controller.CreateQueueEntryController(dto);

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateQueueEntryController_WhenUnexpectedException_ReturnsInternalServerError()
    {
        var dto = new CreateQueueEntryDTO { QueueId = 1, UserId = "test@example.com" };
        _queueEntryServiceMock.Setup(service => service.CreateQueueEntry(It.IsAny<QueueEntry>()))
            .ThrowsAsync(new Exception("boom"));

        var result = await _controller.CreateQueueEntryController(dto);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, objectResult.StatusCode);
    }

    [Fact]
    public async Task UpdateQueueEntryController_WithValidData_ReturnsOk()
    {
        var dto = new UpdateQueueEntryDTO
        {
            Status = QueueEntryStatus.Waiting,
            Priority = PriorityLevel.High
        };

        var updatedQueueEntry = new QueueEntry
        {
            QueueId = 1,
            UserId = "test@example.com",
            Status = QueueEntryStatus.Waiting,
            Priority = PriorityLevel.High,
            JoinTime = DateTime.UtcNow,
            Position = 0
        };

        _queueEntryServiceMock
            .Setup(service => service.UpdateQueueEntryStatusAndPriority(1, dto.Status, dto.Priority))
            .ReturnsAsync(updatedQueueEntry);

        var result = await _controller.UpdateQueueEntryController(1, dto);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(updatedQueueEntry, okResult.Value);
    }

    [Fact]
    public async Task UpdateQueueEntryController_WhenKeyNotFound_ReturnsNotFound()
    {
        var dto = new UpdateQueueEntryDTO { Status = QueueEntryStatus.Waiting, Priority = PriorityLevel.High };
        _queueEntryServiceMock.Setup(service => service.UpdateQueueEntryStatusAndPriority(1, dto.Status, dto.Priority))
            .ThrowsAsync(new KeyNotFoundException("missing"));

        var result = await _controller.UpdateQueueEntryController(1, dto);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueEntryController_WhenArgumentNull_ReturnsBadRequest()
    {
        var dto = new UpdateQueueEntryDTO { Status = QueueEntryStatus.Waiting, Priority = PriorityLevel.High };
        _queueEntryServiceMock.Setup(service => service.UpdateQueueEntryStatusAndPriority(1, dto.Status, dto.Priority))
            .ThrowsAsync(new ArgumentNullException("entry"));

        var result = await _controller.UpdateQueueEntryController(1, dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueEntryController_WhenOutOfRange_ReturnsBadRequest()
    {
        var dto = new UpdateQueueEntryDTO { Status = QueueEntryStatus.Waiting, Priority = PriorityLevel.High };
        _queueEntryServiceMock.Setup(service => service.UpdateQueueEntryStatusAndPriority(1, dto.Status, dto.Priority))
            .ThrowsAsync(new ArgumentOutOfRangeException("id"));

        var result = await _controller.UpdateQueueEntryController(1, dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueEntryController_WhenArgumentException_ReturnsBadRequest()
    {
        var dto = new UpdateQueueEntryDTO { Status = QueueEntryStatus.Waiting, Priority = PriorityLevel.High };
        _queueEntryServiceMock.Setup(service => service.UpdateQueueEntryStatusAndPriority(1, dto.Status, dto.Priority))
            .ThrowsAsync(new ArgumentException("invalid"));

        var result = await _controller.UpdateQueueEntryController(1, dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueEntryController_WhenInvalidOperation_ReturnsConflict()
    {
        var dto = new UpdateQueueEntryDTO { Status = QueueEntryStatus.Waiting, Priority = PriorityLevel.High };
        _queueEntryServiceMock.Setup(service => service.UpdateQueueEntryStatusAndPriority(1, dto.Status, dto.Priority))
            .ThrowsAsync(new InvalidOperationException("closed"));

        var result = await _controller.UpdateQueueEntryController(1, dto);

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueEntryController_WhenUnexpectedException_ReturnsInternalServerError()
    {
        var dto = new UpdateQueueEntryDTO { Status = QueueEntryStatus.Waiting, Priority = PriorityLevel.High };
        _queueEntryServiceMock.Setup(service => service.UpdateQueueEntryStatusAndPriority(1, dto.Status, dto.Priority))
            .ThrowsAsync(new Exception("boom"));

        var result = await _controller.UpdateQueueEntryController(1, dto);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, objectResult.StatusCode);
    }

    [Fact]
    public async Task UpdateQueueEntryStatusController_WhenQueueClosed_ReturnsConflict()
    {
        var dto = new UpdateQueueEntryStatusDTO { Status = QueueEntryStatus.Waiting };

        _queueEntryServiceMock
            .Setup(service => service.UpdateQueueEntryStatus(1, dto.Status))
            .ThrowsAsync(new InvalidOperationException("Queue is currently closed"));

        var result = await _controller.UpdateQueueEntryStatusController(1, dto);

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueEntryStatusController_WhenKeyNotFound_ReturnsNotFound()
    {
        var dto = new UpdateQueueEntryStatusDTO { Status = QueueEntryStatus.Waiting };

        _queueEntryServiceMock
            .Setup(service => service.UpdateQueueEntryStatus(1, dto.Status))
            .ThrowsAsync(new KeyNotFoundException("missing"));

        var result = await _controller.UpdateQueueEntryStatusController(1, dto);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueEntryStatusController_WhenArgumentNull_ReturnsBadRequest()
    {
        var dto = new UpdateQueueEntryStatusDTO { Status = QueueEntryStatus.Waiting };

        _queueEntryServiceMock
            .Setup(service => service.UpdateQueueEntryStatus(1, dto.Status))
            .ThrowsAsync(new ArgumentNullException("status"));

        var result = await _controller.UpdateQueueEntryStatusController(1, dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueEntryStatusController_WhenOutOfRange_ReturnsBadRequest()
    {
        var dto = new UpdateQueueEntryStatusDTO { Status = QueueEntryStatus.Waiting };

        _queueEntryServiceMock
            .Setup(service => service.UpdateQueueEntryStatus(1, dto.Status))
            .ThrowsAsync(new ArgumentOutOfRangeException("id"));

        var result = await _controller.UpdateQueueEntryStatusController(1, dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueEntryStatusController_WhenArgumentException_ReturnsBadRequest()
    {
        var dto = new UpdateQueueEntryStatusDTO { Status = QueueEntryStatus.Waiting };

        _queueEntryServiceMock
            .Setup(service => service.UpdateQueueEntryStatus(1, dto.Status))
            .ThrowsAsync(new ArgumentException("invalid"));

        var result = await _controller.UpdateQueueEntryStatusController(1, dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueEntryStatusController_WhenUnexpectedException_ReturnsInternalServerError()
    {
        var dto = new UpdateQueueEntryStatusDTO { Status = QueueEntryStatus.Waiting };

        _queueEntryServiceMock
            .Setup(service => service.UpdateQueueEntryStatus(1, dto.Status))
            .ThrowsAsync(new Exception("boom"));

        var result = await _controller.UpdateQueueEntryStatusController(1, dto);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, objectResult.StatusCode);
    }

    [Fact]
    public async Task UpdateQueueEntryPositionController_WithValidData_ReturnsOk()
    {
        var dto = new UpdateQueueEntryPositionDTO { Position = 0 };

        var updatedQueueEntry = new QueueEntry
        {
            QueueId = 1,
            UserId = "test@example.com",
            Status = QueueEntryStatus.Waiting,
            Priority = PriorityLevel.Low,
            JoinTime = DateTime.UtcNow,
            Position = 0
        };

        _queueEntryServiceMock
            .Setup(service => service.UpdateQueueEntryPosition(1, dto.Position))
            .ReturnsAsync(updatedQueueEntry);

        var result = await _controller.UpdateQueueEntryPositionController(1, dto);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(updatedQueueEntry, okResult.Value);
    }

    [Fact]
    public async Task UpdateQueueEntryPositionController_WhenQueueEntryMissing_ReturnsNotFound()
    {
        var dto = new UpdateQueueEntryPositionDTO { Position = 0 };

        _queueEntryServiceMock
            .Setup(service => service.UpdateQueueEntryPosition(1, dto.Position))
            .ThrowsAsync(new KeyNotFoundException("Queue entry not found"));

        var result = await _controller.UpdateQueueEntryPositionController(1, dto);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueEntryPositionController_WhenArgumentNull_ReturnsBadRequest()
    {
        var dto = new UpdateQueueEntryPositionDTO { Position = 0 };

        _queueEntryServiceMock
            .Setup(service => service.UpdateQueueEntryPosition(1, dto.Position))
            .ThrowsAsync(new ArgumentNullException("position"));

        var result = await _controller.UpdateQueueEntryPositionController(1, dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueEntryPositionController_WhenOutOfRange_ReturnsBadRequest()
    {
        var dto = new UpdateQueueEntryPositionDTO { Position = -1 };

        _queueEntryServiceMock
            .Setup(service => service.UpdateQueueEntryPosition(1, dto.Position))
            .ThrowsAsync(new ArgumentOutOfRangeException("position"));

        var result = await _controller.UpdateQueueEntryPositionController(1, dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueEntryPositionController_WhenArgumentException_ReturnsBadRequest()
    {
        var dto = new UpdateQueueEntryPositionDTO { Position = 0 };

        _queueEntryServiceMock
            .Setup(service => service.UpdateQueueEntryPosition(1, dto.Position))
            .ThrowsAsync(new ArgumentException("Invalid position"));

        var result = await _controller.UpdateQueueEntryPositionController(1, dto);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateQueueEntryPositionController_WhenUnexpectedException_ReturnsInternalServerError()
    {
        var dto = new UpdateQueueEntryPositionDTO { Position = 0 };

        _queueEntryServiceMock
            .Setup(service => service.UpdateQueueEntryPosition(1, dto.Position))
            .ThrowsAsync(new Exception("Unexpected"));

        var result = await _controller.UpdateQueueEntryPositionController(1, dto);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, objectResult.StatusCode);
    }
}
