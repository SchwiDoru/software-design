using Backend.Constants;

namespace Backend.Models;

public class UserCredentials
{
    public int Id { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public UserRole Role { get; set; }
}
