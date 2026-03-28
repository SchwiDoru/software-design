import type { PatientProfile, PatientSummary } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return [] as T;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with status ${response.status}`);
  }

  return data as T;
}

export async function getPatients(): Promise<PatientSummary[]> {
  const response = await fetch(`${API_URL}/patients`, {
    credentials: "include"
  });

  return handleResponse<PatientSummary[]>(response);
}

export async function getPatientByEmail(email: string): Promise<PatientProfile> {
  const response = await fetch(`${API_URL}/patients/${encodeURIComponent(email)}`, {
    credentials: "include"
  });

  return handleResponse<PatientProfile>(response);
}
