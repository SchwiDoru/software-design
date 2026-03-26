using Backend.Constants;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Tests.Data;
public static class TestDbContextFactory
{
    public static AppDbContext CreateWithSeedData(string? databaseName = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString())
            .Options;
        var context = new AppDbContext(options);

        // Seed data as needed
        context.Services.Add(new Service {Name = "Testing Service", Duration = 15, Priority = PriorityLevel.Low});

        context.Queues.Add(new Queue { Status = QueueStatus.Open, Date = DateTime.UtcNow, ServiceId = 1 });
        context.Queues.Add(new Queue { Status = QueueStatus.Open, Date = DateTime.UtcNow, ServiceId = 1 });
        context.Queues.Add(new Queue { Status = QueueStatus.Closed, Date = DateTime.UtcNow, ServiceId = 1 });


        context.UserProfiles.Add(new UserProfile { Email = "test@example.com", Name = "Test User" });
        context.UserProfiles.Add(new UserProfile { Email = "test2@example.com", Name = "Test User 2" });

        context.SaveChanges();

        return context;
    }
}
