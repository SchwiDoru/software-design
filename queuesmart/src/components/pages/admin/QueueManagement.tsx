import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import AdminLayout from "../../admin/AdminLayout";
import { Button } from "../../ui/Button";
import type { Queue, QueueEntry, QueueEntryStatus } from "../../../types";

type QueueOrderSnapshot = {
  userId: string;
  position: number;
};

const createQueueOrderSnapshots = (queueEntries: QueueEntry[]) => {
  return queueEntries.reduce<Record<number, QueueOrderSnapshot[]>>((snapshots, entry) => {
    if (entry.status !== "Waiting") {
      return snapshots;
    }

    const existingSnapshots = snapshots[entry.queueId] ?? [];
    existingSnapshots.push({
      userId: entry.userId,
      position: entry.position
    });
    snapshots[entry.queueId] = existingSnapshots.sort((left, right) => left.position - right.position);

    return snapshots;
  }, {});
};

export default function QueueManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedQueueId, setSelectedQueueId] = useState<number | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [savedQueueOrders, setSavedQueueOrders] = useState<Record<number, QueueOrderSnapshot[]>>({});
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/queue`);
        if (response.status === 204) {
          setQueues([]);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setQueues(data);
      } catch (error) {
        console.error("Error fetching queues:", error);
        setQueues([]);
      }
    };

    fetchQueues();
  }, []);

  useEffect(() => {
    const fetchQueueEntries = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/queueentry`);
        if (response.status === 204) {
          setEntries([]);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setEntries(data);
        setSavedQueueOrders(createQueueOrderSnapshots(data));
      } catch (error) {
        console.error("Error fetching queue entries:", error);
        setEntries([]);
        setSavedQueueOrders({});
      }
    };

    fetchQueueEntries();
  }, []);

  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      setSelectedQueueId(Number(idParam));
      return;
    }

    if (!idParam && queues.length > 0 && selectedQueueId === null) {
      setSelectedQueueId(queues[0].id);
      setSearchParams({ id: queues[0].id.toString() });
    }
  }, [queues, searchParams, selectedQueueId, setSearchParams]);

  const updateEntries = (updater: (previous: QueueEntry[]) => QueueEntry[]) => {
    setEntries((previous) => {
      return updater(previous);
    });
  };

  const handleSelectQueue = (id: number) => {
    setSelectedQueueId(id);
    setSearchParams({ id: id.toString() });
  };

  const currentQueueEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.queueId === selectedQueueId && entry.status === "Waiting")
      .sort((a, b) => a.position - b.position);
  }, [entries, selectedQueueId]);

  const hasPendingReorder = useMemo(() => {
    if (!selectedQueueId) {
      return false;
    }

    const savedOrder = savedQueueOrders[selectedQueueId] ?? [];
    if (savedOrder.length !== currentQueueEntries.length) {
      return false;
    }

    return currentQueueEntries.some((entry, index) => {
      const savedEntry = savedOrder[index];
      return !savedEntry || savedEntry.userId !== entry.userId || savedEntry.position !== entry.position;
    });
  }, [currentQueueEntries, savedQueueOrders, selectedQueueId]);

  useEffect(() => {
    if (!selectedQueueId) {
      return;
    }

    console.log(
      "Current queue entry state positions",
      currentQueueEntries.map((entry) => ({
        userId: entry.userId,
        position: entry.position
      }))
    );
  }, [currentQueueEntries, selectedQueueId]);

  const selectedQueue = queues.find((queue) => queue.id === selectedQueueId);

  const formatJoinTime = (joinTime: string) => {
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
  };

  const priorityBadgeClasses: Record<QueueEntry["priority"], string> = {
    High: "bg-red-50 text-red-700",
    Medium: "bg-amber-50 text-amber-700",
    Low: "bg-emerald-50 text-emerald-700"
  };

  const handleResetOrder = () => {
    if (!selectedQueueId) {
      return;
    }

    const savedOrder = savedQueueOrders[selectedQueueId] ?? [];
    if (savedOrder.length === 0) {
      return;
    }

    const savedPositionsByUserId = new Map(savedOrder.map((entry) => [entry.userId, entry.position]));

    updateEntries((previous) => {
      return previous.map((entry) => {
        if (entry.queueId !== selectedQueueId || entry.status !== "Waiting") {
          return entry;
        }

        const savedPosition = savedPositionsByUserId.get(entry.userId);
        if (savedPosition === undefined) {
          return entry;
        }

        return {
          ...entry,
          position: savedPosition
        };
      });
    });
  };

  const handleConfirmOrder = async () => {
    if (!selectedQueueId || !hasPendingReorder) {
      return;
    }

    setIsSavingOrder(true);

    try {
      const orderedEntries = [...currentQueueEntries].sort((left, right) => left.position - right.position);

      for (const entry of orderedEntries) {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/queueentry/${selectedQueueId}/${encodeURIComponent(entry.userId)}/position`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ position: entry.position })
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      setSavedQueueOrders((previous) => ({
        ...previous,
        [selectedQueueId]: orderedEntries.map((entry) => ({
          userId: entry.userId,
          position: entry.position
        }))
      }));
    } catch (error) {
      console.error("Error saving queue order:", error);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleServeNext = async () => {
    if (!selectedQueueId || currentQueueEntries.length === 0) {
      return;
    }

    const nextUser = currentQueueEntries[0];

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/queueentry/${selectedQueueId}/${encodeURIComponent(nextUser.userId)}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "InProgress" satisfies QueueEntryStatus })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating queue entry status:", error);
      return;
    }

    updateEntries((previous) => {
      const filtered = previous.filter((entry) => !(entry.userId === nextUser.userId && entry.queueId === selectedQueueId));
      const otherQueues = filtered.filter((entry) => entry.queueId !== selectedQueueId);
      const thisQueue = filtered
        .filter((entry) => entry.queueId === selectedQueueId)
        .sort((a, b) => a.position - b.position)
        .map((item, index) => ({ ...item, position: index }));

      return [...otherQueues, ...thisQueue];
    });
  };

  const handleRemoveUser = async (userId: string) => {
    if (!selectedQueueId) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/queueentry/${selectedQueueId}/${encodeURIComponent(userId)}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Removed" satisfies QueueEntryStatus })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error removing user from queue:", error);
      return;
    }

    updateEntries((previous) => {
      const filtered = previous.filter((entry) => !(entry.userId === userId && entry.queueId === selectedQueueId));
      const otherQueues = filtered.filter((entry) => entry.queueId !== selectedQueueId);
      const thisQueue = filtered
        .filter((entry) => entry.queueId === selectedQueueId)
        .sort((a, b) => a.position - b.position)
        .map((item, index) => ({ ...item, position: index }));

      return [...otherQueues, ...thisQueue];
    });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !selectedQueueId) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    updateEntries((previous) => {
      const queueItems = previous
        .filter((entry) => entry.queueId === selectedQueueId && entry.status === "Waiting")
        .sort((a, b) => a.position - b.position);
      const [movedItem] = queueItems.splice(sourceIndex, 1);
      queueItems.splice(destinationIndex, 0, movedItem);

      const updatedQueueItems = queueItems.map((item, index) => ({
        ...item,
        position: index
      }));

      const otherQueueItems = previous.filter((entry) => entry.queueId !== selectedQueueId);
      return [...otherQueueItems, ...updatedQueueItems];
    });
  };

  return (
    <AdminLayout>
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 xl:flex-row">
        <div className="surface-card w-full overflow-hidden xl:w-[340px]">
          <div className="border-b border-border bg-muted/60 p-4">
            <h2 className="text-xl text-foreground">Select Queue</h2>
          </div>
          <div className="max-h-[42vh] space-y-2 overflow-y-auto p-3 xl:max-h-[calc(100vh-220px)]">
            {queues.map((queue) => {
              const waitingCount = entries.filter((entry) => entry.queueId === queue.id && entry.status === "Waiting").length;
              return (
                <button
                  key={queue.id}
                  onClick={() => handleSelectQueue(queue.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${selectedQueueId === queue.id
                      ? "border-accent/30 bg-accent/5 shadow-[0_4px_14px_rgba(0,82,255,0.15)]"
                      : "border-border bg-card hover:bg-muted/50"
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-foreground">{queue.service?.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${queue.status === "Open" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {queue.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{queue.service?.priority} Priority</span>
                    <span>{waitingCount} Waiting</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="surface-card flex min-h-[58vh] flex-1 flex-col overflow-hidden">
          {selectedQueue ? (
            <>
              <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/60 p-5 md:flex-row md:items-center">
                <div>
                  <h2 className="text-3xl text-foreground">{selectedQueue.service?.name}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>Duration: {selectedQueue.service?.duration} min</span>
                    <span className="hidden md:inline">|</span>
                    <span>Priority: {selectedQueue.service?.priority}</span>
                    <span className="hidden md:inline">|</span>
                    <span>{currentQueueEntries.length} waiting</span>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                  <Button
                    variant="secondary"
                    onClick={handleResetOrder}
                    disabled={!hasPendingReorder || isSavingOrder}
                    className="w-full md:w-auto"
                  >
                    Reset Order
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleConfirmOrder}
                    disabled={!hasPendingReorder || isSavingOrder}
                    className="w-full md:w-auto"
                  >
                    {isSavingOrder ? "Saving Order..." : "Confirm Order"}
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleServeNext}
                    disabled={currentQueueEntries.length === 0 || isSavingOrder}
                    className="w-full md:w-auto"
                  >
                    Serve Next Patient
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-muted/30 p-4">
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="queue-list">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {currentQueueEntries.length > 0 ? (
                          currentQueueEntries.map((entry, index) => (
                            <Draggable key={entry.userId.toString()} draggableId={entry.userId.toString()} index={index}>
                              {(draggableProvided, snapshot) => (
                                <div
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  {...draggableProvided.dragHandleProps}
                                  className={`flex items-center gap-4 rounded-xl border bg-card p-4 transition-all ${snapshot.isDragging
                                      ? "border-accent/30 shadow-[0_8px_24px_rgba(0,82,255,0.25)]"
                                      : "border-border hover:border-accent/20"
                                    }`}
                                >
                                  <div className="cursor-grab rounded-lg p-1 text-muted-foreground active:cursor-grabbing">
                                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                                      <circle cx="9" cy="5" r="1" />
                                      <circle cx="9" cy="12" r="1" />
                                      <circle cx="9" cy="19" r="1" />
                                      <circle cx="15" cy="5" r="1" />
                                      <circle cx="15" cy="12" r="1" />
                                      <circle cx="15" cy="19" r="1" />
                                    </svg>
                                  </div>

                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-lg font-semibold text-accent">
                                    {entry.position + 1}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <h4 className="truncate font-semibold text-foreground">{entry.user?.name}</h4>
                                    <p className="truncate text-sm text-muted-foreground">{entry.user?.email}</p>
                                    <span
                                      className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadgeClasses[entry.priority]}`}
                                    >
                                      {entry.priority} Priority
                                    </span>
                                  </div>

                                  <div className="hidden text-right text-sm text-muted-foreground md:block">
                                    <div>{formatJoinTime(entry.joinTime)}</div>
                                    <div>{entry.user?.role}</div>
                                  </div>

                                  <button
                                    onClick={() => handleRemoveUser(entry.userId)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                                    title="Remove from queue"
                                  >
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                                      <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">
                            <p className="text-lg font-medium">No patients in this queue</p>
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
              <p className="text-2xl text-foreground">Select a Queue</p>
              <p className="mt-2 text-sm">Select a queue from the left panel to manage patients.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
