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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="p-5 flex justify-between items-start border-b border-gray-50">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${priorityColors[priority]}`}>
                    {priority} Priority
                </span>
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                    {isOpen ? 'Open' : 'Closed'}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col items-center text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1" title={serviceName}>
                    {serviceName}
                </h3>
                <p className="text-sm text-gray-500 mb-6 line-clamp-2 h-10">
                    {queue.service?.description}
                </p>

                <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-primary tracking-tight">{waitingCount}</span>
                    <span className="text-sm font-medium text-gray-400">waiting</span>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 grid grid-cols-2 gap-3 mt-auto">
                <button
                    onClick={() => onToggleStatus?.(queue.id, queue.status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${isOpen
                        ? 'bg-white border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-100'
                        : 'bg-white border-gray-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100'
                        }`}
                >
                    {isOpen ? 'Stop Queue' : 'Start Queue'}
                </button>
                <button
                    onClick={() => onViewDetails?.(queue.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                >
                    Manage
                </button>
            </div>
        </div>
    );
};
