using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Models;

public class HistoryDetail
{
    [Key]
    public int Id { get; set; }
    public string HistoryID { get; set; } = string.Empty; // FK and PK

    public string Diagnosis { get; set; } = string.Empty; // VARCHAR(100)
    public string ServiceType { get; set; } = string.Empty; // VARCHAR(100)
    public string Assessment { get; set; } = string.Empty; // VARCHAR(1000)
    public string Label { get; set; } = string.Empty; // VARCHAR(100)

    [ForeignKey(nameof(HistoryID))]
    public virtual History History { get; set; } = null!;
}