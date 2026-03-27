import type { HistoryRecord } from "../types";

interface CompleteVisitOptions {
  notes?: string;
  serviceName?: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export async function getPatientHistory(userId: string): Promise<HistoryRecord[]> {
  const response = await fetch(`${API_URL}/history/my?userId=${encodeURIComponent(userId)}`, {
    credentials: "include"
  });

  if (response.status === 204) {
    return [];
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Failed to load history: ${response.status}`);
  }

  return (data as HistoryRecord[]).map((record) => ({
    clinic: "QueueSmart Clinic",
    ...record
  }));
}

export async function completeVisitHistory(queueEntryId: number, options: CompleteVisitOptions = {}): Promise<HistoryRecord> {
  const response = await fetch(`${API_URL}/history/staff/complete/${queueEntryId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      historyDetails: [
        {
          diagnosis: "Visit completed",
          serviceType: options.serviceName?.trim() || "Clinic Visit",
          assessment: options.notes?.trim() || "Patient was seen by the doctor and checked out by staff.",
          label: "Completed Visit"
        }
      ],
      prescriptions: []
    })
  });

  const raw = await response.text();
  let data: unknown = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }
  const errorPayload = data as { error?: string } | null;

  if (!response.ok) {
    throw new Error(errorPayload?.error ?? `Failed to complete visit: ${response.status}`);
  }

  if (!data) {
    return {
      historyId: `completed-${queueEntryId}`,
      date: new Date().toISOString(),
      queueEntryId,
      queueEntry: {} as HistoryRecord["queueEntry"],
      historyDetails: [],
      prescriptions: [],
      clinic: "QueueSmart Clinic"
    };
  }

  return {
    clinic: "QueueSmart Clinic",
    ...(data as HistoryRecord)
  };
}
