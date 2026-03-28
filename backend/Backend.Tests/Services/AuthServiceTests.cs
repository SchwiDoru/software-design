using Backend.Constants;
using Backend.Data;
using Backend.DTO.Auth;
using Backend.Tests.Data;
using Backend.Services.Auth;
using Microsoft.EntityFrameworkCore;

namespace Backend.Tests.Services;

public class AuthServiceTests
{
    private readonly AuthService _authService;
    private readonly AppDbContext _dbContext;

    public AuthServiceTests()
    {
        _dbContext = TestDbContextFactory.CreateWithSeedData(Guid.NewGuid().ToString());
        _authService = new AuthService(new InMemoryAuthStore(), _dbContext);
    }

    private static RegisterRequestDTO CreateValidRegisterRequest(
        string email = "patient@example.com",
        string password = "Password123",
        string? phone = "4695551234")
    {
        return new RegisterRequestDTO
        {
            Name = "Patient User",
            Email = email,
            Password = password,
            ConfirmPassword = password,
            Phone = phone
        };
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsCreatedPatient()
    {
        var response = await _authService.Register(CreateValidRegisterRequest());

        Assert.Equal("Registration successful", response.Message);
        Assert.Equal("Patient User", response.User.Name);
        Assert.Equal("patient@example.com", response.User.Email);
        Assert.Equal(UserRole.Patient, response.User.Role);
        Assert.Equal("4695551234", response.User.Phone);
        Assert.True(await _dbContext.UserProfiles.AnyAsync(profile => profile.Email == "patient@example.com"));
    }

    [Fact]
    public async Task Register_WithoutPhone_Succeeds()
    {
        var response = await _authService.Register(CreateValidRegisterRequest(phone: null));

        Assert.Equal(UserRole.Patient, response.User.Role);
        Assert.Null(response.User.Phone);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ThrowsInvalidOperationException()
    {
        await _authService.Register(CreateValidRegisterRequest(email: "duplicate@example.com"));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _authService.Register(CreateValidRegisterRequest(email: "DUPLICATE@example.com")));
    }

    [Fact]
    public async Task Register_WithPasswordMismatch_ThrowsArgumentException()
    {
        var request = CreateValidRegisterRequest();
        request.ConfirmPassword = "Mismatch123";

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _authService.Register(request));

        Assert.Contains("do not match", exception.Message);
    }

    [Fact]
    public async Task Register_WithInvalidEmail_ThrowsArgumentException()
    {
        var request = CreateValidRegisterRequest(email: "invalid-email");

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _authService.Register(request));

        Assert.Contains("Email format is invalid.", exception.Message);
    }

    [Fact]
    public async Task Register_WithWeakPassword_ThrowsArgumentException()
    {
        var request = CreateValidRegisterRequest(password: "password");

        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _authService.Register(request));

        Assert.Contains("Password must contain at least one letter and one number.", exception.Message);
    }

    [Fact]
    public async Task Login_WithSeededAdminCredentials_ReturnsAdminRole()
    {
        var response = await _authService.Login(new LoginRequestDTO
        {
            Email = "admin@queuesmart.local",
            Password = "Admin123"
        });

        Assert.Equal("Login successful", response.Message);
        Assert.Equal(UserRole.Admin, response.User.Role);
    }

    [Fact]
    public async Task Login_WithSeededStaffCredentials_ReturnsStaffRole()
    {
        var response = await _authService.Login(new LoginRequestDTO
        {
            Email = "staff@queuesmart.local",
            Password = "Staff123"
        });

        Assert.Equal(UserRole.Staff, response.User.Role);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ThrowsUnauthorizedAccessException()
    {
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _authService.Login(new LoginRequestDTO
            {
                Email = "admin@queuesmart.local",
                Password = "WrongPassword123"
            }));

        Assert.Contains("Invalid email or password.", exception.Message);
    }

    [Fact]
    public async Task Login_WithMissingPassword_ThrowsArgumentException()
    {
        var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
            _authService.Login(new LoginRequestDTO
            {
                Email = "admin@queuesmart.local",
                Password = ""
            }));

        Assert.Contains("Password is required.", exception.Message);
    }
}
