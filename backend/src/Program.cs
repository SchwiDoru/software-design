using System.Text.Json.Serialization;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

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
    });
var app = builder.Build();

// Seed default users
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (!dbContext.UserProfiles.Any(u => u.Email == "darrenfr83@gmail.com"))
    {
        dbContext.UserProfiles.Add(new UserProfile
        {
            Email = "darrenfr83@gmail.com",
            Name = "Darren",
            PhoneNumber = null
        });
        Console.WriteLine("✅ Default user created: darrenfr83@gmail.com");
    }

    if (!dbContext.UserProfiles.Any(u => u.Email == "test@gmail.com"))
    {
        dbContext.UserProfiles.Add(new UserProfile
        {
            Email = "test@gmail.com",
            Name = "Alex",
            PhoneNumber = null
        });
        Console.WriteLine("✅ Default user created: test@gmail.com");
    }

    dbContext.SaveChanges();
}

var port = Environment.GetEnvironmentVariable("ASPNETCORE_HTTP_PORTS") ?? "8080";
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation($"🚀🚀🚀🚀🚀🚀 Application available at: http://localhost:{port}");


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.MapControllers();

app.Run();
