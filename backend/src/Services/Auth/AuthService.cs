using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using Backend.Constants;
using Backend.DTO.Auth;

namespace Backend.Services.Auth;

public class AuthService : IAuthService
{
    private static readonly EmailAddressAttribute EmailValidator = new();
    private readonly IAuthStore _authStore;

    public AuthService(IAuthStore authStore)
    {
        _authStore = authStore;
    }

    public async Task<AuthResponseDTO> Register(RegisterRequestDTO request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var name = request.Name?.Trim() ?? string.Empty;
        var email = NormalizeEmail(request.Email);
        var password = request.Password ?? string.Empty;
        var confirmPassword = request.ConfirmPassword ?? string.Empty;
        var phone = NormalizePhone(request.Phone);

        ValidateRegistrationRequest(name, email, password, confirmPassword, phone);

        if (await _authStore.EmailExists(email))
        {
            throw new InvalidOperationException("Email already exists.");
        }

        var record = await _authStore.CreatePatient(
            name: name,
            email: email,
            passwordHash: HashPassword(password),
            phone: phone);

        return CreateAuthResponse("Registration successful", record);
    }

    public async Task<AuthResponseDTO> Login(LoginRequestDTO request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var email = NormalizeEmail(request.Email);
        var password = request.Password ?? string.Empty;

        ValidateLoginRequest(email, password);

        var record = await _authStore.GetByEmail(email);
        if (record == null || record.Credentials.PasswordHash != HashPassword(password))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        return CreateAuthResponse("Login successful", record);
    }

    private static AuthResponseDTO CreateAuthResponse(string message, AuthUserRecord record)
    {
        return new AuthResponseDTO
        {
            Message = message,
            User = new AuthUserDTO
            {
                Id = record.Credentials.Id,
                Name = record.Profile.Name,
                Email = record.Credentials.Email,
                Role = record.Credentials.Role,
                Phone = record.Profile.PhoneNumber
            }
        };
    }

    private static void ValidateRegistrationRequest(
        string name,
        string email,
        string password,
        string confirmPassword,
        string? phone)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(name))
        {
            errors.Add("Name is required.");
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            errors.Add("Email is required.");
        }
        else if (!EmailValidator.IsValid(email))
        {
            errors.Add("Email format is invalid.");
        }

        if (string.IsNullOrWhiteSpace(password))
        {
            errors.Add("Password is required.");
        }
        else
        {
            if (password.Length < 8)
            {
                errors.Add("Password must be at least 8 characters long.");
            }

            if (!password.Any(char.IsLetter) || !password.Any(char.IsDigit))
            {
                errors.Add("Password must contain at least one letter and one number.");
            }
        }

        if (string.IsNullOrWhiteSpace(confirmPassword))
        {
            errors.Add("Confirm password is required.");
        }
        else if (password != confirmPassword)
        {
            errors.Add("Password and confirm password do not match.");
        }

        if (!string.IsNullOrWhiteSpace(phone))
        {
            var digitCount = phone.Count(char.IsDigit);
            if (digitCount < 10 || digitCount > 15)
            {
                errors.Add("Phone number must contain between 10 and 15 digits.");
            }
        }

        if (errors.Count > 0)
        {
            throw new ArgumentException(string.Join(" ", errors));
        }
    }

    private static void ValidateLoginRequest(string email, string password)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(email))
        {
            errors.Add("Email is required.");
        }
        else if (!EmailValidator.IsValid(email))
        {
            errors.Add("Email format is invalid.");
        }

        if (string.IsNullOrWhiteSpace(password))
        {
            errors.Add("Password is required.");
        }

        if (errors.Count > 0)
        {
            throw new ArgumentException(string.Join(" ", errors));
        }
    }

    private static string NormalizeEmail(string? email)
    {
        return email?.Trim().ToLowerInvariant() ?? string.Empty;
    }

    private static string? NormalizePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return null;
        }

        return phone.Trim();
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}
