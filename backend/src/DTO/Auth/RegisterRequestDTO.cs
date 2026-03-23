namespace Backend.DTO.Auth;

public class RegisterRequestDTO
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? ConfirmPassword { get; set; }
    public string? Phone { get; set; }
}
