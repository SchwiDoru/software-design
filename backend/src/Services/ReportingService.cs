using System.Globalization;
using System.Text;
using Backend.Constants;
using Backend.Data;
using Backend.DTO.Reports;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class ReportingService : IReportingService
{
    private readonly AppDbContext _dbContext;
    private readonly TimeProvider _timeProvider;

    public ReportingService(AppDbContext dbContext, TimeProvider timeProvider)
    {
        _dbContext = dbContext;
        _timeProvider = timeProvider;
    }

    public async Task<ReportSummaryDTO> GenerateReport(ReportFilterDTO filters)
    {
        filters ??= new ReportFilterDTO();
        var startDate = filters.StartDate.HasValue
            ? DateTime.SpecifyKind(filters.StartDate.Value.Date, DateTimeKind.Utc)
            : (DateTime?)null;
        var endDate = filters.EndDate.HasValue
            ? DateTime.SpecifyKind(filters.EndDate.Value.Date.AddDays(1), DateTimeKind.Utc)
            : (DateTime?)null;

        var entriesQuery = _dbContext.QueueEntries
            .AsNoTracking()
            .Include(entry => entry.User)
            .Include(entry => entry.Queue!)
                .ThenInclude(queue => queue.Service)
            .AsQueryable();

        if (filters.StartDate.HasValue)
        {
            entriesQuery = entriesQuery.Where(entry => entry.JoinTime >= startDate!.Value);
        }

        if (endDate.HasValue)
        {
            entriesQuery = entriesQuery.Where(entry => entry.JoinTime < endDate.Value);
        }

        if (filters.ServiceId.HasValue)
        {
            entriesQuery = entriesQuery.Where(entry => entry.Queue != null && entry.Queue.ServiceId == filters.ServiceId.Value);
        }

        if (filters.Status.HasValue)
        {
            entriesQuery = entriesQuery.Where(entry => entry.Status == filters.Status.Value);
        }

        var entries = await entriesQuery
            .OrderByDescending(entry => entry.JoinTime)
            .ToListAsync();

        var entryIds = entries.Select(entry => entry.Id).ToList();
        var historiesByEntryId = await _dbContext.Histories
            .AsNoTracking()
            .Where(history => entryIds.Contains(history.QueueEntryId))
            .ToDictionaryAsync(history => history.QueueEntryId);

        var participation = entries.Select(entry =>
        {
            historiesByEntryId.TryGetValue(entry.Id, out var history);
            var completedAt = history?.Date;
            var waitMinutes = completedAt.HasValue
                ? Math.Max(0, (completedAt.Value - entry.JoinTime).TotalMinutes)
                : (double?)null;

            return new UserQueueParticipationDTO
            {
                QueueEntryId = entry.Id,
                UserEmail = entry.UserId,
                UserName = entry.User?.Name ?? entry.UserId,
                PhoneNumber = entry.User?.PhoneNumber,
                QueueId = entry.QueueId,
                ServiceId = entry.Queue?.ServiceId,
                ServiceName = entry.Queue?.Service?.Name ?? "Unknown service",
                QueueDate = entry.Queue?.Date,
                JoinedAt = entry.JoinTime,
                CompletedAt = completedAt,
                Status = entry.Status.ToString(),
                Priority = entry.Priority.ToString(),
                Position = entry.Position,
                WaitMinutes = waitMinutes
            };
        }).ToList();

        var servedStatuses = new HashSet<string> { QueueEntryStatus.Completed.ToString() };
        var completedWaits = participation
            .Where(record => servedStatuses.Contains(record.Status) && record.WaitMinutes.HasValue)
            .Select(record => record.WaitMinutes!.Value)
            .ToList();

        var services = participation
            .GroupBy(record => new { record.ServiceId, record.ServiceName })
            .Select(group =>
            {
                var groupWaits = group
                    .Where(record => servedStatuses.Contains(record.Status) && record.WaitMinutes.HasValue)
                    .Select(record => record.WaitMinutes!.Value)
                    .ToList();

                return new ServiceQueueActivityDTO
                {
                    ServiceId = group.Key.ServiceId ?? 0,
                    ServiceName = group.Key.ServiceName,
                    QueueCount = group.Select(record => record.QueueId).Distinct().Count(),
                    EntryCount = group.Count(),
                    UsersServed = group.Count(record => servedStatuses.Contains(record.Status)),
                    AverageWaitMinutes = RoundMinutes(groupWaits)
                };
            })
            .OrderBy(activity => activity.ServiceName)
            .ToList();

        return new ReportSummaryDTO
        {
            GeneratedAt = _timeProvider.GetUtcNow().UtcDateTime,
            Filters = filters,
            UsageStats = new QueueUsageStatsDTO
            {
                TotalQueueEntries = participation.Count,
                UsersServed = participation.Count(record => servedStatuses.Contains(record.Status)),
                AverageWaitMinutes = RoundMinutes(completedWaits),
                StatusBreakdown = participation
                    .GroupBy(record => record.Status)
                    .OrderBy(group => group.Key)
                    .ToDictionary(group => group.Key, group => group.Count())
            },
            ServiceActivity = services,
            UserParticipation = participation
        };
    }

    public async Task<string> GenerateCsv(ReportFilterDTO filters)
    {
        var report = await GenerateReport(filters);
        var csv = new StringBuilder();

        csv.AppendLine("QueueSmart Reporting Summary");
        csv.AppendLine($"Generated At,{EscapeCsv(FormatDateTime(report.GeneratedAt))}");
        csv.AppendLine($"Start Date,{EscapeCsv(FormatDate(report.Filters.StartDate))}");
        csv.AppendLine($"End Date,{EscapeCsv(FormatDate(report.Filters.EndDate))}");
        csv.AppendLine($"Service ID,{EscapeCsv(report.Filters.ServiceId?.ToString(CultureInfo.InvariantCulture) ?? "All")}");
        csv.AppendLine($"Status,{EscapeCsv(report.Filters.Status?.ToString() ?? "All")}");
        csv.AppendLine();

        csv.AppendLine("Usage Statistics");
        csv.AppendLine("Total Queue Entries,Users Served,Average Wait Minutes");
        csv.AppendLine($"{report.UsageStats.TotalQueueEntries},{report.UsageStats.UsersServed},{FormatNumber(report.UsageStats.AverageWaitMinutes)}");
        csv.AppendLine();

        csv.AppendLine("Status Breakdown");
        csv.AppendLine("Status,Count");
        foreach (var status in report.UsageStats.StatusBreakdown)
        {
            csv.AppendLine($"{EscapeCsv(status.Key)},{status.Value}");
        }
        csv.AppendLine();

        csv.AppendLine("Service Activity");
        csv.AppendLine("Service ID,Service Name,Queue Count,Entry Count,Users Served,Average Wait Minutes");
        foreach (var service in report.ServiceActivity)
        {
            csv.AppendLine(string.Join(",",
                service.ServiceId,
                EscapeCsv(service.ServiceName),
                service.QueueCount,
                service.EntryCount,
                service.UsersServed,
                FormatNumber(service.AverageWaitMinutes)));
        }
        csv.AppendLine();

        csv.AppendLine("User Participation");
        csv.AppendLine("Queue Entry ID,User Name,User Email,Phone,Queue ID,Service Name,Queue Date,Joined At,Completed At,Status,Priority,Position,Wait Minutes");
        foreach (var record in report.UserParticipation)
        {
            csv.AppendLine(string.Join(",",
                record.QueueEntryId,
                EscapeCsv(record.UserName),
                EscapeCsv(record.UserEmail),
                EscapeCsv(record.PhoneNumber ?? ""),
                record.QueueId,
                EscapeCsv(record.ServiceName),
                EscapeCsv(FormatDate(record.QueueDate)),
                EscapeCsv(FormatDateTime(record.JoinedAt)),
                EscapeCsv(FormatDateTime(record.CompletedAt)),
                EscapeCsv(record.Status),
                EscapeCsv(record.Priority),
                record.Position?.ToString(CultureInfo.InvariantCulture) ?? "",
                record.WaitMinutes.HasValue ? FormatNumber(record.WaitMinutes.Value) : ""));
        }

        return csv.ToString();
    }

    public async Task<byte[]> GeneratePdf(ReportFilterDTO filters)
    {
        var report = await GenerateReport(filters);
        return SimplePdfReportWriter.Write(report);
    }

    private static double RoundMinutes(IReadOnlyCollection<double> values)
    {
        if (values.Count == 0)
        {
            return 0;
        }

        return Math.Round(values.Average(), 1);
    }

    private static string EscapeCsv(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }

    private static string FormatDate(DateTime? value)
    {
        return value.HasValue ? value.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : "";
    }

    private static string FormatDateTime(DateTime? value)
    {
        return value.HasValue ? value.Value.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture) : "";
    }

    private static string FormatNumber(double value)
    {
        return value.ToString("0.0", CultureInfo.InvariantCulture);
    }
}
