import type { QueueEntry } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export interface CreateQueueEntryDTO {
  queueId: number;
  userId: string;
  description?: string | null;
}

export interface EstimatedWaitTimeDTO {
  queueId: number;
  userId: string;
  position: number | null;
  estimatedWaitTimeMinutes: number;
  serviceDurationMinutes: number;
  message: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const err = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(err);
  }
  return data as T;
}

export async function createQueueEntry(payload: CreateQueueEntryDTO): Promise<QueueEntry> {
  const response = await fetch(`${API_URL}/QueueEntry/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<QueueEntry>(response);
}

export async function getActiveQueueEntry(userId: string): Promise<QueueEntry | null> {
  const response = await fetch(`${API_URL}/QueueEntry/active?userId=${encodeURIComponent(userId)}`);

  if (response.status === 204) {
    return null;
  }

  return handleResponse<QueueEntry>(response);
}

export async function leaveQueue(queueId: number, userId: string): Promise<void> {
  const response = await fetch(`${API_URL}/QueueEntry/leave?queueId=${queueId}&userId=${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
  await handleResponse<void>(response);
}

export async function estimateWaitTime(queueId: number, userId: string): Promise<EstimatedWaitTimeDTO> {
  const response = await fetch(`${API_URL}/QueueEntry/wait-time?queueId=${queueId}&userId=${encodeURIComponent(userId)}`);
  return handleResponse<EstimatedWaitTimeDTO>(response);
}