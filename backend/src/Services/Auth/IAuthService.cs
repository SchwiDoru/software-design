using Backend.DTO.Auth;

namespace Backend.Services.Auth;

public interface IAuthService
{
    Task<AuthResponseDTO> Register(RegisterRequestDTO request);
    Task<AuthResponseDTO> Login(LoginRequestDTO request);
    Task<AuthUserDTO?> GetUserByEmail(string email);
}
