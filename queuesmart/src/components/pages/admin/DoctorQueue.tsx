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

export default function DoctorQueue() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const doctorQueueEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.status === "InProgress")
      .sort((left, right) => new Date(left.joinTime).getTime() - new Date(right.joinTime).getTime());
  }, [entries]);

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
      <div className="mx-auto w-full max-w-7xl pb-20">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="section-label mb-4">
              <span className="section-label-dot" />
              <span className="section-label-text">Doctor waiting list</span>
            </div>
            <h1 className="text-4xl leading-tight text-foreground sm:text-5xl">
              Patients waiting <span className="gradient-text">for the doctor</span>
            </h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Patients move here after staff sends them from the live queue to the front desk. When the doctor is finished, mark the visit complete so it appears in patient history.
            </p>
          </div>

          <div className="surface-card flex min-w-[220px] items-center justify-between gap-4 p-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Waiting For Doctor</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{doctorQueueEntries.length}</p>
            </div>
            <div className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">
              Front desk
            </div>
          </div>
        </div>

        {successMessage ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-5">
          {isLoading ? (
            <div className="surface-card py-20 text-center text-muted-foreground">Loading doctor queue...</div>
          ) : doctorQueueEntries.length > 0 ? (
            doctorQueueEntries.map((entry) => {
              const queue = queueLookup.get(entry.queueId);

              return (
                <article key={entry.id} className="surface-card overflow-hidden">
                  <div className="flex flex-col gap-4 border-b border-border bg-muted/40 p-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl text-foreground">{entry.user?.name ?? entry.userId}</h2>
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                          Waiting for doctor
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span>{entry.user?.email ?? entry.userId}</span>
                        <span className="hidden md:inline">|</span>
                        <span>Sent at {formatJoinTime(entry.joinTime)}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                      <div>Service: {queue?.service?.name ?? entry.queue?.service?.name ?? "Unknown service"}</div>
                      <div className="mt-1">Priority: {entry.priority}</div>
                    </div>
                  </div>

                  <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Visit notes</p>
                      <p className="mt-3 text-sm leading-6 text-foreground">
                        {entry.description?.trim() || "No visit description was provided when the patient joined the queue."}
                      </p>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
                      <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                        Completing this step checks the patient out, creates a visit history record, and removes them from the doctor waiting list.
                      </div>

                      <Button
                        variant="success"
                        className="w-full"
                        onClick={() => void handleCompleteVisit(entry)}
                        disabled={completingId === entry.id}
                      >
                        {completingId === entry.id ? "Completing Visit..." : "Doctor Took Care Of Them"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="surface-card py-20 text-center text-muted-foreground">
              <p className="text-2xl text-foreground">No patients are waiting for the doctor</p>
              <p className="mt-2 text-sm">Patients sent from queue management will appear here until staff marks the visit complete.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
