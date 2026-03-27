using Backend.Controllers;
using Backend.Constants;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Backend.Tests.Controllers;

public class ServiceControllerTests
{
    private readonly Mock<IServiceManager> _serviceManagerMock;
    private readonly ServiceController _controller;

    public ServiceControllerTests()
    {
        _serviceManagerMock = new Mock<IServiceManager>();
        _controller = new ServiceController(_serviceManagerMock.Object);
    }

    [Fact]
    public async Task GetServicesController_ReturnsOkWithServices()
    {
        var services = new List<Service>
        {
            new() { Name = "Service A", Duration = 15, Priority = PriorityLevel.Low }
        };

        _serviceManagerMock.Setup(service => service.GetServices()).ReturnsAsync(services);

        var result = await _controller.GetServicesController();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<List<Service>>(okResult.Value);
        Assert.Single(value);
    }

    [Fact]
    public async Task GetServicesController_WhenServiceThrows_ReturnsBadRequest()
    {
        _serviceManagerMock.Setup(service => service.GetServices()).ThrowsAsync(new Exception("boom"));

        var result = await _controller.GetServicesController();

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetServiceByIdController_WhenMissing_ReturnsNotFound()
    {
        _serviceManagerMock.Setup(service => service.GetServiceById(99)).ReturnsAsync((Service?)null);

        var result = await _controller.GetServiceByIdController(99);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateServiceController_ReturnsCreatedAtAction()
    {
        var service = new Service { Name = "Created", Duration = 20, Priority = PriorityLevel.Medium };
        _serviceManagerMock.Setup(manager => manager.CreateService(service)).ReturnsAsync(service);

        var result = await _controller.CreateServiceController(service);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(ServiceController.GetServiceByIdController), createdResult.ActionName);
        Assert.Equal(service, createdResult.Value);
    }

    [Fact]
    public async Task GetServiceByIdController_WhenServiceThrows_ReturnsBadRequest()
    {
        _serviceManagerMock.Setup(service => service.GetServiceById(1)).ThrowsAsync(new Exception("boom"));

        var result = await _controller.GetServiceByIdController(1);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateServiceController_WhenServiceThrows_ReturnsBadRequest()
    {
        var service = new Service { Name = "Created", Duration = 20, Priority = PriorityLevel.Medium };
        _serviceManagerMock.Setup(manager => manager.CreateService(service)).ThrowsAsync(new Exception("boom"));

        var result = await _controller.CreateServiceController(service);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateServiceController_WhenMissing_ReturnsNotFound()
    {
        var service = new Service { Name = "Updated", Duration = 30, Priority = PriorityLevel.High };
        _serviceManagerMock.Setup(manager => manager.UpdateService(123, service)).ReturnsAsync((Service?)null);

        var result = await _controller.UpdateServiceController(123, service);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateServiceController_WithValidData_ReturnsOk()
    {
        var service = new Service { Name = "Updated", Duration = 30, Priority = PriorityLevel.High };
        _serviceManagerMock.Setup(manager => manager.UpdateService(1, service)).ReturnsAsync(service);

        var result = await _controller.UpdateServiceController(1, service);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(service, okResult.Value);
    }

    [Fact]
    public async Task UpdateServiceController_WhenServiceThrows_ReturnsBadRequest()
    {
        var service = new Service { Name = "Updated", Duration = 30, Priority = PriorityLevel.High };
        _serviceManagerMock.Setup(manager => manager.UpdateService(1, service)).ThrowsAsync(new Exception("boom"));

        var result = await _controller.UpdateServiceController(1, service);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }
}
