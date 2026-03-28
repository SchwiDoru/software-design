using System.Text.Json.Serialization;
using Backend.Constants;
using Backend.Models;
using Backend.Services;
using Backend.Services.Auth;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Microsoft.AspNetCore.Authentication.Cookies;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Inject dependencies here
builder.Services.AddSingleton<HealthCheckService>();
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseInMemoryDatabase("in_memory_db");
});
builder.Services.AddScoped<IServiceManager, ServiceManager>();
builder.Services.AddScoped<IQueueService, QueueService>();
builder.Services.AddScoped<IQueueEntryServices, QueueEntryServices>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IHistoryService, HistoryService>();
builder.Services.AddSingleton<IAuthStore, InMemoryAuthStore>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "queuesmart.auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.SlidingExpiration = true;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // our frontend url
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });
var app = builder.Build();

// Seed default users
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (!dbContext.UserProfiles.Any(u => u.Email == "demo.dummy@queuesmart.local"))
    {
        dbContext.UserProfiles.Add(new UserProfile
        {
            Email = "demo.dummy@queuesmart.local",
            Name = "Demo Dummy",
            PhoneNumber = "469-555-0101"
        });
        Console.WriteLine("Default user created: demo.dummy@queuesmart.local");
    }

    if (!dbContext.UserProfiles.Any(u => u.Email == "demo.dummy2@queuesmart.local"))
    {
        dbContext.UserProfiles.Add(new UserProfile
        {
            Email = "demo.dummy2@queuesmart.local",
            Name = "Demo Dummy 2",
            PhoneNumber = "469-555-0102"
        });
        Console.WriteLine("Default user created: demo.dummy2@queuesmart.local");
    }

    var generalConsultation = dbContext.Services.FirstOrDefault(service => service.Name == "General Consultation");
    if (generalConsultation == null)
    {
        generalConsultation = new Service
        {
            Name = "General Consultation",
            Description = "Standard clinic consultation for routine patient visits.",
            Duration = 15,
            Priority = PriorityLevel.Medium
        };
        dbContext.Services.Add(generalConsultation);
        dbContext.SaveChanges();
        Console.WriteLine("Default service created: General Consultation");
    }

    var generalConsultationQueueExists = dbContext.Queues.Any(queue => queue.ServiceId == generalConsultation.Id);
    if (!generalConsultationQueueExists)
    {
        dbContext.Queues.Add(new Queue
        {
            Status = QueueStatus.Open,
            Date = DateTime.UtcNow,
            ServiceId = generalConsultation.Id
        });
        Console.WriteLine("Default queue created: General Consultation");
    }

    dbContext.SaveChanges();

    var defaultQueue = dbContext.Queues
        .Include(queue => queue.Service)
        .First(queue => queue.ServiceId == generalConsultation.Id);

    if (!dbContext.QueueEntries.Any(entry => entry.UserId == "demo.dummy@queuesmart.local" && entry.Status == QueueEntryStatus.Completed))
    {
        var completedEntry = new QueueEntry
        {
            QueueId = defaultQueue.Id,
            UserId = "demo.dummy@queuesmart.local",
            JoinTime = DateTime.UtcNow.AddDays(-14),
            Status = QueueEntryStatus.Completed,
            Priority = PriorityLevel.Medium,
            Position = null,
            Description = "General Consultation"
        };

        dbContext.QueueEntries.Add(completedEntry);
        dbContext.SaveChanges();

        if (!dbContext.Histories.Any(history => history.QueueEntryId == completedEntry.Id))
        {
            dbContext.Histories.Add(new History
            {
                HistoryId = "QS-DEMO-001",
                Date = DateTime.UtcNow.AddDays(-14),
                QueueEntryId = completedEntry.Id,
                HistoryDetails =
                [
                    new HistoryDetail
                    {
                        HistoryId = "QS-DEMO-001",
                        Diagnosis = "Seasonal allergies",
                        ServiceType = "Consultation",
                        Assessment = "Patient reported sinus pressure and sneezing. Symptoms were mild and stable.",
                        Label = "Primary Visit"
                    }
                ],
                Prescriptions =
                [
                    new Prescription
                    {
                        HistoryId = "QS-DEMO-001",
                        PrescriptionName = "Cetirizine 10mg",
                        Amt = 14,
                        DailyUsage = "1 tablet daily"
                    }
                ]
            });
        }
    }

    if (!dbContext.QueueEntries.Any(entry => entry.UserId == "demo.dummy2@queuesmart.local" && entry.Status == QueueEntryStatus.Completed))
    {
        var secondCompletedEntry = new QueueEntry
        {
            QueueId = defaultQueue.Id,
            UserId = "demo.dummy2@queuesmart.local",
            JoinTime = DateTime.UtcNow.AddDays(-7),
            Status = QueueEntryStatus.Completed,
            Priority = PriorityLevel.Low,
            Position = null,
            Description = "General Consultation"
        };

        dbContext.QueueEntries.Add(secondCompletedEntry);
        dbContext.SaveChanges();

        if (!dbContext.Histories.Any(history => history.QueueEntryId == secondCompletedEntry.Id))
        {
            dbContext.Histories.Add(new History
            {
                HistoryId = "QS-DEMO-002",
                Date = DateTime.UtcNow.AddDays(-7),
                QueueEntryId = secondCompletedEntry.Id,
                HistoryDetails =
                [
                    new HistoryDetail
                    {
                        HistoryId = "QS-DEMO-002",
                        Diagnosis = "Routine follow-up",
                        ServiceType = "Consultation",
                        Assessment = "Routine checkup completed with stable vitals and no urgent concerns.",
                        Label = "Follow Up"
                    }
                ],
                Prescriptions = []
            });
        }
    }

    if (!dbContext.NotificationEvents.Any(notification => notification.UserId == "demo.dummy@queuesmart.local"))
    {
        dbContext.NotificationEvents.AddRange(
            new NotificationEvent
            {
                Type = NotificationType.QueueApproved,
                Audience = NotificationAudience.Patient,
                Title = "Queue request approved",
                Message = "Your request for General Consultation was approved.",
                CreatedAt = DateTime.UtcNow.AddHours(-4),
                UserId = "demo.dummy@queuesmart.local",
                QueueId = defaultQueue.Id
            },
            new NotificationEvent
            {
                Type = NotificationType.FirstInLine,
                Audience = NotificationAudience.Patient,
                Title = "You are first in line",
                Message = "Please get ready. You are first in line for General Consultation.",
                CreatedAt = DateTime.UtcNow.AddHours(-3),
                UserId = "demo.dummy@queuesmart.local",
                QueueId = defaultQueue.Id
            });
    }

    dbContext.SaveChanges();
}

var port = Environment.GetEnvironmentVariable("ASPNETCORE_HTTP_PORTS") ?? "8080";
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Application available at: http://localhost:{Port}", port);


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();