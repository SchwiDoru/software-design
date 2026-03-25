namespace Backend.DTO;

// For the "Patient Directory" list (Image 6da5e1)
public record StaffHistorySummaryDto(
    string HistoryId,
    string PatientFullName,
    string LastInteractionDate,
    string ServiceType // e.g., "General Consultation"
);

// For the "Clinical Records" detailed view (Image 6da601)
public record StaffHistoryDetailDto(
    string HistoryId,
    string Date,
    string ServiceType,
    string Diagnosis,
    string Assessment,
    List<PrescriptionDto> Prescriptions // Your Prescription table data
);