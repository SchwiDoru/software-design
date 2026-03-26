using Backend.Constants;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Backend.Tests.Data;
using Microsoft.EntityFrameworkCore;
using Xunit; // Ensure Xunit is included

namespace Backend.Tests.Services;

public class ServiceManagerTests : IDisposable
{
    private readonly AppDbContext _testDbContext;
    private readonly ServiceManager _serviceManager;

    public ServiceManagerTests()
    {
        _testDbContext = TestDbContextFactory.CreateWithSeedData();
        _serviceManager = new ServiceManager(_testDbContext);
    }

    private static Service CreateValidService(
        string name = "Consultation",
        int duration = 15,
        PriorityLevel priority = PriorityLevel.Low)
    {
        return new Service
        {
            Name = name,
            Description = "Sample description",
            Duration = duration,
            Priority = priority,
        };
    }

    [Fact]
    public async Task GetServices_ReturnsSeededServices()
    {
        // FIX: Changed _service to _serviceManager to match the class field
        var result = await _serviceManager.GetServices();
        
        // Using a predicate to avoid reference equality issues
        Assert.Contains(result, s => s.Id == 1 && s.Name == "Clinic");
    }

    [Fact]
    public async Task GetServiceById_WhenServiceExists_ReturnsService()
    {
        var service = await _serviceManager.GetServiceById(1);

        Assert.NotNull(service);
        Assert.Equal(1, service.Id);
    }

    [Theory]
    [InlineData(999)]
    [InlineData(-1)]
    public async Task GetServiceById_WhenServiceDoesNotExist_ReturnsNull(int id)
    {
        var service = await _serviceManager.GetServiceById(id);

        Assert.Null(service);
    }

    [Fact]
    public async Task CreateService_WithNullService_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() => _serviceManager.CreateService(null!));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateService_WithInvalidName_ThrowsArgumentException(string name)
    {
        var service = CreateValidService(name: name);

        await Assert.ThrowsAsync<ArgumentException>(() => _serviceManager.CreateService(service));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public async Task CreateService_WithInvalidDuration_ThrowsArgumentOutOfRangeException(int duration)
    {
        var service = CreateValidService(duration: duration);

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => _serviceManager.CreateService(service));
    }

    [Fact]
    public async Task CreateService_WithInvalidPriority_ThrowsArgumentException()
    {
        var service = CreateValidService(priority: (PriorityLevel)999);

        await Assert.ThrowsAsync<ArgumentException>(() => _serviceManager.CreateService(service));
    }

    [Fact]
    public async Task CreateService_WithValidData_ReturnsCreatedService()
    {
        var service = CreateValidService(name: "Registration", duration: 25, priority: PriorityLevel.High);

        var createdService = await _serviceManager.CreateService(service);

        Assert.NotNull(createdService);
        Assert.True(createdService.Id > 0);
        Assert.Equal("Registration", createdService.Name);
        Assert.Equal(25, createdService.Duration);
        Assert.Equal(PriorityLevel.High, createdService.Priority);
    }

    [Fact]
    public async Task UpdateService_WithNullService_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() => _serviceManager.UpdateService(1, null!));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task UpdateService_WithInvalidName_ThrowsArgumentException(string name)
    {
        var service = CreateValidService(name: name);

        await Assert.ThrowsAsync<ArgumentException>(() => _serviceManager.UpdateService(1, service));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task UpdateService_WithInvalidDuration_ThrowsArgumentOutOfRangeException(int duration)
    {
        var service = CreateValidService(duration: duration);

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => _serviceManager.UpdateService(1, service));
    }

    [Fact]
    public async Task UpdateService_WithInvalidPriority_ThrowsArgumentException()
    {
        var service = CreateValidService(priority: (PriorityLevel)999);

        await Assert.ThrowsAsync<ArgumentException>(() => _serviceManager.UpdateService(1, service));
    }

    [Fact]
    public async Task UpdateService_WhenServiceDoesNotExist_ReturnsNull()
    {
        var updatedData = CreateValidService();

        var result = await _serviceManager.UpdateService(999, updatedData);

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateService_WithValidData_UpdatesService()
    {
        var updatedData = CreateValidService(name: "Updated Service", duration: 45, priority: PriorityLevel.Medium);

        var result = await _serviceManager.UpdateService(1, updatedData);

        Assert.NotNull(result);
        Assert.Equal("Updated Service", result.Name);
        Assert.Equal(45, result.Duration);
        Assert.Equal(PriorityLevel.Medium, result.Priority);

        var serviceInDb = await _testDbContext.Services.FirstAsync(service => service.Id == 1);
        Assert.Equal("Updated Service", serviceInDb.Name);
        Assert.Equal(45, serviceInDb.Duration);
        Assert.Equal(PriorityLevel.Medium, serviceInDb.Priority);
    }

    public void Dispose()
    {
        _testDbContext.Database.EnsureDeleted();
        _testDbContext.Dispose();
    }
}