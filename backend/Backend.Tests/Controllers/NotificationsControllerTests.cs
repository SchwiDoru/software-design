using Backend.Constants;
using Backend.Controllers;
using Backend.DTO;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Backend.Tests.Controllers;

public class NotificationsControllerTests
{
    private readonly Mock<INotificationService> _notificationServiceMock;
    private readonly NotificationsController _controller;

    public NotificationsControllerTests()
    {
        _notificationServiceMock = new Mock<INotificationService>();
        _controller = new NotificationsController(_notificationServiceMock.Object);
    }

    [Fact]
    public async Task GetNotifications_WhenNoneFound_ReturnsNoContent()
    {
        _notificationServiceMock
            .Setup(service => service.GetNotifications(UserRole.Patient, "test@example.com", null))
            .ReturnsAsync([]);

        var result = await _controller.GetNotifications(UserRole.Patient, "test@example.com", null);

        Assert.IsType<NoContentResult>(result.Result);
    }

    [Fact]
    public async Task GetNotifications_WhenFound_ReturnsOk()
    {
        var notifications = new List<NotificationDTO>
        {
            new NotificationDTO
            {
                Id = 1,
                Type = NotificationType.QueueApproved,
                Audience = NotificationAudience.Patient,
                Title = "Approved",
                Message = "Approved message",
                CreatedAt = DateTime.UtcNow
            }
        };

        _notificationServiceMock
            .Setup(service => service.GetNotifications(UserRole.Patient, "test@example.com", null))
            .ReturnsAsync(notifications);

        var result = await _controller.GetNotifications(UserRole.Patient, "test@example.com", null);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(notifications, okResult.Value);
    public async Task GetNotifications_WhenNotificationsExist_ReturnsOk()
    {
        _notificationServiceMock
            .Setup(service => service.GetNotifications(UserRole.Patient, "test@example.com", null))
            .ReturnsAsync([
                new NotificationDTO
                {
                    Id = 1,
                    Type = NotificationType.QueueApproved,
                    Audience = NotificationAudience.Patient,
                    Title = "Approved",
                    Message = "Ready",
                    CreatedAt = DateTime.UtcNow
                }
            ]);

        var result = await _controller.GetNotifications(UserRole.Patient, "test@example.com", null);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var notifications = Assert.IsType<List<NotificationDTO>>(okResult.Value);
        Assert.Single(notifications);
    }

    [Fact]
    public async Task GetNotifications_WhenEmpty_ReturnsNoContent()
    {
        _notificationServiceMock
            .Setup(service => service.GetNotifications(UserRole.Staff, null, null))
            .ReturnsAsync([]);

        var result = await _controller.GetNotifications(UserRole.Staff, null, null);

        Assert.IsType<NoContentResult>(result.Result);
    }

    [Fact]
    public async Task GetNotifications_WhenServiceThrows_ReturnsInternalServerError()
    {
        _notificationServiceMock
            .Setup(service => service.GetNotifications(It.IsAny<UserRole>(), It.IsAny<string?>(), It.IsAny<DateTime?>()))
            .ThrowsAsync(new Exception("boom"));

        var result = await _controller.GetNotifications(UserRole.Admin, null, null);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, objectResult.StatusCode);
    }
}
