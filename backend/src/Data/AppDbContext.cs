using Backend.Constants;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Service> Services { get; set; }
    public DbSet<Queue> Queues { get; set; }
    public DbSet<UserProfile> UserProfiles { get; set; }
    public DbSet<QueueEntry> QueueEntries { get; set; }
    public DbSet<History> Histories { get; set; }
    public DbSet<HistoryDetail> HistoryDetails { get; set; }
    public DbSet<Prescription> Prescriptions { get; set; }
    public DbSet<NotificationHistory> NotificationHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --- 1. QUEUE (FIXES THE STARTUP CRASH) ---
        modelBuilder.Entity<Queue>(entity =>
        {
            // Define Composite Primary Key to match the DB Schema
            entity.HasKey(q => new { q.Id, q.ServiceId });

            entity.HasOne(q => q.Service)
                .WithMany()
                .HasForeignKey(q => q.ServiceId);
        });

        // --- 2. QUEUE ENTRY (Matches Composite Key above) ---
        modelBuilder.Entity<QueueEntry>(entity =>
        {
            entity.HasKey(qe => qe.Id);

            // Map the multi-column relationship to Queue
            entity.HasOne(qe => qe.Queue)
                .WithMany()
                .HasForeignKey(qe => new { qe.QueueId, qe.QueueServiceId });

            // Team's unique index logic for active entries
            entity.HasIndex(qe => qe.UserId)
                .IsUnique()
                .HasDatabaseName("one_active_queue_per_user")
                .HasFilter($"[{nameof(QueueEntry.Status)}] IN ({(int)QueueEntryStatus.Pending}, {(int)QueueEntryStatus.Waiting}, {(int)QueueEntryStatus.InProgress})");
        });

        // --- 3. HISTORY (1-to-1 with QueueEntry) ---
        modelBuilder.Entity<History>(entity =>
        {
            entity.HasKey(h => h.HistoryID);

            entity.HasOne(h => h.QueueEntry)
                .WithOne()
                .HasForeignKey<History>(h => h.QueueEntryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // --- 4. HISTORYDETAIL (1-to-Many) ---
        modelBuilder.Entity<HistoryDetail>(entity =>
        {
            entity.HasKey(hd => hd.Id);

            entity.HasOne(hd => hd.History)
                .WithMany(h => h.HistoryDetails)
                .HasForeignKey(hd => hd.HistoryID)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // --- 5. PRESCRIPTION (1-to-Many) ---
        modelBuilder.Entity<Prescription>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.HasOne(p => p.History)
                .WithMany(h => h.Prescriptions)
                .HasForeignKey(p => p.HistoryID)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // --- 6. NOTIFICATION HISTORY ---
        modelBuilder.Entity<NotificationHistory>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.Status).HasConversion<string>();
            
            entity.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserEmail);
        });
    }
}