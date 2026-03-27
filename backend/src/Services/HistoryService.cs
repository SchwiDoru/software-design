using Backend.Constants;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class HistoryService : IHistoryService
{
    private readonly AppDbContext _dbContext;
    private readonly INotificationService _notificationService;

    public HistoryService(AppDbContext dbContext, INotificationService notificationService)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
    }

    public async Task<History> CompleteVisit(int queueEntryId, List<HistoryDetail>? details, List<Prescription>? prescriptions)
    {
        if (queueEntryId <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(queueEntryId), "Queue entry ID must be greater than 0");
        }

        var queueEntry = await _dbContext.QueueEntries
            .Include(entry => entry.Queue)
            .Include(entry => entry.User)
            .FirstOrDefaultAsync(entry => entry.Id == queueEntryId);

        if (queueEntry == null)
        {
            throw new KeyNotFoundException($"Queue entry with ID {queueEntryId} was not found");
        }

        var existingHistory = await _dbContext.Histories.AnyAsync(history => history.QueueEntryId == queueEntryId);
        if (existingHistory)
        {
            throw new InvalidOperationException("A history record already exists for this queue entry");
        }

        if (queueEntry.Status == QueueEntryStatus.Cancelled || queueEntry.Status == QueueEntryStatus.Removed)
        {
            throw new InvalidOperationException("Only active or in-progress visits can be completed");
        }

        if (queueEntry.Status == QueueEntryStatus.Completed)
        {
            throw new InvalidOperationException("This visit has already been completed");
        }

        var history = new History
        {
            HistoryId = $"QS-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
            Date = DateTime.UtcNow,
            QueueEntryId = queueEntryId,
            QueueEntry = queueEntry
        };

        var normalizedDetails = (details ?? [])
            .Select(detail => new HistoryDetail
            {
                HistoryId = history.HistoryId,
                Diagnosis = detail.Diagnosis?.Trim() ?? string.Empty,
                ServiceType = detail.ServiceType?.Trim() ?? string.Empty,
                Assessment = detail.Assessment?.Trim() ?? string.Empty,
                Label = detail.Label?.Trim() ?? string.Empty
            })
            .ToList();

        var normalizedPrescriptions = (prescriptions ?? [])
            .Select(prescription => new Prescription
            {
                HistoryId = history.HistoryId,
                PrescriptionName = prescription.PrescriptionName?.Trim() ?? string.Empty,
                Amt = prescription.Amt,
                DailyUsage = prescription.DailyUsage?.Trim() ?? string.Empty
            })
            .ToList();

        queueEntry.Status = QueueEntryStatus.Completed;
        queueEntry.Position = null;

        history.HistoryDetails = normalizedDetails;
        history.Prescriptions = normalizedPrescriptions;

        _dbContext.Histories.Add(history);

        await _dbContext.SaveChangesAsync();
        await _notificationService.CreatePatientVisitCompletedNotification(queueEntry.Id);

        return await _dbContext.Histories
            .Include(record => record.QueueEntry)
                .ThenInclude(entry => entry.Queue)
            .Include(record => record.HistoryDetails)
            .Include(record => record.Prescriptions)
            .FirstAsync(record => record.HistoryId == history.HistoryId);
    }

    public async Task<List<History>> GetPatientHistory(string userEmail)
    {
        if (string.IsNullOrWhiteSpace(userEmail))
        {
            throw new ArgumentException("Patient email is required", nameof(userEmail));
        }

        var normalizedUserEmail = userEmail.Trim().ToLowerInvariant();

        return await _dbContext.Histories
            .Include(history => history.QueueEntry)
                .ThenInclude(entry => entry.Queue!)
                    .ThenInclude(queue => queue.Service)
            .Include(history => history.HistoryDetails)
            .Include(history => history.Prescriptions)
            .Where(history => history.QueueEntry.UserId == normalizedUserEmail)
            .OrderByDescending(history => history.Date)
            .ToListAsync();
    }
}
