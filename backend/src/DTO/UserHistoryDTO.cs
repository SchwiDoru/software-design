namespace Backend.DTO;

// For the User: Simple view of their own medical record
public record UserHistorySummaryDto(
    string Date,
    string ServiceType,
    string QueueReference,
    string Status
);
public record UserHistoryDetailDto(
    string Date,
    string QueueReference, // e.g., "QS-2025-1024-99"
    string ServiceType,
    string Assessment,
    string Diagnosis,
    String Label,
    List<PrescriptionDto> Prescriptions
);