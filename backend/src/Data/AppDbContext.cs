using Backend.Constants;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext: DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options): base(options){}

    public DbSet<Service> Services {get; set;}
    public DbSet<Queue> Queues {get; set;}
    public DbSet<UserProfile> UserProfiles {get; set;}
    public DbSet<QueueEntry> QueueEntries {get; set;}
    public DbSet<NotificationEvent> NotificationEvents {get; set;}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<QueueEntry>()
            .HasIndex(queueEntry => queueEntry.UserId)
            .IsUnique()
            .HasDatabaseName("one_active_queue_per_user")
            .HasFilter($"[{nameof(QueueEntry.Status)}] IN ({(int)QueueEntryStatus.Pending}, {(int)QueueEntryStatus.Waiting}, {(int)QueueEntryStatus.InProgress})");

        modelBuilder.Entity<NotificationEvent>()
            .HasIndex(notification => new { notification.Audience, notification.UserId, notification.CreatedAt });
    }
}
