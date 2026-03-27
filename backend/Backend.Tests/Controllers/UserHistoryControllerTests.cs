using Backend.Controllers;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;

namespace Backend.Tests.Controllers;

public class UserHistoryControllerTests
{
    private readonly Mock<IHistoryService> _historyServiceMock;
    private readonly UserHistoryController _controller;

    public UserHistoryControllerTests()
    {
        _historyServiceMock = new Mock<IHistoryService>();
        _controller = new UserHistoryController(_historyServiceMock.Object);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [Fact]
    public async Task GetMyHistory_WithClaimEmail_ReturnsOk()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.Email, "test@gmail.com")],
            "mock"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        _historyServiceMock
            .Setup(service => service.GetPatientHistory("test@gmail.com"))
            .ReturnsAsync([new History { HistoryId = "QS-1", QueueEntryId = 1, Date = DateTime.UtcNow }]);

        var result = await _controller.GetMyHistory();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var histories = Assert.IsType<List<History>>(okResult.Value);
        Assert.Single(histories);
    }

    [Fact]
    public async Task GetMyHistory_WithQueryEmailFallback_ReturnsOk()
    {
        _historyServiceMock
            .Setup(service => service.GetPatientHistory("fallback@example.com"))
            .ReturnsAsync([new History { HistoryId = "QS-2", QueueEntryId = 2, Date = DateTime.UtcNow }]);

        var result = await _controller.GetMyHistory("fallback@example.com");

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetMyHistory_WhenNoHistory_ReturnsNoContent()
    {
        _historyServiceMock
            .Setup(service => service.GetPatientHistory("empty@example.com"))
            .ReturnsAsync([]);

        var result = await _controller.GetMyHistory("empty@example.com");

        Assert.IsType<NoContentResult>(result.Result);
    }

    [Fact]
    public async Task GetMyHistory_WhenEmailMissing_ReturnsBadRequest()
    {
        var result = await _controller.GetMyHistory();

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetMyHistory_WhenServiceThrows_ReturnsInternalServerError()
    {
        _historyServiceMock
            .Setup(service => service.GetPatientHistory(It.IsAny<string>()))
            .ThrowsAsync(new Exception("boom"));

        var result = await _controller.GetMyHistory("broken@example.com");

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, objectResult.StatusCode);
    }
}
