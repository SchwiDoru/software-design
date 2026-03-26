using Backend.Constants;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Your Old DbSets (Keep these as is)
    public DbSet<Service> Services { get; set; }
    public DbSet<Queue> Queues { get; set; }
    public DbSet<UserProfile> UserProfiles { get; set; }
    public DbSet<QueueEntry> QueueEntries { get; set; }

    // --- NEW STUFF ADDED HERE ---
    public DbSet<History> Histories { get; set; }
    public DbSet<HistoryDetail> HistoryDetails { get; set; }
    public DbSet<Prescription> Prescriptions { get; set; }
    public DbSet<NotificationHistory> NotificationHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --- OLD SHIFT (UNTOUCHED) ---
        // Keeping your original QueueEntry logic exactly how you had it
        modelBuilder.Entity<QueueEntry>()
            .HasIndex(queueEntry => queueEntry.UserId)
            .IsUnique()
            .HasDatabaseName("one_active_queue_per_user")
            .HasFilter($"[{nameof(QueueEntry.Status)}] IN ({(int)QueueEntryStatus.Pending}, {(int)QueueEntryStatus.Waiting}, {(int)QueueEntryStatus.InProgress})");

        // --- NEW STUFF CONFIGURATION ONLY ---
        
        // 1. History (Linked to your existing QueueEntry)
        modelBuilder.Entity<History>(entity =>
        {
            entity.HasKey(h => h.HistoryID);
            entity.HasOne(h => h.QueueEntry)
                .WithOne()
                .HasForeignKey<History>(h => h.QueueEntryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 2. HistoryDetail (Items within a History record)
        modelBuilder.Entity<HistoryDetail>(entity =>
        {
            entity.HasKey(hd => hd.Id);
            entity.HasOne(hd => hd.History)
                .WithMany(h => h.HistoryDetails)
                .HasForeignKey(hd => hd.HistoryID);
        });

        // 3. Prescription (Linked to History)
        modelBuilder.Entity<Prescription>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.HasOne(p => p.History)
                .WithMany(h => h.Prescriptions)
                .HasForeignKey(p => p.HistoryID);
        });

        // 4. Notification History
        modelBuilder.Entity<NotificationHistory>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.Status).HasConversion<string>();
        });
    }
}