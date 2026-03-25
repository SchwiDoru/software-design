using Backend.Models;

namespace Backend.Services;

public interface IHistoryService
{
    Task<History> CompleteVisit(int queueEntryId, List<HistoryDetail> details, List<Prescription> prescriptions);
    Task<List<History>> GetPatientHistory(string userEmail);
}