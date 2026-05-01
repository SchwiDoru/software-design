using Backend.DTO.Reports;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Staff")]
[Route("reports")]
public class ReportingController : ControllerBase
{
    private readonly IReportingService _reportingService;

    public ReportingController(IReportingService reportingService)
    {
        _reportingService = reportingService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ReportSummaryDTO>> GetSummary([FromQuery] ReportFilterDTO filters)
    {
        try
        {
            return Ok(await _reportingService.GenerateReport(filters));
        }
        catch (Exception err)
        {
            Console.WriteLine($"Error in ReportingController.GetSummary: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error generating report summary" });
        }
    }

    [HttpGet("export.csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] ReportFilterDTO filters)
    {
        try
        {
            var csv = await _reportingService.GenerateCsv(filters);
            var fileName = $"queuesmart-report-{DateTime.UtcNow:yyyyMMdd-HHmm}.csv";
            return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", fileName);
        }
        catch (Exception err)
        {
            Console.WriteLine($"Error in ReportingController.ExportCsv: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error exporting CSV report" });
        }
    }

    [HttpGet("export.pdf")]
    public async Task<IActionResult> ExportPdf([FromQuery] ReportFilterDTO filters)
    {
        try
        {
            var pdf = await _reportingService.GeneratePdf(filters);
            var fileName = $"queuesmart-report-{DateTime.UtcNow:yyyyMMdd-HHmm}.pdf";
            return File(pdf, "application/pdf", fileName);
        }
        catch (Exception err)
        {
            Console.WriteLine($"Error in ReportingController.ExportPdf: {err.Message}");
            Console.WriteLine($"Stack Trace: {err.StackTrace}");
            return StatusCode(500, new { error = "Unexpected error exporting PDF report" });
        }
    }
}
