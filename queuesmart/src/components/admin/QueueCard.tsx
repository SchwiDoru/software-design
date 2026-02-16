import React from 'react';
import type { Queue } from '../../types';


interface QueueCardProps {
    queue: Queue;
    waitingCount?: number;
    onToggleStatus?: (queueId: number, currentStatus: string) => void;
    onViewDetails?: (queueId: number) => void;
}

export const QueueCard: React.FC<QueueCardProps> = ({ queue, waitingCount = 0, onToggleStatus, onViewDetails }) => {
    const isOpen = queue.status === 'open';
    const serviceName = queue.service?.name || 'Unknown Service';
    const priority = queue.service?.priority || 'Medium';

    const priorityColors = {
        High: "bg-red-50 text-red-700 border-red-100",
        Medium: "bg-amber-50 text-amber-700 border-amber-100",
        Low: "bg-blue-50 text-blue-700 border-blue-100"
    };

    return (
        <div className="surface-card surface-card-hover flex h-full flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border p-5">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priorityColors[priority]}`}>
                    {priority} Priority
                </span>
                <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'
                    }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    {isOpen ? 'Open' : 'Closed'}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col items-center p-6 text-center">
                <h3 className="mb-1 text-xl font-semibold text-foreground" title={serviceName}>
                    {serviceName}
                </h3>
                <p className="mb-6 min-h-10 text-sm text-muted-foreground">
                    {queue.service?.description}
                </p>

                <div className="mb-2 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight text-accent">{waitingCount}</span>
                    <span className="text-sm font-medium text-muted-foreground">waiting</span>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-auto grid grid-cols-1 gap-3 border-t border-border bg-muted/40 p-4 sm:grid-cols-2">
                <button
                    onClick={() => onToggleStatus?.(queue.id, queue.status)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${isOpen
                        ? 'border-border bg-white text-red-600 hover:border-red-100 hover:bg-red-50'
                        : 'border-border bg-white text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50'
                        }`}
                >
                    {isOpen ? 'Stop Queue' : 'Start Queue'}
                </button>
                <button
                    onClick={() => onViewDetails?.(queue.id)}
                    className="rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-4 py-2 text-sm font-medium text-white shadow-[0_4px_14px_rgba(0,82,255,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                >
                    Manage
                </button>
            </div>
        </div>
    );
};
