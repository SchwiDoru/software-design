import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../admin/AdminLayout";
import { QueueCard } from "../../admin/QueueCard";
import { Button } from "../../ui/Button";
import { ServiceFormModal } from "../../admin/ServiceFormModal";
import type { Queue, QueueEntry, QueueStatus, Service } from "../../../types";

type ActionMessage = { type: "success" | "error"; text: string };

const extractApiErrorMessage = async (response: Response, fallbackMessage: string) => {
  const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;
  if (payload && payload.error && payload.error.trim().length > 0) return payload.error;
  if (payload && payload.message && payload.message.trim().length > 0) return payload.message;
  return fallbackMessage;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [savedQueueStatuses, setSavedQueueStatuses] = useState<Record<number, QueueStatus>>({});
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [pendingQueueStatuses, setPendingQueueStatuses] = useState<Record<number, QueueStatus>>({});
  const [isApplyingQueueStatus, setIsApplyingQueueStatus] = useState(false);
  const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchQueues = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/queue`);

        if (response.status === 204) {
          if (!isCancelled) {
            setQueues([]);
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: Queue[] = await response.json();
        if (!isCancelled) {
          setQueues(data);
          setSavedQueueStatuses(
            data.reduce<Record<number, QueueStatus>>((statuses, queue) => {
              statuses[queue.id] = queue.status;
              return statuses;
            }, {})
          );
        }
      } catch (error) {
        console.error("Error fetching queues:", error);
        if (!isCancelled) {
          setActionMessage({
            type: "error",
            text: "Unable to load queues right now."
          });
          setQueues([]);
          setSavedQueueStatuses({});
        }
      }
    };
    const fetchQueueEntries = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/queueentry`);

        if (response.status === 204) {
          if (!isCancelled) {
            setEntries([]);
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (!isCancelled) {
          setEntries(data);
        }
      } catch (error) {
        console.error("Error fetching queue entries:", error);
        if (!isCancelled) {
          setActionMessage({
            type: "error",
            text: "Unable to load queue entries right now."
          });
          setEntries([]);
        }
      }
    };

    const loadDashboard = async () => {
      await Promise.all([fetchQueues(), fetchQueueEntries()]);
    };

    void loadDashboard();
    const timer = window.setInterval(() => {
      void loadDashboard();
    }, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const getWaitingCount = (queueId: number) => {
    return entries.filter((entry) => entry.queueId === queueId && entry.status === "Waiting").length;
  };

  const handleToggleStatus = (queueId: number, currentStatus: string) => {
    const nextStatus: QueueStatus = currentStatus === "Open" ? "Closed" : "Open";

    setQueues((previous) =>
      previous.map((queue) =>
        queue.id === queueId
          ? { ...queue, status: nextStatus }
          : queue
      )
    );

    setPendingQueueStatuses((previous) => {
      const originalStatus = savedQueueStatuses[queueId];

      if (originalStatus && nextStatus === originalStatus)
      {
        const { [queueId]: _, ...remainingStatuses } = previous;
        return remainingStatuses;
      }

      return {
        ...previous,
        [queueId]: nextStatus
      };
    });
  };

  const handleResetQueueStatusChanges = () => {
    if (!hasPendingQueueStatusChanges) {
      return;
    }

    setQueues((previous) =>
      previous.map((queue) => ({
        ...queue,
        status: savedQueueStatuses[queue.id] ?? queue.status
      }))
    );

    setPendingQueueStatuses({});
  };

  const handleApplyQueueStatusChanges = async () => {
    const queueIds = Object.keys(pendingQueueStatuses);
    if (queueIds.length === 0) {
      return;
    }

    setIsApplyingQueueStatus(true);
    setActionMessage(null);

    try {
      for (const queueId of queueIds) {
        const numericQueueId = Number(queueId);
        const status = pendingQueueStatuses[numericQueueId];

        const response = await fetch(`${import.meta.env.VITE_API_URL}/queue/${numericQueueId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status: status satisfies QueueStatus })
        });

        if (!response.ok) {
          const errorMessage = await extractApiErrorMessage(
            response,
            `Failed to update queue ${numericQueueId} status`
          );
          throw new Error(errorMessage);
        }
      }

      setSavedQueueStatuses((previous) => ({
        ...previous,
        ...pendingQueueStatuses
      }));
      setPendingQueueStatuses({});
      setActionMessage({
        type: "success",
        text: "Queue status changes applied successfully"
      });
    } catch (error) {
      console.error("Error applying queue status changes:", error);
      setActionMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to apply queue status changes. Please try again."
      });
    } finally {
      setIsApplyingQueueStatus(false);
    }
  };

  const handleViewDetails = (queueId: number) => {
    window.location.href = `/admin/queue?id=${queueId}`;
  };

  const handleOpenCreateModal = () => {
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setEditingService(service);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (serviceData: Partial<Service>) => {
    setActionMessage(null);

    if (editingService) {
      try {
        const serviceResponse = await fetch(`${import.meta.env.VITE_API_URL}/service/${editingService.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: serviceData.name ?? editingService.name,
            description: serviceData.description ?? editingService.description,
            duration: serviceData.duration ?? editingService.duration,
            priority: serviceData.priority ?? editingService.priority,
          }),
        });

        if (!serviceResponse.ok) {
          const errorMessage = await extractApiErrorMessage(
            serviceResponse,
            "Failed to update service"
          );
          throw new Error(errorMessage);
        }

        const updatedService = await serviceResponse.json();

        setQueues((previous) =>
          previous.map((queue) => {
            if (queue.service && queue.service.id === editingService.id) {
              return {
                ...queue,
                service: {
                  ...queue.service,
                  ...updatedService,
                } as Service,
              };
            }
            return queue;
          })
        );

        setEditingService(null);
        setActionMessage({
          type: "success",
          text: `Service "${updatedService.name}" updated successfully`
        });
      } catch (error) {
        console.error("Error updating service:", error);
        setActionMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Failed to update service. Please try again."
        });
        return;
      }
    } else {
      try {
        // Step 1: Create the service
        const serviceResponse = await fetch(`${import.meta.env.VITE_API_URL}/service`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: serviceData.name || "New Service",
            description: serviceData.description || "",
            duration: serviceData.duration || 15,
            priority: serviceData.priority || "Medium",
          }),
        });

        if (!serviceResponse.ok) {
          const errorMessage = await extractApiErrorMessage(
            serviceResponse,
            "Failed to create service"
          );
          throw new Error(errorMessage);
        }

        const createdService = await serviceResponse.json();

        // Step 2: Create the queue with the new service ID
        const queueResponse = await fetch(`${import.meta.env.VITE_API_URL}/queue`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "Open" satisfies QueueStatus,
            serviceId: createdService.id,
          }),
        });

        if (!queueResponse.ok) {
          const errorMessage = await extractApiErrorMessage(
            queueResponse,
            "Failed to create queue"
          );
          throw new Error(errorMessage);
        }

        const createdQueue = await queueResponse.json();

        // Step 3: Add the new queue to state
        setQueues((previous) => [...previous, createdQueue]);
        setActionMessage({
          type: "success",
          text: `Service "${createdService.name}" created successfully`
        });
      } catch (error) {
        console.error("Error creating service and queue:", error);
        setActionMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Failed to create service. Please try again."
        });
      }
    }

    setIsServiceModalOpen(false);
  };

  const totalWaiting = entries.filter((entry) => entry.status === "Waiting").length;
  const totalPending = entries.filter((entry) => entry.status === "Pending").length;
  const openQueues = queues.filter((queue) => savedQueueStatuses[queue.id] === "Open").length;
  const hasPendingQueueStatusChanges = Object.keys(pendingQueueStatuses).length > 0;

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-7xl pb-20">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="section-label mb-4">
              <span className="section-label-dot" />
              <span className="section-label-text">Admin Overview</span>
            </div>
            <h1 className="text-4xl leading-tight text-foreground sm:text-5xl">
              Clinic operations <span className="gradient-text">dashboard</span>
            </h1>
            <p className="mt-2 text-muted-foreground">Manage queue status, services, and live patient flow.</p>
          </div>
          <Button variant="primary" onClick={handleOpenCreateModal} className="w-full sm:w-auto">
            + New Service
          </Button>
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

        <div className="mb-6 flex flex-col justify-end gap-3 sm:flex-row">
          <Button
            variant="secondary"
            onClick={handleResetQueueStatusChanges}
            disabled={!hasPendingQueueStatusChanges || isApplyingQueueStatus}
            className="w-full sm:w-auto"
          >
            Reset Changes
          </Button>
          <Button
            variant="primary"
            onClick={handleApplyQueueStatusChanges}
            disabled={!hasPendingQueueStatusChanges || isApplyingQueueStatus}
            className="w-full sm:w-auto"
          >
            {isApplyingQueueStatus ? "Applying Changes..." : "Apply Changes"}
          </Button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="surface-card p-5 text-left transition-colors hover:bg-muted/40"
          >
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Services</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{queues.length}</p>
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/queue")}
            className="surface-card p-5 text-left transition-colors hover:bg-muted/40"
          >
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Open Queues</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{openQueues}</p>
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/queue")}
            className="surface-card p-5 text-left transition-colors hover:bg-muted/40"
          >
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Patients Waiting</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{totalWaiting}</p>
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/pending")}
            className="surface-card p-5 text-left transition-colors hover:bg-muted/40"
          >
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Pending Patients</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{totalPending}</p>
          </button>
        </div>

        <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {queues.map((queue) => (
            <QueueCard
              key={queue.id}
              queue={queue}
              waitingCount={getWaitingCount(queue.id)}
              onToggleStatus={handleToggleStatus}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>

        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 p-6">
            <h2 className="text-3xl text-foreground">Available Services</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-muted/80 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                <tr>
                  <th className="border-b border-border p-4 font-medium">Service Name</th>
                  <th className="hidden border-b border-border p-4 font-medium md:table-cell">Description</th>
                  <th className="border-b border-border p-4 text-center font-medium">Duration</th>
                  <th className="border-b border-border p-4 text-center font-medium">Priority</th>
                  <th className="border-b border-border p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queues.map((queue) => {
                  const service = queue.service!;
                  return (
                    <tr key={service.id} className="transition-colors hover:bg-muted/50">
                      <td className="p-4 font-medium text-foreground">{service.name}</td>
                      <td className="hidden p-4 text-sm text-muted-foreground md:table-cell">{service.description}</td>
                      <td className="p-4 text-center text-sm text-muted-foreground">{service.duration} min</td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${service.priority === "High"
                              ? "bg-red-50 text-red-700"
                              : service.priority === "Medium"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                        >
                          {service.priority}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenEditModal(service)}
                          className="rounded-lg px-3 py-1 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ServiceFormModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSubmit={handleSaveService}
        initialData={editingService || undefined}
      />
    </AdminLayout>
  );
}