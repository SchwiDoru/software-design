using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models;

public class Prescription
{
    [Key]
    public int Id { get; set; }
    public string HistoryId { get; set; } = string.Empty;
    public string PrescriptionName { get; set; } = string.Empty;
    public int Amt { get; set; }
    public string DailyUsage { get; set; } = string.Empty;

    [ForeignKey(nameof(HistoryId))]
    [JsonIgnore]
    public History History { get; set; } = null!;
}
