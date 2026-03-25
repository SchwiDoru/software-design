using Backend.Models;
using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Backend.Constants;

namespace Backend.Services;

public class HistoryService : IHistoryService
{
    private readonly AppDbContext _dbContext;

    public HistoryService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<History> CompleteVisit(int queueEntryId, List<HistoryDetail> details, List<Prescription> prescriptions)
    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            // 1. Get the QueueEntry
            var entry = await _dbContext.QueueEntries
                .FirstOrDefaultAsync(qe => qe.Id == queueEntryId);

            if (entry == null) throw new KeyNotFoundException("Queue entry not found");

            // 2. Create the main History header
            var history = new History
            {
                HistoryID = $"QS-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}", // Matches UI
                Date = DateTime.UtcNow,
                QueueEntryId = queueEntryId
            };

            _dbContext.Histories.Add(history);
            await _dbContext.SaveChangesAsync();

            // 3. Add details and prescriptions pointing to the new HistoryID
            foreach (var detail in details) detail.HistoryID = history.HistoryID;
            foreach (var p in prescriptions) p.HistoryID = history.HistoryID;

            _dbContext.HistoryDetails.AddRange(details);
            _dbContext.Prescriptions.AddRange(prescriptions);

            // 4. Update the original entry status to "Served" or "Completed"
            entry.Status = QueueEntryStatus.Completed; 

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            return history;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            throw new Exception("Failed to complete medical visit record", ex);
        }
    }

        public async Task<List<History>> GetPatientHistory(string userEmail)
        {
            return await _dbContext.Histories
                .Include(h => h.QueueEntry)
                    .ThenInclude(qe => qe.Queue)
                        .ThenInclude(q => q.Service)
                .Include(h => h.HistoryDetails)
                .Include(h => h.Prescriptions)
                .Where(h => h.QueueEntry.UserId == userEmail)
                .OrderByDescending(h => h.Date)
                .ToListAsync();
        }
}