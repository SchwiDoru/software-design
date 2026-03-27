using Backend.DTO.Auth;
using Backend.Services.Auth;
using Backend.Constants;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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
            await SignInUserAsync(response.User);
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

    [HttpPost("login/patient")]
    public Task<ActionResult<AuthResponseDTO>> LoginPatient([FromBody] LoginRequestDTO request)
    {
        return LoginForPortal(request, new[] { UserRole.Patient }, "Staff and admin accounts should use the staff portal.");
    }

    [HttpPost("login/staff")]
    public Task<ActionResult<AuthResponseDTO>> LoginStaff([FromBody] LoginRequestDTO request)
    {
        return LoginForPortal(request, new[] { UserRole.Admin, UserRole.Staff }, "Only staff and admin accounts can use the staff portal.");
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthResponseDTO>> Me()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email))
        {
            return Unauthorized(new { error = "No active session." });
        }

        var user = await _authService.GetUserByEmail(email);
        if (user == null)
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Unauthorized(new { error = "Session user could not be found." });
        }

        return Ok(new AuthResponseDTO
        {
            Message = "Authenticated session found.",
            User = user
        });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Ok(new { message = "Logged out successfully." });
    }

    private async Task<ActionResult<AuthResponseDTO>> LoginForPortal(
        LoginRequestDTO request,
        IReadOnlyCollection<UserRole> allowedRoles,
        string accessDeniedMessage)
    {
        try
        {
            var response = await _authService.Login(request);

            if (!allowedRoles.Contains(response.User.Role))
            {
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return StatusCode(StatusCodes.Status403Forbidden, new { error = accessDeniedMessage });
            }

            await SignInUserAsync(response.User);
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

    private async Task SignInUserAsync(AuthUserDTO user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        if (!string.IsNullOrWhiteSpace(user.Phone))
        {
            claims.Add(new Claim(ClaimTypes.MobilePhone, user.Phone));
        }

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            new AuthenticationProperties
            {
                IsPersistent = false,
                AllowRefresh = true
            });
    }
}
