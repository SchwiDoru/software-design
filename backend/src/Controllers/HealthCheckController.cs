

using System.Security.Cryptography.X509Certificates;
using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;


[ApiController]
[Route("/")]

public class HealthCheckController: ControllerBase
{
    private readonly HealthCheckService _healthCheckService;

    public HealthCheckController(HealthCheckService healthService)
    {
        _healthCheckService = healthService;
    }

    [HttpGet]
    public ActionResult<HealthCheckDTO> GetHealthCheck()
    {
        var healthCheckDTO = _healthCheckService.GetHealthCheck();
        return Ok(healthCheckDTO);
    }
}