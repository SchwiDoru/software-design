using Backend.Constants;
using Backend.Controllers;
using Backend.DTO.Auth;
using Backend.Services.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;

namespace Backend.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _authServiceMock;
    private readonly Mock<IAuthenticationService> _authenticationServiceMock;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _authServiceMock = new Mock<IAuthService>();
        _authenticationServiceMock = new Mock<IAuthenticationService>();
        _controller = new AuthController(_authServiceMock.Object);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = CreateHttpContext()
        };
    }

    private DefaultHttpContext CreateHttpContext(ClaimsPrincipal? user = null)
    {
        var services = new ServiceCollection();
        services.AddSingleton(_authenticationServiceMock.Object);

        return new DefaultHttpContext
        {
            User = user ?? new ClaimsPrincipal(new ClaimsIdentity()),
            RequestServices = services.BuildServiceProvider()
        };
    }

    private static AuthResponseDTO CreateAuthResponse(UserRole role = UserRole.Patient) => new()
    {
        Message = "Success",
        User = new AuthUserDTO
        {
            Id = 1,
            Name = "Test User",
            Email = "test@example.com",
            Role = role,
            Phone = "555-0100"
        }
    };

    [Fact]
    public async Task Register_WithValidData_ReturnsOk()
    {
        var request = new RegisterRequestDTO
        {
            Name = "Test User",
            Email = "test@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!"
        };
        var response = CreateAuthResponse();

        _authServiceMock.Setup(service => service.Register(request)).ReturnsAsync(response);

        var result = await _controller.Register(request);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(response, okResult.Value);
        _authenticationServiceMock.Verify(service => service.SignInAsync(
            It.IsAny<HttpContext>(),
            CookieAuthenticationDefaults.AuthenticationScheme,
            It.IsAny<ClaimsPrincipal>(),
            It.IsAny<AuthenticationProperties>()), Times.Once);
    }

    [Fact]
    public async Task Register_WhenDuplicateEmail_ReturnsConflict()
    {
        var request = new RegisterRequestDTO { Email = "test@example.com" };
        _authServiceMock.Setup(service => service.Register(request))
            .ThrowsAsync(new InvalidOperationException("duplicate"));

        var result = await _controller.Register(request);

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task LoginPatient_WithPatientAccount_ReturnsOk()
    {
        var request = new LoginRequestDTO { Email = "patient@example.com", Password = "Password123!" };
        var response = CreateAuthResponse(UserRole.Patient);
        _authServiceMock.Setup(service => service.Login(request)).ReturnsAsync(response);

        var result = await _controller.LoginPatient(request);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(response, okResult.Value);
    }

    [Fact]
    public async Task LoginPatient_WithStaffAccount_ReturnsForbidden()
    {
        var request = new LoginRequestDTO { Email = "staff@example.com", Password = "Password123!" };
        _authServiceMock.Setup(service => service.Login(request)).ReturnsAsync(CreateAuthResponse(UserRole.Staff));

        var result = await _controller.LoginPatient(request);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        _authenticationServiceMock.Verify(service => service.SignOutAsync(
            It.IsAny<HttpContext>(),
            CookieAuthenticationDefaults.AuthenticationScheme,
            It.IsAny<AuthenticationProperties>()), Times.Once);
    }

    [Fact]
    public async Task LoginStaff_WithStaffAccount_ReturnsOk()
    {
        var request = new LoginRequestDTO { Email = "staff@example.com", Password = "Password123!" };
        var response = CreateAuthResponse(UserRole.Staff);
        _authServiceMock.Setup(service => service.Login(request)).ReturnsAsync(response);

        var result = await _controller.LoginStaff(request);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(response, okResult.Value);
    }

    [Fact]
    public async Task Me_WhenUserHasNoEmailClaim_ReturnsUnauthorized()
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = CreateHttpContext()
        };

        var result = await _controller.Me();

        Assert.IsType<UnauthorizedObjectResult>(result.Result);
    }

    [Fact]
    public async Task Me_WhenUserExists_ReturnsOk()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.Email, "test@example.com")],
            "mock"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = CreateHttpContext(user)
        };

        _authServiceMock.Setup(service => service.GetUserByEmail("test@example.com"))
            .ReturnsAsync(CreateAuthResponse().User);

        var result = await _controller.Me();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.IsType<AuthResponseDTO>(okResult.Value);
    }

    [Fact]
    public async Task Logout_ReturnsOk()
    {
        var result = await _controller.Logout();

        Assert.IsType<OkObjectResult>(result);
        _authenticationServiceMock.Verify(service => service.SignOutAsync(
            It.IsAny<HttpContext>(),
            CookieAuthenticationDefaults.AuthenticationScheme,
            It.IsAny<AuthenticationProperties>()), Times.Once);
    }
}
