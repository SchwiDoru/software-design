using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class History
{
    [Key]
    public string HistoryID { get; set; } = string.Empty; // VARCHAR(45)
    public DateTime Date { get; set; }

    // This links to your team's QueueEntry
    public int QueueEntryId { get; set; }
    
    [ForeignKey(nameof(QueueEntryId))]
    public virtual QueueEntry QueueEntry { get; set; } = null!;

    // YOUR TABLES: 1-to-many with Details, 1-to-Many with Prescriptions
    public virtual ICollection<HistoryDetail> HistoryDetails { get; set; } = new List<HistoryDetail>();
    public virtual ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}