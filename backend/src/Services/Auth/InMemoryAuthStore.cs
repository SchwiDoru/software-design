using Backend.Constants;
using Backend.Models;

namespace Backend.Services.Auth;

public class InMemoryAuthStore : IAuthStore
{
    private readonly object _sync = new();
    private readonly Dictionary<string, AuthUserRecord> _usersByEmail = new(StringComparer.OrdinalIgnoreCase);
    private int _nextId = 1;

    public InMemoryAuthStore()
    {
        SeedUser(
            name: "Admin User",
            email: "admin@queuesmart.local",
            passwordHash: "3b612c75a7b5048a435fb6ec81e52ff92d6d795a8b5a9c17070f6a63c97a53b2",
            role: UserRole.Admin);

        SeedUser(
            name: "Staff User",
            email: "staff@queuesmart.local",
            passwordHash: "2f005e42a17da46ec51ba6f11d725e60788931a1dadd33d9cb85084fb32bb166",
            role: UserRole.Staff);
    }

    public Task<AuthUserRecord?> GetByEmail(string email)
    {
        var normalizedEmail = NormalizeEmail(email);

        lock (_sync)
        {
            _usersByEmail.TryGetValue(normalizedEmail, out var record);
            return Task.FromResult(record);
        }
    }

    public Task<bool> EmailExists(string email)
    {
        var normalizedEmail = NormalizeEmail(email);

        lock (_sync)
        {
            return Task.FromResult(_usersByEmail.ContainsKey(normalizedEmail));
        }
    }

    public Task<AuthUserRecord> CreatePatient(string name, string email, string passwordHash, string? phone)
    {
        var normalizedEmail = NormalizeEmail(email);

        lock (_sync)
        {
            if (_usersByEmail.ContainsKey(normalizedEmail))
            {
                throw new InvalidOperationException("Email already exists.");
            }

            var record = new AuthUserRecord
            {
                Credentials = new UserCredentials
                {
                    Id = _nextId++,
                    Email = normalizedEmail,
                    PasswordHash = passwordHash,
                    Role = UserRole.Patient
                },
                Profile = new UserProfile
                {
                    Name = name,
                    Email = normalizedEmail,
                    PhoneNumber = phone
                }
            };

            _usersByEmail[normalizedEmail] = record;
            return Task.FromResult(record);
        }
    }

    private void SeedUser(string name, string email, string passwordHash, UserRole role)
    {
        var normalizedEmail = NormalizeEmail(email);
        _usersByEmail[normalizedEmail] = new AuthUserRecord
        {
            Credentials = new UserCredentials
            {
                Id = _nextId++,
                Email = normalizedEmail,
                PasswordHash = passwordHash,
                Role = role
            },
            Profile = new UserProfile
            {
                Name = name,
                Email = normalizedEmail,
                PhoneNumber = null
            }
        };
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}
