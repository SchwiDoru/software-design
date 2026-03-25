using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/staff/history")]
public class StaffHistoryController : ControllerBase
{
    [HttpGet]
    public IActionResult GetAllHistory() => Ok("All user history for staff here");
}