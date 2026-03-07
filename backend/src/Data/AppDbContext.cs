using Backend.Models;
using Microsoft.EntityFrameworkCore;

public class AppDbContext: DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options): base(options){}

    public DbSet<Service> Services {get; set;}
    public DbSet<Queue> Queues {get; set;}
}