using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models;

public class HistoryDetail
{
    [Key]
    public int Id { get; set; }
    public string HistoryId { get; set; } = string.Empty;
    public string Diagnosis { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;
    public string Assessment { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;

    [ForeignKey(nameof(HistoryId))]
    [JsonIgnore]
    public History History { get; set; } = null!;
}
