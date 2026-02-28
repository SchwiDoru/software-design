using Backend.Services;
using Microsoft.EntityFrameworkCore;

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


builder.Services.AddControllers();

var app = builder.Build();

var port = Environment.GetEnvironmentVariable("ASPNETCORE_HTTP_PORTS") ?? "8080";
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation($"🚀🚀🚀🚀🚀🚀 Application available at: http://localhost:{port}");


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();

