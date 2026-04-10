using Backend.Models;

namespace Backend.Services.Auth;

public sealed class AuthUserRecord
{
    public required UserCredentials Credentials { get; init; }
    public required UserProfile Profile { get; init; }
}

public interface IAuthStore
{
    Task<AuthUserRecord?> GetByEmail(string email);
    Task<bool> EmailExists(string email);
    Task<AuthUserRecord> CreatePatient(string name, string email, string passwordHash, string? phone);
    Task UpdatePasswordHash(UserCredentials credentials, string passwordHash);
}
