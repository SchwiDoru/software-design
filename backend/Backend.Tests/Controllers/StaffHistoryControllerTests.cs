using Backend.Controllers;
using Backend.DTO;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Backend.Tests.Controllers;

public class StaffHistoryControllerTests
{
    private readonly Mock<IHistoryService> _historyServiceMock;
    private readonly StaffHistoryController _controller;

    public StaffHistoryControllerTests()
    {
        _historyServiceMock = new Mock<IHistoryService>();
        _controller = new StaffHistoryController(_historyServiceMock.Object);
    }

    [Fact]
    public async Task CompleteVisit_WithValidData_ReturnsOk()
    {
        var request = new HistoryCompletionRequestDTO
        {
            HistoryDetails = [new HistoryDetailInputDTO { ServiceType = "X-Ray" }],
            Prescriptions = [new PrescriptionInputDTO { PrescriptionName = "Ibuprofen" }]
        };

        _historyServiceMock
            .Setup(service => service.CompleteVisit(
                12,
                It.Is<List<HistoryDetail>>(details => details.Count == 1 && details[0].ServiceType == "X-Ray"),
                It.Is<List<Prescription>>(prescriptions => prescriptions.Count == 1 && prescriptions[0].PrescriptionName == "Ibuprofen")))
            .ReturnsAsync(new History { HistoryId = "QS-20260326-ABC123", QueueEntryId = 12, Date = DateTime.UtcNow });

        var result = await _controller.CompleteVisit(12, request);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var history = Assert.IsType<History>(okResult.Value);
        Assert.Equal(12, history.QueueEntryId);
    }

    [Fact]
    public async Task CompleteVisit_WhenQueueEntryMissing_ReturnsNotFound()
    {
        _historyServiceMock
            .Setup(service => service.CompleteVisit(It.IsAny<int>(), It.IsAny<List<HistoryDetail>>(), It.IsAny<List<Prescription>>()))
            .ThrowsAsync(new KeyNotFoundException("missing"));

        var result = await _controller.CompleteVisit(99, new HistoryCompletionRequestDTO());

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task CompleteVisit_WhenVisitAlreadyCompleted_ReturnsConflict()
    {
        _historyServiceMock
            .Setup(service => service.CompleteVisit(It.IsAny<int>(), It.IsAny<List<HistoryDetail>>(), It.IsAny<List<Prescription>>()))
            .ThrowsAsync(new InvalidOperationException("already completed"));

        var result = await _controller.CompleteVisit(99, new HistoryCompletionRequestDTO());

        Assert.IsType<ConflictObjectResult>(result.Result);
    }
}
