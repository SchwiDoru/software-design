using Backend.DTO.Auth;
using Backend.Services.Auth;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDTO>> Register([FromBody] RegisterRequestDTO request)
    {
        try
        {
            var response = await _authService.Register(request);
            return Ok(response);
        }
        catch (InvalidOperationException err)
        {
            return Conflict(new { error = err.Message });
        }
        catch (ArgumentNullException err)
        {
            return BadRequest(new { error = err.Message });
        }
        catch (ArgumentException err)
        {
            return BadRequest(new { error = err.Message });
        }
        catch (Exception err)
        {
            Console.WriteLine($"Error in AuthController.Register: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error registering user." });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDTO>> Login([FromBody] LoginRequestDTO request)
    {
        try
        {
            var response = await _authService.Login(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException err)
        {
            return Unauthorized(new { error = err.Message });
        }
        catch (ArgumentNullException err)
        {
            return BadRequest(new { error = err.Message });
        }
        catch (ArgumentException err)
        {
            return BadRequest(new { error = err.Message });
        }
        catch (Exception err)
        {
            Console.WriteLine($"Error in AuthController.Login: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error logging in." });
        }
    }
}