import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import AdminLayout from "../../admin/AdminLayout";
import { Button } from "../../ui/Button";
import type { Queue, QueueEntry } from "../../../types";
import { readQueueEntries, readQueues, subscribeQueueStore, writeQueueEntries } from "../../../data/queueStore";

export default function QueueManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedQueueId, setSelectedQueueId] = useState<number | null>(null);
  const [queues, setQueues] = useState<Queue[]>(readQueues);
  const [entries, setEntries] = useState<QueueEntry[]>(readQueueEntries);

  useEffect(() => {
    return subscribeQueueStore(() => {
      setQueues(readQueues());
      setEntries(readQueueEntries());
    });
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
      const next = updater(previous);
      writeQueueEntries(next);
      return next;
    });
  };

  const handleSelectQueue = (id: number) => {
    setSelectedQueueId(id);
    setSearchParams({ id: id.toString() });
  };

  const currentQueueEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.queueId === selectedQueueId && entry.status === "waiting")
      .sort((a, b) => a.position - b.position);
  }, [entries, selectedQueueId]);

  const selectedQueue = queues.find((queue) => queue.id === selectedQueueId);

  const handleServeNext = () => {
    if (!selectedQueueId || currentQueueEntries.length === 0) {
      return;
    }

    const nextUser = currentQueueEntries[0];
    if (!window.confirm(`Serve next patient: ${nextUser.user?.name}?`)) {
      return;
    }

    updateEntries((previous) => {
      const filtered = previous.filter((entry) => entry.userId !== nextUser.userId);
      const otherQueues = filtered.filter((entry) => entry.queueId !== selectedQueueId);
      const thisQueue = filtered
        .filter((entry) => entry.queueId === selectedQueueId)
        .sort((a, b) => a.position - b.position)
        .map((item, index) => ({ ...item, position: index + 1 }));

      return [...otherQueues, ...thisQueue];
    });
  };

  const handleRemoveUser = (userId: number) => {
    if (!selectedQueueId || !window.confirm("Are you sure you want to remove this user from the queue?")) {
      return;
    }

    updateEntries((previous) => {
      const filtered = previous.filter((entry) => entry.userId !== userId);
      const otherQueues = filtered.filter((entry) => entry.queueId !== selectedQueueId);
      const thisQueue = filtered
        .filter((entry) => entry.queueId === selectedQueueId)
        .sort((a, b) => a.position - b.position)
        .map((item, index) => ({ ...item, position: index + 1 }));

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
        .filter((entry) => entry.queueId === selectedQueueId && entry.status === "waiting")
        .sort((a, b) => a.position - b.position);
      const [movedItem] = queueItems.splice(sourceIndex, 1);
      queueItems.splice(destinationIndex, 0, movedItem);

      const updatedQueueItems = queueItems.map((item, index) => ({
        ...item,
        position: index + 1
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
              const waitingCount = entries.filter((entry) => entry.queueId === queue.id && entry.status === "waiting").length;
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
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${queue.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
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
                    <span>Duration: {selectedQueue.service?.durationMinutes} min</span>
                    <span className="hidden md:inline">|</span>
                    <span>Priority: {selectedQueue.service?.priority}</span>
                    <span className="hidden md:inline">|</span>
                    <span>{currentQueueEntries.length} waiting</span>
                  </div>
                </div>
                <Button
                  variant="success"
                  onClick={handleServeNext}
                  disabled={currentQueueEntries.length === 0}
                  className="w-full md:w-auto"
                >
                  Serve Next Patient
                </Button>
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
                                    {entry.position}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <h4 className="truncate font-semibold text-foreground">{entry.user?.name}</h4>
                                    <p className="truncate text-sm text-muted-foreground">{entry.user?.email}</p>
                                  </div>

                                  <div className="hidden text-right text-sm text-muted-foreground md:block">
                                    <div>{new Date(entry.joinTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
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
