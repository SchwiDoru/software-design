using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/notifications")]
public class NotificationController : ControllerBase
{
    [HttpGet]
    public IActionResult GetNotifications() => Ok();

    [HttpPatch("{id}/viewed")]
    public IActionResult MarkAsViewed(string id) => Ok();
}