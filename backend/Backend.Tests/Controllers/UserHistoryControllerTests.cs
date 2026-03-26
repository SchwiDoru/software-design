using Backend.Controllers;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace Backend.Tests.Controllers;

public class UserHistoryControllerTests
{
    private readonly Mock<IHistoryService> _historyServiceMock;
    private readonly UserHistoryController _controller;

    public UserHistoryControllerTests()
    {
        _historyServiceMock = new Mock<IHistoryService>();
        _controller = new UserHistoryController(_historyServiceMock.Object);

        // Setup Mock User Claims (to simulate a logged-in user with an email)
        var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
        {
            new(ClaimTypes.Email, "test@gmail.com")
        }, "mock"));

        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = user }
        };
    }

    [Fact]
    public async Task GetMyHistory_ReturnsOkWithUserHistory()
    {
        // Arrange
        var userEmail = "test@gmail.com";
        var mockHistory = new List<History>
        {
            new() { HistoryID = "HIST-1", Date = DateTime.UtcNow, QueueEntryId = 1 },
            new() { HistoryID = "HIST-2", Date = DateTime.UtcNow, QueueEntryId = 2 }
        };

        _historyServiceMock.Setup(service => service.GetPatientHistory(userEmail))
            .ReturnsAsync(mockHistory);

        // Act
        var result = await _controller.GetMyHistory();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<List<History>>(okResult.Value);
        Assert.Equal(2, value.Count);
        Assert.Equal("HIST-1", value[0].HistoryID);
    }

    [Fact]
    public async Task GetMyHistory_WhenServiceThrows_ReturnsBadRequest()
    {
        // Arrange
        _historyServiceMock.Setup(service => service.GetPatientHistory(It.IsAny<string>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.GetMyHistory();

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetMyHistory_WhenEmailMissing_ReturnsBadRequest()
    {
        // Arrange: Clear the user context to simulate missing email claim
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity());

        // Act
        var result = await _controller.GetMyHistory();

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }
}