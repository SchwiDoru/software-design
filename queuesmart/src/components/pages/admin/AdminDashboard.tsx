import { useState } from 'react';
import AdminLayout from '../../admin/AdminLayout';
import { QueueCard } from '../../admin/QueueCard';
import { Button } from '../../ui/Button';
import { ServiceFormModal } from '../../admin/ServiceFormModal';
import type { Queue, Service } from '../../../types';

import { MOCK_QUEUES, MOCK_ENTRIES } from '../../../data/mockData';

export default function AdminDashboard() {
    const [queues, setQueues] = useState<Queue[]>(MOCK_QUEUES);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    const getWaitingCount = (queueId: number) => {
        return MOCK_ENTRIES.filter(entry => entry.queueId === queueId && entry.status === 'waiting').length;
    };

    const handleToggleStatus = (queueId: number, currentStatus: string) => {
        setQueues(prev => prev.map(q =>
            q.id === queueId
                ? { ...q, status: currentStatus === 'open' ? 'closed' : 'open' }
                : q
        ));
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
            // Update existing service in the queue(s)
            setQueues(prev => prev.map(q => {
                // Assuming 1:1 mapping of Queue to Service for this demo
                // If the queue holds the service being edited, update it.
                if (q.service && q.service.id === editingService.id) {
                    return {
                        ...q,
                        service: {
                            ...q.service,
                            ...serviceData
                        } as Service
                    };
                }
                return q;
            }));
            setEditingService(null);
        } else {
            // Create New Service -> Also creates a new Queue in this simplified model
            const newServiceId = Date.now() + 100;
            const newQueue: Queue = {
                id: Date.now(),
                serviceId: newServiceId,
                status: 'open',
                createdAt: new Date().toISOString(),
                service: {
                    id: newServiceId,
                    name: serviceData.name || 'New Service',
                    description: serviceData.description || '',
                    durationMinutes: serviceData.durationMinutes || 15,
                    priority: serviceData.priority || 'Medium'
                }
            };
            setQueues(prev => [...prev, newQueue]);
        }
        setIsServiceModalOpen(false);
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto pb-20">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main">Admin Dashboard</h1>
                        <p className="text-text-muted mt-1">Manage your clinic's services and flow</p>
                    </div>
                    <Button variant="primary" onClick={handleOpenCreateModal}>
                        + New Service
                    </Button>
                </div>

                {/* Queue Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {queues.map(queue => (
                        <QueueCard
                            key={queue.id}
                            queue={queue}
                            waitingCount={getWaitingCount(queue.id)}
                            onToggleStatus={handleToggleStatus}
                            onViewDetails={handleViewDetails}
                        />
                    ))}
                </div>

                {/* Service Management List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Available Services</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 font-semibold border-b border-gray-100">Service Name</th>
                                    <th className="p-4 font-semibold border-b border-gray-100 hidden md:table-cell">Description</th>
                                    <th className="p-4 font-semibold border-b border-gray-100 text-center">Duration</th>
                                    <th className="p-4 font-semibold border-b border-gray-100 text-center">Priority</th>
                                    <th className="p-4 font-semibold border-b border-gray-100 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {queues.map(queue => {
                                    const service = queue.service!;
                                    return (
                                        <tr key={service.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="p-4 font-medium text-gray-900">
                                                {service.name}
                                            </td>
                                            <td className="p-4 text-sm text-gray-500 max-w-xs truncate hidden md:table-cell">
                                                {service.description}
                                            </td>
                                            <td className="p-4 text-sm text-gray-500 text-center">
                                                {service.durationMinutes} min
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${service.priority === 'High' ? 'bg-red-50 text-red-700' :
                                                        service.priority === 'Medium' ? 'bg-amber-50 text-amber-700' :
                                                            'bg-blue-50 text-blue-700'}`}>
                                                    {service.priority}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleOpenEditModal(service)}
                                                    className="text-primary hover:text-primary-dark font-medium text-sm px-3 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
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
