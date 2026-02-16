import { useEffect, useState } from "react";
import AdminLayout from "../../admin/AdminLayout";
import { QueueCard } from "../../admin/QueueCard";
import { Button } from "../../ui/Button";
import { ServiceFormModal } from "../../admin/ServiceFormModal";
import type { Queue, QueueEntry, Service } from "../../../types";
import { readQueueEntries, readQueues, subscribeQueueStore, writeQueues } from "../../../data/queueStore";

export default function AdminDashboard() {
  const [queues, setQueues] = useState<Queue[]>(readQueues);
  const [entries, setEntries] = useState<QueueEntry[]>(readQueueEntries);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    return subscribeQueueStore(() => {
      setQueues(readQueues());
      setEntries(readQueueEntries());
    });
  }, []);

  const getWaitingCount = (queueId: number) => {
    return entries.filter((entry) => entry.queueId === queueId && entry.status === "waiting").length;
  };

  const updateQueues = (updater: (previous: Queue[]) => Queue[]) => {
    setQueues((previous) => {
      const next = updater(previous);
      writeQueues(next);
      return next;
    });
  };

  const handleToggleStatus = (queueId: number, currentStatus: string) => {
    updateQueues((previous) =>
      previous.map((queue) =>
        queue.id === queueId
          ? { ...queue, status: currentStatus === "open" ? "closed" : "open" }
          : queue
      )
    );
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

  const handleSaveService = (serviceData: Partial<Service>) => {
    if (editingService) {
      updateQueues((previous) =>
        previous.map((queue) => {
          if (queue.service && queue.service.id === editingService.id) {
            return {
              ...queue,
              service: {
                ...queue.service,
                ...serviceData
              } as Service
            };
          }
          return queue;
        })
      );
      setEditingService(null);
    } else {
      const newServiceId = Date.now() + 100;
      const newQueue: Queue = {
        id: Date.now(),
        serviceId: newServiceId,
        status: "open",
        createdAt: new Date().toISOString(),
        service: {
          id: newServiceId,
          name: serviceData.name || "New Service",
          description: serviceData.description || "",
          durationMinutes: serviceData.durationMinutes || 15,
          priority: serviceData.priority || "Medium"
        }
      };

      updateQueues((previous) => [...previous, newQueue]);
    }

    setIsServiceModalOpen(false);
  };

  const totalWaiting = entries.filter((entry) => entry.status === "waiting").length;
  const openQueues = queues.filter((queue) => queue.status === "open").length;

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

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="surface-card p-5">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Total Services</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{queues.length}</p>
          </div>
          <div className="surface-card p-5">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Open Queues</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{openQueues}</p>
          </div>
          <div className="surface-card p-5">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Patients Waiting</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{totalWaiting}</p>
          </div>
          <div className="surface-card p-5">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Notifications</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{openQueues > 0 ? openQueues : 0}</p>
          </div>
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
                      <td className="p-4 text-center text-sm text-muted-foreground">{service.durationMinutes} min</td>
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
