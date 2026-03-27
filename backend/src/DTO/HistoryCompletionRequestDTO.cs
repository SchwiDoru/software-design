namespace Backend.DTO;

public class HistoryCompletionRequestDTO
{
    public List<HistoryDetailInputDTO> HistoryDetails { get; set; } = [];
    public List<PrescriptionInputDTO> Prescriptions { get; set; } = [];
}

public class HistoryDetailInputDTO
{
    public string Diagnosis { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;
    public string Assessment { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
}

public class PrescriptionInputDTO
{
    public string PrescriptionName { get; set; } = string.Empty;
    public int Amt { get; set; }
    public string DailyUsage { get; set; } = string.Empty;
}
