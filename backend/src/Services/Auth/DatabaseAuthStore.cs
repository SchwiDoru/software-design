using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Auth;

public class DatabaseAuthStore : IAuthStore
{
    private readonly AppDbContext _dbContext;

    public DatabaseAuthStore(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AuthUserRecord?> GetByEmail(string email)
    {
        var normalizedEmail = NormalizeEmail(email);
        var credentials = await _dbContext.UserCredentials
            .Include(userCredentials => userCredentials.Profile)
            .FirstOrDefaultAsync(userCredentials => userCredentials.Email == normalizedEmail);

        if (credentials?.Profile == null)
        {
            return null;
        }

        return new AuthUserRecord
        {
            Credentials = credentials,
            Profile = credentials.Profile
        };
    }

    public async Task<bool> EmailExists(string email)
    {
        var normalizedEmail = NormalizeEmail(email);

        return await _dbContext.UserCredentials.AnyAsync(userCredentials => userCredentials.Email == normalizedEmail)
            || await _dbContext.UserProfiles.AnyAsync(profile => profile.Email == normalizedEmail);
    }

    public async Task<AuthUserRecord> CreatePatient(string name, string email, string passwordHash, string? phone)
    {
        var normalizedEmail = NormalizeEmail(email);

        if (await EmailExists(normalizedEmail))
        {
            throw new InvalidOperationException("Email already exists.");
        }

        var profile = new UserProfile
        {
            Name = name,
            Email = normalizedEmail,
            PhoneNumber = phone
        };

        var credentials = new UserCredentials
        {
            Email = normalizedEmail,
            PasswordHash = passwordHash,
            Role = Constants.UserRole.Patient,
            Profile = profile
        };

        _dbContext.UserProfiles.Add(profile);
        _dbContext.UserCredentials.Add(credentials);
        await _dbContext.SaveChangesAsync();

        return new AuthUserRecord
        {
            Credentials = credentials,
            Profile = profile
        };
    }

    public async Task UpdatePasswordHash(UserCredentials credentials, string passwordHash)
    {
        credentials.PasswordHash = passwordHash;
        await _dbContext.SaveChangesAsync();
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}
