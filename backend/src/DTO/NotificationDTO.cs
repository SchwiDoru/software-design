namespace Backend.DTO;

public record NotificationResponseDto(
    string Id,
    string Message,
    string TimeStamp,
    string Status
);