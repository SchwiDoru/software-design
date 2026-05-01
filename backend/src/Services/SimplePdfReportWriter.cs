using System.Globalization;
using System.Text;
using Backend.DTO.Reports;

namespace Backend.Services;

public static class SimplePdfReportWriter
{
    private const int LinesPerPage = 42;

    public static byte[] Write(ReportSummaryDTO report)
    {
        var lines = BuildLines(report);
        var pages = lines
            .Select((line, index) => new { line, index })
            .GroupBy(item => item.index / LinesPerPage)
            .Select(group => group.Select(item => item.line).ToList())
            .ToList();

        var objects = new List<string>();
        var catalogObjectNumber = AddObject(objects, "<< /Type /Catalog /Pages 2 0 R >>");
        _ = catalogObjectNumber;

        var pageObjectNumbers = Enumerable.Range(0, pages.Count).Select(index => 3 + (index * 2)).ToList();
        AddObject(objects, $"<< /Type /Pages /Kids [{string.Join(" ", pageObjectNumbers.Select(number => $"{number} 0 R"))}] /Count {pages.Count} >>");

        for (var pageIndex = 0; pageIndex < pages.Count; pageIndex++)
        {
            var pageObjectNumber = 3 + (pageIndex * 2);
            var contentObjectNumber = pageObjectNumber + 1;
            var stream = BuildContentStream(pages[pageIndex], pageIndex + 1, pages.Count);
            var streamBytes = Encoding.ASCII.GetBytes(stream);

            AddObject(objects, $"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents {contentObjectNumber} 0 R >>");
            AddObject(objects, $"<< /Length {streamBytes.Length} >>\nstream\n{stream}endstream");
        }

        return BuildPdf(objects);
    }

    private static List<string> BuildLines(ReportSummaryDTO report)
    {
        var lines = new List<string>
        {
            "QueueSmart Reporting Summary",
            $"Generated: {FormatDateTime(report.GeneratedAt)} UTC",
            $"Filters: {FormatDate(report.Filters.StartDate) ?? "Any start"} to {FormatDate(report.Filters.EndDate) ?? "Any end"}, Service {report.Filters.ServiceId?.ToString(CultureInfo.InvariantCulture) ?? "All"}, Status {report.Filters.Status?.ToString() ?? "All"}",
            "",
            "Usage Statistics",
            $"Total queue entries: {report.UsageStats.TotalQueueEntries}",
            $"Users served: {report.UsageStats.UsersServed}",
            $"Average wait minutes: {report.UsageStats.AverageWaitMinutes:0.0}",
            ""
        };

        lines.Add("Status Breakdown");
        if (report.UsageStats.StatusBreakdown.Count == 0)
        {
            lines.Add("No queue activity matched the selected filters.");
        }
        else
        {
            lines.AddRange(report.UsageStats.StatusBreakdown.Select(status => $"{status.Key}: {status.Value}"));
        }

        lines.Add("");
        lines.Add("Service Activity");
        foreach (var service in report.ServiceActivity.Take(20))
        {
            lines.Add($"{service.ServiceName}: {service.EntryCount} entries, {service.UsersServed} served, {service.AverageWaitMinutes:0.0} avg min");
        }

        if (report.ServiceActivity.Count > 20)
        {
            lines.Add($"Additional services omitted from PDF preview: {report.ServiceActivity.Count - 20}");
        }

        lines.Add("");
        lines.Add("User Participation");
        foreach (var record in report.UserParticipation.Take(80))
        {
            var completed = record.CompletedAt.HasValue ? FormatDateTime(record.CompletedAt.Value) : "not completed";
            var wait = record.WaitMinutes.HasValue ? $"{record.WaitMinutes.Value:0.0} min" : "n/a";
            lines.Add($"{record.UserName} | {record.ServiceName} | {record.Status} | joined {FormatDateTime(record.JoinedAt)} | completed {completed} | wait {wait}");
        }

        if (report.UserParticipation.Count > 80)
        {
            lines.Add($"Additional participation rows omitted from PDF preview: {report.UserParticipation.Count - 80}");
        }

        return lines.Count == 0 ? ["No report data available."] : lines;
    }

    private static string BuildContentStream(IReadOnlyList<string> lines, int pageNumber, int pageCount)
    {
        var content = new StringBuilder();
        content.AppendLine("BT");
        content.AppendLine("/F2 16 Tf");
        content.AppendLine("50 750 Td");
        content.AppendLine($"({EscapePdfText(lines.FirstOrDefault() ?? "QueueSmart Reporting Summary")}) Tj");
        content.AppendLine("/F1 10 Tf");

        var yOffset = -24;
        foreach (var line in lines.Skip(1))
        {
            var font = IsSectionHeader(line) ? "/F2 11 Tf" : "/F1 9 Tf";
            content.AppendLine(font);
            content.AppendLine($"0 {yOffset} Td");
            content.AppendLine($"({EscapePdfText(TrimForPdf(line))}) Tj");
            yOffset = -16;
        }

        content.AppendLine("/F1 8 Tf");
        content.AppendLine($"0 {Math.Min(-16, -16 * (LinesPerPage - lines.Count + 1))} Td");
        content.AppendLine($"(Page {pageNumber} of {pageCount}) Tj");
        content.AppendLine("ET");
        return content.ToString();
    }

    private static byte[] BuildPdf(IReadOnlyList<string> objects)
    {
        using var stream = new MemoryStream();
        using var writer = new StreamWriter(stream, Encoding.ASCII, leaveOpen: true);
        var offsets = new List<long> { 0 };

        writer.Write("%PDF-1.4\n");
        writer.Flush();

        for (var index = 0; index < objects.Count; index++)
        {
            offsets.Add(stream.Position);
            writer.Write($"{index + 1} 0 obj\n");
            writer.Write(objects[index]);
            writer.Write("\nendobj\n");
            writer.Flush();
        }

        var xrefOffset = stream.Position;
        writer.Write($"xref\n0 {objects.Count + 1}\n");
        writer.Write("0000000000 65535 f \n");
        foreach (var offset in offsets.Skip(1))
        {
            writer.Write($"{offset:0000000000} 00000 n \n");
        }

        writer.Write($"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\n");
        writer.Write($"startxref\n{xrefOffset}\n%%EOF");
        writer.Flush();

        return stream.ToArray();
    }

    private static int AddObject(List<string> objects, string content)
    {
        objects.Add(content);
        return objects.Count;
    }

    private static bool IsSectionHeader(string line)
    {
        return line is "Usage Statistics" or "Status Breakdown" or "Service Activity" or "User Participation";
    }

    private static string EscapePdfText(string value)
    {
        return value
            .Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("(", "\\(", StringComparison.Ordinal)
            .Replace(")", "\\)", StringComparison.Ordinal);
    }

    private static string TrimForPdf(string value)
    {
        return value.Length <= 110 ? value : $"{value[..107]}...";
    }

    private static string? FormatDate(DateTime? value)
    {
        return value?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
    }

    private static string FormatDateTime(DateTime value)
    {
        return value.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);
    }
}
