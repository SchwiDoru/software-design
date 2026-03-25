using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Models;

public class Prescription
{
    [Key]
    public int Id { get; set; } // Auto-increment
    
    public string HistoryID { get; set; } = string.Empty; // FK back to History
    public string PrescriptionName { get; set; } = string.Empty; // VARCHAR(100)
    public int Amt { get; set; }
    public string DailyUsage { get; set; } = string.Empty; // VARCHAR(45)

    [ForeignKey(nameof(HistoryID))]
    public virtual History History { get; set; } = null!;
}