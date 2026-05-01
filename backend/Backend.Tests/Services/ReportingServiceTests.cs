using System.Text;
using Backend.Constants;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Backend.Tests.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Tests.Services;

public class ReportingServiceTests : IDisposable
{
    private readonly AppDbContext _testDbContext;
    private readonly ReportingService _service;

    public ReportingServiceTests()
    {
        _testDbContext = TestDbContextFactory.CreateWithSeedData();
        _service = new ReportingService(_testDbContext, TimeProvider.System);
    }

    [Fact]
    public async Task GenerateReport_ReturnsUsageStatsAndServiceActivity()
    {
        await SeedReportingData();

        var report = await _service.GenerateReport(new());

        Assert.Equal(2, report.UsageStats.TotalQueueEntries);
        Assert.Equal(1, report.UsageStats.UsersServed);
        Assert.Equal(30, report.UsageStats.AverageWaitMinutes);
        Assert.Equal(1, report.UsageStats.StatusBreakdown["Completed"]);
        Assert.Equal(1, report.UsageStats.StatusBreakdown["Waiting"]);

        var serviceActivity = Assert.Single(report.ServiceActivity);
        Assert.Equal("Testing Service", serviceActivity.ServiceName);
        Assert.Equal(2, serviceActivity.EntryCount);
        Assert.Equal(1, serviceActivity.UsersServed);
    }

    [Fact]
    public async Task GenerateReport_AppliesStatusAndServiceFilters()
    {
        var completedEntry = await SeedReportingData();

        var report = await _service.GenerateReport(new()
        {
            ServiceId = 1,
            Status = QueueEntryStatus.Completed
        });

        var participation = Assert.Single(report.UserParticipation);
        Assert.Equal(completedEntry.Id, participation.QueueEntryId);
        Assert.Equal("Completed", participation.Status);
    }

    [Fact]
    public async Task GenerateCsv_IncludesSummaryAndParticipationSections()
    {
        await SeedReportingData();

        var csv = await _service.GenerateCsv(new());

        Assert.Contains("Usage Statistics", csv);
        Assert.Contains("Service Activity", csv);
        Assert.Contains("User Participation", csv);
        Assert.Contains("Report Patient", csv);
    }

    [Fact]
    public async Task GeneratePdf_ReturnsPdfBytes()
    {
        await SeedReportingData();

        var pdf = await _service.GeneratePdf(new());

        Assert.True(pdf.Length > 0);
        Assert.StartsWith("%PDF", Encoding.ASCII.GetString(pdf[..4]));
    }

    private async Task<QueueEntry> SeedReportingData()
    {
        _testDbContext.UserProfiles.Add(new UserProfile
        {
            Email = "report@example.com",
            Name = "Report Patient",
            PhoneNumber = "555-0100"
        });

        var completedEntry = new QueueEntry
        {
            QueueId = 1,
            UserId = "report@example.com",
            JoinTime = new DateTime(2026, 4, 1, 14, 0, 0, DateTimeKind.Utc),
            Status = QueueEntryStatus.Completed,
            Priority = PriorityLevel.Low,
            Position = null
        };

        var waitingEntry = new QueueEntry
        {
            QueueId = 1,
            UserId = "test2@example.com",
            JoinTime = new DateTime(2026, 4, 2, 15, 0, 0, DateTimeKind.Utc),
            Status = QueueEntryStatus.Waiting,
            Priority = PriorityLevel.Medium,
            Position = 0
        };

        _testDbContext.QueueEntries.AddRange(completedEntry, waitingEntry);
        await _testDbContext.SaveChangesAsync();

        _testDbContext.Histories.Add(new History
        {
            HistoryId = "QS-REPORT",
            QueueEntryId = completedEntry.Id,
            Date = completedEntry.JoinTime.AddMinutes(30)
        });
        await _testDbContext.SaveChangesAsync();

        _testDbContext.ChangeTracker.Clear();
        return completedEntry;
    }

    public void Dispose()
    {
        _testDbContext.Database.EnsureDeleted();
        _testDbContext.Dispose();
    }
}
