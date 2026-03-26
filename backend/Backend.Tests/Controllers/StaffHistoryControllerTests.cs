using Backend.Controllers;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

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
    public async Task CompleteVisit_WithValidData_ReturnsOkWithHistory()
    {
        // Arrange
        int qId = 123;
        var details = new List<HistoryDetail> { new() { ServiceType = "X-Ray" } };
        var meds = new List<Prescription> { new() { PrescriptionName = "Ibuprofen" } };
        
        // Match your History model: HistoryID is a string
        var expectedHistory = new History 
        { 
            HistoryID = "HIST-001", 
            QueueEntryId = qId,
            Date = DateTime.UtcNow 
        };

        _historyServiceMock.Setup(s => s.CompleteVisit(qId, details, meds))
            .ReturnsAsync(expectedHistory);

        // Act
        var result = await _controller.CompleteVisit(qId, new HistoryCompletionRequest(details, meds));

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<History>(okResult.Value);
        Assert.Equal("HIST-001", value.HistoryID);
        Assert.Equal(qId, value.QueueEntryId);
    }

    [Fact]
    public async Task CompleteVisit_WhenServiceThrows_ReturnsBadRequest()
    {
        // Arrange
        _historyServiceMock.Setup(s => s.CompleteVisit(It.IsAny<int>(), It.IsAny<List<HistoryDetail>>(), It.IsAny<List<Prescription>>()))
            .ThrowsAsync(new Exception("Queue entry not found or already completed"));

        // Act
        var result = await _controller.CompleteVisit(999, new HistoryCompletionRequest(new(), new()));

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }
}