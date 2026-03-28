using Backend.Constants;
using Backend.DTO;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<List<NotificationDTO>>> GetNotifications(
        [FromQuery] UserRole role,
        [FromQuery] string? userId,
        [FromQuery] DateTime? since)
    {
        try
        {
            var notifications = await _notificationService.GetNotifications(role, userId, since);

            if (notifications.Count == 0)
            {
                return NoContent();
            }

            return Ok(notifications);
        }
        catch (Exception err)
        {
            Console.WriteLine($"Error in NotificationsController.GetNotifications: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error getting notifications" });
        }
    }
}
