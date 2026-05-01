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
    public DbSet<UserCredentials> UserCredentials { get; set; }
    public DbSet<QueueEntry> QueueEntries {get; set;}
    public DbSet<NotificationEvent> NotificationEvents {get; set;}
    public DbSet<History> Histories { get; set; }
    public DbSet<HistoryDetail> HistoryDetails { get; set; }
    public DbSet<Prescription> Prescriptions { get; set; }
    public DbSet<AiModeSetting> AiModeSettings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

      modelBuilder.Entity<QueueEntry>()
        .HasIndex(queueEntry => queueEntry.UserId)
        .IsUnique()
        .HasDatabaseName("one_active_queue_per_user")
        .HasFilter($"\"{nameof(QueueEntry.Status)}\" IN ({(int)QueueEntryStatus.Pending}, {(int)QueueEntryStatus.Waiting}, {(int)QueueEntryStatus.InProgress})");

        modelBuilder.Entity<NotificationEvent>()
            .HasIndex(notification => new { notification.Audience, notification.UserId, notification.CreatedAt });

        modelBuilder.Entity<UserCredentials>()
            .HasIndex(credentials => credentials.Email)
            .IsUnique();

        modelBuilder.Entity<UserCredentials>()
            .HasOne(credentials => credentials.Profile)
            .WithOne(profile => profile.Credentials)
            .HasForeignKey<UserCredentials>(credentials => credentials.Email)
            .HasPrincipalKey<UserProfile>(profile => profile.Email)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<History>()
            .HasIndex(history => history.QueueEntryId)
            .IsUnique();

        modelBuilder.Entity<History>()
            .HasOne(history => history.QueueEntry)
            .WithMany()
            .HasForeignKey(history => history.QueueEntryId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HistoryDetail>()
            .HasOne(detail => detail.History)
            .WithMany(history => history.HistoryDetails)
            .HasForeignKey(detail => detail.HistoryId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Prescription>()
            .HasOne(prescription => prescription.History)
            .WithMany(history => history.Prescriptions)
            .HasForeignKey(prescription => prescription.HistoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
