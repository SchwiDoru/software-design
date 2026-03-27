import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../admin/AdminLayout";
import { Button } from "../../ui/Button";
import type { Priority, Queue, QueueEntry } from "../../../types";

const priorityOptions: Priority[] = ["High", "Medium", "Low"];

type ReviewValues = Record<string, Priority>;
type SubmitState = Record<string, boolean>;
type ActionMessage = { type: "success" | "error"; text: string };

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

const extractApiErrorMessage = async (response: Response, fallbackMessage: string) => {
  const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;
  if (payload && payload.error && payload.error.trim().length > 0) return payload.error;
  if (payload && payload.message && payload.message.trim().length > 0) return payload.message;
  return fallbackMessage;
};

export default function PendingQueueEntries() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<number | null>(null);
  const [reviewValues, setReviewValues] = useState<ReviewValues>({});
  const [submitState, setSubmitState] = useState<SubmitState>({});
  const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      if (!isCancelled) {
        setIsLoading(true);
        setActionMessage(null);
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
          setActionMessage({
            type: "error",
            text: "Unable to load pending queue entries right now."
          });
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

  const queuesWithPending = useMemo(() => {
    return queues
      .map((queue) => {
        const queueEntries = pendingEntries.filter((entry) => entry.queueId === queue.id);
        return {
          queue,
          pendingCount: queueEntries.length,
          oldestJoinTime: queueEntries[0]?.joinTime
        };
      })
      .filter((item) => item.pendingCount > 0)
      .sort((left, right) => {
        const leftTime = left.oldestJoinTime ? new Date(left.oldestJoinTime).getTime() : Number.MAX_SAFE_INTEGER;
        const rightTime = right.oldestJoinTime ? new Date(right.oldestJoinTime).getTime() : Number.MAX_SAFE_INTEGER;
        return leftTime - rightTime;
      });
  }, [queues, pendingEntries]);

  useEffect(() => {
    if (queuesWithPending.length === 0) {
      setSelectedQueueId(null);
      return;
    }

    const selectedStillExists = selectedQueueId
      ? queuesWithPending.some((item) => item.queue.id === selectedQueueId)
      : false;

    if (!selectedStillExists) {
      setSelectedQueueId(queuesWithPending[0].queue.id);
    }
  }, [queuesWithPending, selectedQueueId]);

  const selectedPendingEntries = useMemo(() => {
    if (!selectedQueueId) return [];
    return pendingEntries.filter((entry) => entry.queueId === selectedQueueId);
  }, [pendingEntries, selectedQueueId]);

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
    setActionMessage(null);

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
        const errorMessage = await extractApiErrorMessage(
          response,
          `Failed to confirm ${entry.user?.name ?? entry.userId}`
        );
        throw new Error(errorMessage);
      }

      const updatedEntry: QueueEntry = await response.json();

      setEntries((previous) => previous.map((item) => {
        if (item.id === entry.id) {
          return updatedEntry;
        }

        return item;
      }));

      setActionMessage({
        type: "success",
        text: `${entry.user?.name ?? "Entry"} confirmed and moved to waiting queue`
      });
      setReviewValues((previous) => {
        const updated = { ...previous };
        delete updated[key];
        return updated;
      });
    } catch (error) {
      console.error("Error confirming queue entry:", error);
      setActionMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to confirm entry right now."
      });
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
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Pending Entries</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{pendingEntries.length}</p>
            </div>
            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
              Needs review
            </div>
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

        <div className="space-y-5">
          {isLoading ? (
            <div className="surface-card py-20 text-center text-muted-foreground">Loading pending queue entries...</div>
          ) : pendingEntries.length > 0 ? (
            <div className="flex flex-col gap-6 xl:flex-row">
              <aside className="surface-card h-fit xl:sticky xl:top-24 xl:w-80">
                <div className="border-b border-border p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Queues with pending</p>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">Select a queue</h2>
                </div>
                <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
                  {queuesWithPending.map(({ queue, pendingCount, oldestJoinTime }) => {
                    const isSelected = selectedQueueId === queue.id;

                    return (
                      <button
                        key={queue.id}
                        type="button"
                        onClick={() => setSelectedQueueId(queue.id)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                          isSelected
                            ? "border-accent bg-accent/10 shadow-sm"
                            : "border-transparent bg-muted/40 hover:border-border hover:bg-muted"
                        }`}
                      >
                        <p className="font-semibold text-foreground">{queue.service?.name ?? "Unknown queue"}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{pendingCount} pending</span>
                          <span>Oldest {oldestJoinTime ? formatJoinTime(oldestJoinTime) : "N/A"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <section className="min-w-0 flex-1 space-y-5">
                <div className="surface-card flex flex-col gap-2 p-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Selected queue</p>
                    <h2 className="mt-2 text-2xl font-semibold text-foreground">
                      {selectedQueueId !== null ? (queueLookup.get(selectedQueueId)?.service?.name ?? "Choose a queue") : "Choose a queue"}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedPendingEntries.length} pending request{selectedPendingEntries.length === 1 ? "" : "s"}
                  </p>
                </div>

                {selectedPendingEntries.map((entry) => {
                  const key = getEntryKey(entry);
                  const selectedPriority = reviewValues[key] ?? entry.priority;
                  const queue = queueLookup.get(entry.queueId);
                  const isSubmitting = submitState[key] ?? false;

                  return (
                    <article key={key} className="surface-card overflow-hidden">
                      <div className="space-y-6 p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Patient Name</p>
                            <h3 className="mt-2 text-4xl font-bold text-foreground">{entry.user?.name ?? entry.userId}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">{entry.user?.email}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              Pending
                            </span>
                            <span className="text-xs text-muted-foreground">Requested {formatJoinTime(entry.joinTime)}</span>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-muted/40 p-5">
                          <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Patient Description</p>
                          <p className="mt-3 text-base leading-6 text-foreground">
                            {entry.description?.trim() ? entry.description : "No description was provided for this request."}
                          </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-border bg-card p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Service Description</p>
                            <p className="mt-3 text-sm leading-6 text-foreground">
                              {queue?.service?.description?.trim() || "No service description available."}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-border bg-card p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Assign Priority</p>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {priorityOptions.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => handlePriorityChange(entry, option)}
                                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                    selectedPriority === option
                                      ? "border-accent bg-accent text-white"
                                      : "border-border bg-muted/40 text-foreground hover:bg-muted"
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            variant="success"
                            className="flex-1"
                            onClick={() => handleConfirm(entry)}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Confirming..." : "Approve & Move to Queue"}
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            </div>
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