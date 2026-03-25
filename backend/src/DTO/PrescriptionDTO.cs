namespace Backend.DTO;

public record PrescriptionDto(
    string Name, 
    string Dosage, 
    string Instructions
);