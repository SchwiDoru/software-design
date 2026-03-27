using Backend.Constants;

namespace Backend.DTO.Auth;

public class AuthResponseDTO
{
    public required string Message { get; set; }
    public required AuthUserDTO User { get; set; }
}

public class AuthUserDTO
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public UserRole Role { get; set; }
    public string? Phone { get; set; }
}
