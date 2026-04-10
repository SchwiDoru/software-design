using Backend.Constants;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Auth;

public static class AuthSeedData
{
    private sealed record SeedUser(string Name, string Email, string Password, UserRole Role, string? Phone = null);

    private static readonly SeedUser[] DefaultUsers =
    [
        new("Admin User", "admin@queuesmart.local", "Admin123", UserRole.Admin),
        new("Staff User", "staff@queuesmart.local", "Staff123", UserRole.Staff),
        new("Darren", "darrenfr83@gmail.com", "Staff123", UserRole.Admin)
    ];

    public static async Task EnsureSeedUsersAsync(
        AppDbContext dbContext,
        IPasswordHasher<UserCredentials> passwordHasher)
    {
        foreach (var user in DefaultUsers)
        {
            var normalizedEmail = NormalizeEmail(user.Email);

            var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(existingProfile => existingProfile.Email == normalizedEmail);
            if (profile == null)
            {
                profile = new UserProfile
                {
                    Name = user.Name,
                    Email = normalizedEmail,
                    PhoneNumber = user.Phone
                };
                dbContext.UserProfiles.Add(profile);
            }
            else
            {
                profile.Name = user.Name;
                profile.PhoneNumber = user.Phone;
            }

            var credentials = await dbContext.UserCredentials.FirstOrDefaultAsync(existingCredentials => existingCredentials.Email == normalizedEmail);
            if (credentials == null)
            {
                credentials = new UserCredentials
                {
                    Email = normalizedEmail,
                    PasswordHash = string.Empty,
                    Role = user.Role,
                    Profile = profile
                };
                credentials.PasswordHash = passwordHasher.HashPassword(credentials, user.Password);
                dbContext.UserCredentials.Add(credentials);
                continue;
            }

            credentials.Role = user.Role;

            var verifyResult = passwordHasher.VerifyHashedPassword(credentials, credentials.PasswordHash, user.Password);
            if (verifyResult != PasswordVerificationResult.Success)
            {
                credentials.PasswordHash = passwordHasher.HashPassword(credentials, user.Password);
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}
