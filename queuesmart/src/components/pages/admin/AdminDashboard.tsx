import { useEffect, useState } from "react";
import AdminLayout from "../../admin/AdminLayout";
import { QueueCard } from "../../admin/QueueCard";
import { Button } from "../../ui/Button";
import { ServiceFormModal } from "../../admin/ServiceFormModal";
import type { Queue, QueueEntry, Service } from "../../../types";
import { readQueueEntries } from "../../../data/queueStore";

export default function AdminDashboard() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [entries] = useState<QueueEntry[]>(readQueueEntries);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/queue`);
        
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

  const getWaitingCount = (queueId: number) => {
    return entries.filter((entry) => entry.queueId === queueId && entry.status === "Waiting").length;
  };

  const handleToggleStatus = (queueId: number, currentStatus: string) => {
    setQueues((previous) =>
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

  const handleSaveService = async (serviceData: Partial<Service>) => {
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
          throw new Error(`Failed to update service: ${serviceResponse.status}`);
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
      } catch (error) {
        console.error("Error updating service:", error);
        alert("Failed to update service. Please try again.");
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
          throw new Error(`Failed to create service: ${serviceResponse.status}`);
        }

        const createdService = await serviceResponse.json();

        // Step 2: Create the queue with the new service ID
        const queueResponse = await fetch(`${import.meta.env.VITE_API_URL}/queue`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "Open",
            serviceId: createdService.id,
          }),
        });

        if (!queueResponse.ok) {
          throw new Error(`Failed to create queue: ${queueResponse.status}`);
        }

        const createdQueue = await queueResponse.json();

        // Step 3: Add the new queue to state
        setQueues((previous) => [...previous, createdQueue]);
      } catch (error) {
        console.error("Error creating service and queue:", error);
        alert("Failed to create service. Please try again.");
      }
    }

    setIsServiceModalOpen(false);
  };

  const totalWaiting = entries.filter((entry) => entry.status === "Waiting").length;
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
