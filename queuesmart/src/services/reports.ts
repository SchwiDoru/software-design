import type { QueueEntryStatus, ReportFilters, ReportSummary } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const appendFilters = (params: URLSearchParams, filters: ReportFilters) => {
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.serviceId) params.set("serviceId", String(filters.serviceId));
  if (filters.status) params.set("status", filters.status);
};

const buildReportUrl = (path: string, filters: ReportFilters) => {
  const params = new URLSearchParams();
  appendFilters(params, filters);
  const query = params.toString();
  return `${API_URL}${path}${query ? `?${query}` : ""}`;
};

async function handleJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with status ${response.status}`);
  }

  return data as T;
}

export async function getReportSummary(filters: ReportFilters): Promise<ReportSummary> {
  const response = await fetch(buildReportUrl("/reports/summary", filters), {
    credentials: "include"
  });

  return handleJsonResponse<ReportSummary>(response);
}

export async function downloadReport(format: "csv" | "pdf", filters: ReportFilters): Promise<void> {
  const response = await fetch(buildReportUrl(`/reports/export.${format}`, filters), {
    credentials: "include"
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? `Failed to export ${format.toUpperCase()} report`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `queuesmart-report.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const reportStatusOptions: QueueEntryStatus[] = [
  "Pending",
  "Waiting",
  "InProgress",
  "Completed",
  "Cancelled",
  "Removed"
];
