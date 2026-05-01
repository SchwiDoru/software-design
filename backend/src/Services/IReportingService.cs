using Backend.DTO.Reports;

namespace Backend.Services;

public interface IReportingService
{
    Task<ReportSummaryDTO> GenerateReport(ReportFilterDTO filters);
    Task<string> GenerateCsv(ReportFilterDTO filters);
    Task<byte[]> GeneratePdf(ReportFilterDTO filters);
}
