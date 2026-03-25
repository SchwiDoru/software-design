using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/my-history")]
public class UserHistoryController : ControllerBase
{
    [HttpGet]
    public IActionResult GetMyHistory() => Ok("User's unique history here");
}