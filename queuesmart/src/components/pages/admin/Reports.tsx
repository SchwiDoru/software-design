import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, RefreshCcw } from "lucide-react";
import AdminLayout from "../../admin/AdminLayout";
import { Button } from "../../ui/Button";
import { downloadReport, getReportSummary, reportStatusOptions } from "../../../services/reports";
import type { QueueEntryStatus, ReportFilters, ReportSummary, Service } from "../../../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

type ActionMessage = { type: "success" | "error"; text: string };

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
};

const formatMinutes = (value?: number | null) => {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(1)} min`;
};

export default function Reports() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [filters, setFilters] = useState<ReportFilters>({ endDate: today });
  const [services, setServices] = useState<Service[]>([]);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<"csv" | "pdf" | null>(null);
  const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadServices = async () => {
      try {
        const response = await fetch(`${API_URL}/service`, {
          credentials: "include"
        });
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load services");
        }
        if (!isCancelled) {
          setServices(data as Service[]);
        }
      } catch (error) {
        console.warn("Failed to load report services", error);
        if (!isCancelled) {
          setServices([]);
        }
      }
    };

    void loadServices();

    return () => {
      isCancelled = true;
    };
  }, []);

  const loadReport = async () => {
    setIsLoading(true);
    setActionMessage(null);

    try {
      const nextReport = await getReportSummary(filters);
      setReport(nextReport);
    } catch (error) {
      setReport(null);
      setActionMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to generate report."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, []);

  const updateFilter = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K] | "") => {
    setFilters((previous) => {
      const next = { ...previous };
      if (value === "" || value === undefined) {
        delete next[key];
      } else {
        next[key] = value as ReportFilters[K];
      }
      return next;
    });
  };

  const handleExport = async (format: "csv" | "pdf") => {
    setIsExporting(format);
    setActionMessage(null);

    try {
      await downloadReport(format, filters);
      setActionMessage({
        type: "success",
        text: `${format.toUpperCase()} report exported successfully.`
      });
    } catch (error) {
      setActionMessage({
        type: "error",
        text: error instanceof Error ? error.message : `Unable to export ${format.toUpperCase()} report.`
      });
    } finally {
      setIsExporting(null);
    }
  };

  const statusEntries = Object.entries(report?.usageStats.statusBreakdown ?? {});

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-7xl pb-20">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="section-label mb-4">
              <span className="section-label-dot" />
              <span className="section-label-text">Admin Reports</span>
            </div>
            <h1 className="text-4xl text-foreground">Reporting <span className="gradient-text">Center</span></h1>
            <p className="mt-2 text-muted-foreground">Review queue usage, service activity, and patient participation.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" onClick={() => handleExport("csv")} disabled={isExporting !== null} title="Export CSV">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {isExporting === "csv" ? "Exporting..." : "CSV"}
            </Button>
            <Button variant="primary" onClick={() => handleExport("pdf")} disabled={isExporting !== null} title="Export PDF">
              <FileText className="mr-2 h-4 w-4" />
              {isExporting === "pdf" ? "Exporting..." : "PDF"}
            </Button>
          </div>
        </div>

        {actionMessage ? (
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
            actionMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}>
            {actionMessage.text}
          </div>
        ) : null}

        <div className="surface-card mb-6 p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Start Date</label>
              <input
                type="date"
                className="input-field"
                value={filters.startDate ?? ""}
                onChange={(event) => updateFilter("startDate", event.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">End Date</label>
              <input
                type="date"
                className="input-field"
                value={filters.endDate ?? ""}
                onChange={(event) => updateFilter("endDate", event.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Service</label>
              <select
                className="input-field"
                value={filters.serviceId ?? ""}
                onChange={(event) => updateFilter("serviceId", event.target.value ? Number(event.target.value) : "")}
              >
                <option value="">All services</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Status</label>
              <select
                className="input-field"
                value={filters.status ?? ""}
                onChange={(event) => updateFilter("status", event.target.value as QueueEntryStatus | "")}
              >
                <option value="">All statuses</option>
                {reportStatusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="secondary" fullWidth onClick={loadReport} disabled={isLoading}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {isLoading ? "Loading..." : "Generate"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="surface-card p-5">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Queue Entries</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{report?.usageStats.totalQueueEntries ?? 0}</p>
          </div>
          <div className="surface-card p-5">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Users Served</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{report?.usageStats.usersServed ?? 0}</p>
          </div>
          <div className="surface-card p-5">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Avg Wait</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{formatMinutes(report?.usageStats.averageWaitMinutes)}</p>
          </div>
        </div>

        <div className="mb-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="surface-card overflow-hidden">
            <div className="border-b border-border bg-muted/40 p-5">
              <h2 className="text-2xl text-foreground">Status Breakdown</h2>
            </div>
            <div className="divide-y divide-border/60">
              {statusEntries.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">No status activity found.</p>
              ) : statusEntries.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-4">
                  <span className="text-sm font-medium text-foreground">{status}</span>
                  <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card overflow-hidden">
            <div className="border-b border-border bg-muted/40 p-5">
              <h2 className="text-2xl text-foreground">Service Activity</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-muted/70 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  <tr>
                    <th className="border-b border-border p-4 font-medium">Service</th>
                    <th className="border-b border-border p-4 text-right font-medium">Queues</th>
                    <th className="border-b border-border p-4 text-right font-medium">Entries</th>
                    <th className="border-b border-border p-4 text-right font-medium">Served</th>
                    <th className="border-b border-border p-4 text-right font-medium">Avg Wait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {report?.serviceActivity.map((service) => (
                    <tr key={`${service.serviceId}-${service.serviceName}`} className="hover:bg-muted/30">
                      <td className="p-4 font-medium text-foreground">{service.serviceName}</td>
                      <td className="p-4 text-right text-sm text-muted-foreground">{service.queueCount}</td>
                      <td className="p-4 text-right text-sm text-muted-foreground">{service.entryCount}</td>
                      <td className="p-4 text-right text-sm text-muted-foreground">{service.usersServed}</td>
                      <td className="p-4 text-right text-sm text-muted-foreground">{formatMinutes(service.averageWaitMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {report && report.serviceActivity.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No service activity matched those filters.</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b border-border bg-muted/40 p-5 sm:flex-row sm:items-center">
            <h2 className="text-2xl text-foreground">User Participation</h2>
            <p className="text-sm text-muted-foreground">Generated {formatDateTime(report?.generatedAt)}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-muted/70 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                <tr>
                  <th className="border-b border-border p-4 font-medium">Patient</th>
                  <th className="border-b border-border p-4 font-medium">Service</th>
                  <th className="border-b border-border p-4 font-medium">Joined</th>
                  <th className="border-b border-border p-4 font-medium">Completed</th>
                  <th className="border-b border-border p-4 font-medium">Status</th>
                  <th className="border-b border-border p-4 text-right font-medium">Wait</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">Loading report...</td>
                  </tr>
                ) : null}
                {report?.userParticipation.map((record) => (
                  <tr key={record.queueEntryId} className="hover:bg-muted/30">
                    <td className="p-4">
                      <p className="font-medium text-foreground">{record.userName}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{record.userEmail}</p>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{record.serviceName}</td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDateTime(record.joinedAt)}</td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDateTime(record.completedAt)}</td>
                    <td className="p-4">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{record.status}</span>
                    </td>
                    <td className="p-4 text-right text-sm text-muted-foreground">{formatMinutes(record.waitMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && report?.userParticipation.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Download className="mx-auto mb-4 opacity-20" size={44} />
                <p>No user participation matched those filters.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
