using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public class History
{
    [Key]
    public string HistoryId { get; set; } = string.Empty;
    public DateTime Date { get; set; }

    public int QueueEntryId { get; set; }

    [ForeignKey(nameof(QueueEntryId))]
    public QueueEntry QueueEntry { get; set; } = null!;

    public ICollection<HistoryDetail> HistoryDetails { get; set; } = new List<HistoryDetail>();
    public ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}
