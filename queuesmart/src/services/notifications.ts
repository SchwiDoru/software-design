import type { NotificationEvent, UserRole } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export async function getNotifications(role: UserRole, userId?: string, since?: string): Promise<NotificationEvent[]> {
  const params = new URLSearchParams({ role });

  if (userId) {
    params.set("userId", userId);
  }

  if (since) {
    params.set("since", since);
  }

  const response = await fetch(`${API_URL}/notifications?${params.toString()}`);

  if (response.status === 204) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Failed to load notifications: ${response.status}`);
  }

  return response.json() as Promise<NotificationEvent[]>;
}
