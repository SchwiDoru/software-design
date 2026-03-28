import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../admin/AdminLayout";
import { Button } from "../../ui/Button";
import { completeVisitHistory } from "../../../services/history";
import type { Queue, QueueEntry } from "../../../types";

function formatJoinTime(joinTime: string) {
  const date = new Date(joinTime);
  if (Number.isNaN(date.getTime())) {
    return joinTime;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatElapsedTime(joinTime: string, nowMs: number) {
  const startedAtMs = new Date(joinTime).getTime();
  if (Number.isNaN(startedAtMs)) {
    return "--:--:--";
  }

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function DoctorQueue() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedQueueId, setSelectedQueueId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      if (!isCancelled) {
        setIsLoading(true);
      }

      try {
        const [queueResponse, entryResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/queue`),
          fetch(`${import.meta.env.VITE_API_URL}/queueentry`)
        ]);

        if (!queueResponse.ok && queueResponse.status !== 204) {
          throw new Error(`Failed to load queues: ${queueResponse.status}`);
        }

        if (!entryResponse.ok && entryResponse.status !== 204) {
          throw new Error(`Failed to load queue entries: ${entryResponse.status}`);
        }

        const queueData = queueResponse.status === 204 ? [] : await queueResponse.json();
        const entryData = entryResponse.status === 204 ? [] : await entryResponse.json();

        if (!isCancelled) {
          setQueues(queueData);
          setEntries(entryData);
          setErrorMessage(null);
        }
      } catch (error) {
        console.error("Error loading doctor queue:", error);
        if (!isCancelled) {
          setQueues([]);
          setEntries([]);
          setErrorMessage("Unable to load the doctor waiting list right now.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();
    const timer = window.setInterval(() => {
      void loadData();
    }, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const queueLookup = useMemo(() => {
    return new Map(queues.map((queue) => [queue.id, queue]));
  }, [queues]);

  const queuesWithInProgress = useMemo(() => {
    return queues.filter((q) =>
      entries.some((e) => e.queueId === q.id && e.status === "InProgress")
    );
  }, [queues, entries]);

  useEffect(() => {
    if (queuesWithInProgress.length > 0 && !selectedQueueId) {
      setSelectedQueueId(queuesWithInProgress[0].id);
    }
  }, [queuesWithInProgress, selectedQueueId]);

  const doctorQueueEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.status === "InProgress" && entry.queueId === selectedQueueId)
      .sort((left, right) => new Date(left.joinTime).getTime() - new Date(right.joinTime).getTime());
  }, [entries, selectedQueueId]);

  const handleCompleteVisit = async (entry: QueueEntry) => {
    setCompletingId(entry.id);
    setErrorMessage(null);

    try {
      const queue = queueLookup.get(entry.queueId);

      await completeVisitHistory(entry.id, {
        serviceName: queue?.service?.name ?? entry.queue?.service?.name,
        notes: entry.description
      });
      setEntries((previous) => previous.filter((item) => item.id !== entry.id));
      setSuccessMessage(`${entry.user?.name ?? entry.userId} was marked as completed.`);
      window.setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error completing visit:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      setErrorMessage(`Unable to complete the visit for ${entry.user?.name ?? entry.userId}: ${message}`);
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 xl:flex-row">
        <div className="surface-card w-full overflow-hidden xl:w-[320px]">
          <div className="border-b border-border bg-muted/60 p-4">
            <h2 className="text-lg font-semibold text-foreground">Active Treatment</h2>
          </div>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto p-3 xl:max-h-[calc(100vh-220px)]">
            {queuesWithInProgress.length > 0 ? (
              queuesWithInProgress.map((queue) => (
                <button
                  key={queue.id}
                  onClick={() => setSelectedQueueId(queue.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${
                    selectedQueueId === queue.id
                      ? "border-accent/30 bg-accent/5 shadow-[0_4px_14px_rgba(0,82,255,0.15)]"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <p className="font-semibold text-foreground">{queue.service?.name}</p>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
                <p>No patients currently in treatment</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="surface-card flex min-h-[58vh] flex-1 flex-col overflow-hidden">
            {selectedQueueId ? (
              <>
                <div className="border-b border-border bg-muted/60 p-5">
                  <div>
                    <div className="section-label mb-3">
                      <span className="section-label-dot" />
                      <span className="section-label-text">Operating Room</span>
                    </div>
                    <h2 className="text-3xl font-semibold text-foreground">
                      {queueLookup.get(selectedQueueId)?.service?.name || "Queue"}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Real-time view of patients currently being treated. Mark each patient as complete once consultation is finished.
                    </p>
                  </div>
                </div>

                {successMessage ? (
                  <div className="mx-4 mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="mx-4 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="flex-1 overflow-auto bg-muted/30 p-4">
                  {isLoading ? (
                    <div className="surface-card py-20 text-center text-muted-foreground">Loading patients...</div>
                  ) : doctorQueueEntries.length > 0 ? (
                    <div className="space-y-5">
                      {doctorQueueEntries.map((entry) => {
                        const queue = queueLookup.get(entry.queueId);

                        return (
                          <article key={entry.id} className="surface-card overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                            <div className="space-y-6 p-6">
                              <div className="flex items-end justify-between gap-4">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Patient Name</p>
                                  <h3 className="mt-2 text-4xl font-bold text-foreground">{entry.user?.name ?? entry.userId}</h3>
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                                    entry.priority === "High"
                                      ? "bg-red-50 text-red-700"
                                      : entry.priority === "Medium"
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-emerald-50 text-emerald-700"
                                  }`}
                                >
                                  {entry.priority} Priority
                                </span>
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-border bg-card p-4">
                                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Service</p>
                                  <p className="mt-2 text-lg font-semibold text-foreground">
                                    {queue?.service?.name ?? "Unknown service"}
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-border bg-card p-4">
                                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Started At</p>
                                  <p className="mt-2 text-lg font-semibold text-foreground">{formatJoinTime(entry.joinTime)}</p>
                                </div>
                              </div>

                              <div className="rounded-2xl border border-border bg-card p-5">
                                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Patient Notes</p>
                                <p className="mt-3 text-base leading-6 text-foreground">
                                  {entry.description?.trim() || "No additional notes provided."}
                                </p>
                              </div>

                              <div className="rounded-2xl border border-border bg-card p-6">
                                <div className="flex flex-col items-center gap-4">
                                  <div className="text-center">
                                    <p className="text-lg font-semibold text-foreground">Doctor Working</p>
                                    <p className="mt-1 text-sm text-muted-foreground">Consultation in progress...</p>
                                  </div>

                                  <div className="w-full max-w-xs rounded-xl border border-border bg-background px-4 py-3 text-center">
                                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Time Elapsed</p>
                                    <p className="mt-2 font-mono text-2xl font-semibold tracking-widest text-foreground">
                                      {formatElapsedTime(entry.joinTime, currentTimeMs)}
                                    </p>
                                  </div>

                                  <Button
                                    variant="success"
                                    className="mt-4 w-full"
                                    onClick={() => void handleCompleteVisit(entry)}
                                    disabled={completingId === entry.id}
                                  >
                                    {completingId === entry.id ? "Completing..." : "✓ Mark Consultation Complete"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="surface-card py-20 text-center text-muted-foreground">
                      <p className="text-2xl text-foreground">No patients in this queue</p>
                      <p className="mt-2 text-sm">Patients will appear here once the doctor starts their consultation.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <p className="text-2xl text-foreground">Select a Queue</p>
                <p className="mt-2 text-sm">Select a queue from the left panel to view patients in treatment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}