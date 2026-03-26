import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../admin/AdminLayout";
import { Button } from "../../ui/Button";
import type { Priority, Queue, QueueEntry } from "../../../types";

const priorityOptions: Priority[] = ["High", "Medium", "Low"];

type ReviewValues = Record<string, Priority>;
type SubmitState = Record<string, boolean>;

const priorityBadgeClasses: Record<Priority, string> = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-emerald-50 text-emerald-700"
};

function getEntryKey(entry: QueueEntry) {
  return `${entry.id}`;
}

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

export default function PendingQueueEntries() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [reviewValues, setReviewValues] = useState<ReviewValues>({});
  const [submitState, setSubmitState] = useState<SubmitState>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      if (!isCancelled) {
        setIsLoading(true);
        setErrorMessage(null);
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
        }
      } catch (error) {
        console.error("Error loading pending queue entries:", error);
        if (!isCancelled) {
          setErrorMessage("Unable to load pending queue entries right now.");
          setQueues([]);
          setEntries([]);
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

  const pendingEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.status === "Pending")
      .sort((left, right) => new Date(left.joinTime).getTime() - new Date(right.joinTime).getTime());
  }, [entries]);

  const queueLookup = useMemo(() => {
    return new Map(queues.map((queue) => [queue.id, queue]));
  }, [queues]);

  const handlePriorityChange = (entry: QueueEntry, priority: Priority) => {
    const key = getEntryKey(entry);
    setReviewValues((previous) => ({
      ...previous,
      [key]: priority
    }));
  };

  const handleConfirm = async (entry: QueueEntry) => {
    const key = getEntryKey(entry);
    const nextPriority = reviewValues[key] ?? entry.priority;

    setSubmitState((previous) => ({
      ...previous,
      [key]: true
    }));
    setErrorMessage(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/queueentry/${entry.id}/update-pending`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: "Waiting",
            priority: nextPriority,
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update queue entry: ${response.status}`);
      }

      const updatedEntry: QueueEntry = await response.json();

      setEntries((previous) => previous.map((item) => {
        if (item.id === entry.id) {
          return updatedEntry;
        }

        return item;
      }));
    } catch (error) {
      console.error("Error confirming queue entry:", error);
      setErrorMessage(`Unable to confirm ${entry.user?.name ?? entry.userId} right now.`);
    } finally {
      setSubmitState((previous) => ({
        ...previous,
        [key]: false
      }));
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-7xl pb-20">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="section-label mb-4">
              <span className="section-label-dot" />
              <span className="section-label-text">Pending queue review</span>
            </div>
            <h1 className="text-4xl leading-tight text-foreground sm:text-5xl">
              Review new <span className="gradient-text">queue entries</span>
            </h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              New arrivals stay in pending until an admin reviews their description, assigns a priority level, and sends them into the live waiting queue.
            </p>
          </div>

          <div className="surface-card flex min-w-[220px] items-center justify-between gap-4 p-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Pending Entries</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{pendingEntries.length}</p>
            </div>
            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
              Needs review
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-5">
          {isLoading ? (
            <div className="surface-card py-20 text-center text-muted-foreground">Loading pending queue entries...</div>
          ) : pendingEntries.length > 0 ? (
            pendingEntries.map((entry) => {
              const key = getEntryKey(entry);
              const selectedPriority = reviewValues[key] ?? entry.priority;
              const queue = queueLookup.get(entry.queueId);
              const isSubmitting = submitState[key] ?? false;

              return (
                <article key={key} className="surface-card overflow-hidden">
                  <div className="flex flex-col gap-4 border-b border-border bg-muted/40 p-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl text-foreground">{entry.user?.name ?? entry.userId}</h2>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          Pending
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityBadgeClasses[selectedPriority]}`}>
                          {selectedPriority} Priority
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span>Joined {formatJoinTime(entry.joinTime)}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                      <div>Position requested: {entry.position}</div>
                      <div className="mt-1">Default priority: {entry.priority}</div>
                    </div>
                  </div>

                  <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px] lg:items-stretch">
                    <div className="flex h-64 flex-col rounded-2xl border border-border bg-card p-5">
                      <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Service</p>
                      <h3 className="mt-3 text-lg font-semibold text-foreground">{queue?.service?.name ?? "Unknown service"}</h3>
                      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-2 text-sm leading-6 text-muted-foreground">
                        {queue?.service?.description?.trim() || "No service description is available for this queue."}
                      </div>
                    </div>

                    <div className="flex h-64 flex-col rounded-2xl border border-border bg-muted/30 p-5">
                      <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Patient description</p>
                      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-2 text-sm leading-6 text-foreground">
                        {entry.description?.trim() ? entry.description : "No description was provided for this queue entry."}
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Assign priority</p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {priorityOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handlePriorityChange(entry, option)}
                              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${selectedPriority === option
                                ? "border-accent bg-accent text-white"
                                : "border-border bg-muted/40 text-foreground hover:bg-muted"
                                }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                        Confirming this review will move the entry from pending to waiting so it becomes part of the live queue.
                      </div>

                      <Button
                        variant="success"
                        className="w-full"
                        onClick={() => handleConfirm(entry)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Confirming..." : "Confirm and move to waiting"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="surface-card py-20 text-center text-muted-foreground">
              <p className="text-2xl text-foreground">No pending queue entries</p>
              <p className="mt-2 text-sm">New queue submissions will appear here for admin review before they enter the waiting list.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
