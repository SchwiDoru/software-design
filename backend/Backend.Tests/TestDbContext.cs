using Backend.Constants;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Tests.Data;

public static class TestDbContextFactory
{
    public static AppDbContext CreateWithSeedData()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var context = new AppDbContext(options);

        // 1. Add Service and SAVE to get the generated ID
        var service = new Service { Name = "Clinic", Duration = 15, Priority = PriorityLevel.Low };
        context.Services.Add(service);
        context.SaveChanges(); 

        // 2. Add specific Queues for your tests (Fixes ID 1 and ID 3 errors)
        context.Queues.AddRange(
            new Queue { Id = 1, ServiceId = service.Id, Status = QueueStatus.Open, Date = DateTime.UtcNow },
            new Queue { Id = 3, ServiceId = service.Id, Status = QueueStatus.Closed, Date = DateTime.UtcNow }
        );
        context.SaveChanges();

        // 3. Add User and a Linked QueueEntry
        var user = new UserProfile { Email = "test@student.com", Name = "Test User" };
        context.UserProfiles.Add(user);

        context.QueueEntries.Add(new QueueEntry 
        { 
            Id = 1,
            UserId = user.Email, 
            Status = QueueEntryStatus.InProgress,
            QueueId = 1, 
            QueueServiceId = service.Id // Matches Composite Key relationship
        });

        context.SaveChanges();
        return context;
    }
}