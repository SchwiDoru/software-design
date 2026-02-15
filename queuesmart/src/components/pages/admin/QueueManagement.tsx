import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import AdminLayout from '../../admin/AdminLayout';
import { Button } from '../../ui/Button';
import type { QueueEntry } from '../../../types';

import { MOCK_QUEUES, MOCK_ENTRIES } from '../../../data/mockData';

export default function QueueManagement() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedQueueId, setSelectedQueueId] = useState<number | null>(null);
    const [entries, setEntries] = useState<QueueEntry[]>(MOCK_ENTRIES);

    // Sync URL param with state on mount/change
    useEffect(() => {
        const idParam = searchParams.get('id');
        if (idParam) {
            setSelectedQueueId(Number(idParam));
        }
    }, [searchParams]);

    const handleSelectQueue = (id: number) => {
        setSelectedQueueId(id);
        setSearchParams({ id: id.toString() });
    };

    // Filter entries for current queue
    const currentQueueEntries = entries
        .filter(e => e.queueId === selectedQueueId)
        .sort((a, b) => a.position - b.position);

    const selectedQueue = MOCK_QUEUES.find(q => q.id === selectedQueueId);

    const handleServeNext = () => {
        if (!currentQueueEntries.length) return;
        const nextUser = currentQueueEntries[0];

        if (window.confirm(`Serve next patient: ${nextUser.user?.name}?`)) {
            setEntries(prev => {
                // Remove served user from this queue
                const filtered = prev.filter(e => e.userId !== nextUser.userId);

                // Reorder remaining in this queue
                const otherQueues = filtered.filter(e => e.queueId !== selectedQueueId);
                const thisQueue = filtered.filter(e => e.queueId === selectedQueueId)
                    .sort((a, b) => a.position - b.position)
                    .map((item, index) => ({ ...item, position: index + 1 }));

                return [...otherQueues, ...thisQueue];
            });
        }
    };

    const handleRemoveUser = (userId: number) => {
        if (!window.confirm("Are you sure you want to remove this user from the queue?")) return;

        setEntries(prev => {
            const filtered = prev.filter(e => e.userId !== userId);

            // Reorder remaining in this queue
            const otherQueues = filtered.filter(e => e.queueId !== selectedQueueId);
            const thisQueue = filtered.filter(e => e.queueId === selectedQueueId)
                .sort((a, b) => a.position - b.position)
                .map((item, index) => ({ ...item, position: index + 1 }));

            return [...otherQueues, ...thisQueue];
        });
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination || !selectedQueueId) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) return;

        setEntries(prev => {
            // Get items for current queue
            const queueItems = prev
                .filter(e => e.queueId === selectedQueueId)
                .sort((a, b) => a.position - b.position);

            // Reorder locallay
            const [reorderedItem] = queueItems.splice(sourceIndex, 1);
            queueItems.splice(destinationIndex, 0, reorderedItem);

            // Update positions
            const updatedQueueItems = queueItems.map((item, index) => ({
                ...item,
                position: index + 1
            }));

            // Merge back with other queues
            const otherQueuesItems = prev.filter(e => e.queueId !== selectedQueueId);
            return [...otherQueuesItems, ...updatedQueueItems];
        });
    };

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)]">
                {/* Left Sidebar: List of Queues */}
                <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-bold text-gray-700">Select Queue</h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {MOCK_QUEUES.map(queue => (
                            <button
                                key={queue.id}
                                onClick={() => handleSelectQueue(queue.id)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedQueueId === queue.id
                                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                                    : 'bg-white border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold text-gray-800">{queue.service?.name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${queue.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {queue.status}
                                    </span>
                                </div>
                                <div className="mt-1 flex justify-between text-xs text-gray-500">
                                    <span>{queue.service?.priority} Priority</span>
                                    <span>{entries.filter(e => e.queueId === queue.id).length} Waiting</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Selected Queue Details */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    {selectedQueue ? (
                        <>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedQueue.service?.name}</h2>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                        <span>Duration: {selectedQueue.service?.durationMinutes} min</span>
                                        <span>•</span>
                                        <span>Priority: {selectedQueue.service?.priority}</span>
                                    </div>
                                </div>
                                <div>
                                    <Button
                                        variant="success"
                                        onClick={handleServeNext}
                                        disabled={currentQueueEntries.length === 0}
                                    >
                                        Serve Next Patient
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto bg-gray-50/50 p-4">
                                <DragDropContext onDragEnd={onDragEnd}>
                                    <Droppable droppableId="queue-list">
                                        {(provided) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className="space-y-3"
                                            >
                                                {currentQueueEntries.length > 0 ? (
                                                    currentQueueEntries.map((entry, index) => (
                                                        <Draggable
                                                            key={entry.userId.toString()}
                                                            draggableId={entry.userId.toString()}
                                                            index={index}
                                                        >
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4 transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary ring-opacity-50 z-50' : 'border-gray-200 hover:border-blue-300'
                                                                        }`}
                                                                    style={{
                                                                        ...provided.draggableProps.style,
                                                                        left: "auto !important",
                                                                        top: "auto !important"
                                                                    }}
                                                                >
                                                                    {/* Drag Handle Icon */}
                                                                    <div className="text-gray-400 cursor-grab active:cursor-grabbing p-1">
                                                                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                                            <circle cx="9" cy="5" r="1" />
                                                                            <circle cx="9" cy="12" r="1" />
                                                                            <circle cx="9" cy="19" r="1" />
                                                                            <circle cx="15" cy="5" r="1" />
                                                                            <circle cx="15" cy="12" r="1" />
                                                                            <circle cx="15" cy="19" r="1" />
                                                                        </svg>
                                                                    </div>

                                                                    {/* Position Badge */}
                                                                    <div className="shrink-0 w-10 h-10 rounded-full bg-blue-50 text-primary font-bold flex items-center justify-center text-lg">
                                                                        {entry.position}
                                                                    </div>

                                                                    {/* Use Info */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-semibold text-gray-900 truncate">{entry.user?.name}</h4>
                                                                        <p className="text-sm text-gray-500 truncate">{entry.user?.email}</p>
                                                                    </div>

                                                                    {/* Meta Info */}
                                                                    <div className="text-right text-sm text-gray-500 hidden sm:block">
                                                                        <div>By {entry.user?.role}</div>
                                                                        <div>{new Date(entry.joinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                                    </div>

                                                                    {/* Actions */}
                                                                    <div className="border-l pl-4 ml-2">
                                                                        <button
                                                                            onClick={() => handleRemoveUser(entry.userId)}
                                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                                            title="Remove from queue"
                                                                        >
                                                                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M18 6L6 18M6 6l12 12" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-20 text-gray-400 bg-white rounded-lg border border-dashed border-gray-300">
                                                        <p className="text-lg">No patients in this queue</p>
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
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </div>
                            <p className="text-xl font-medium text-gray-600">Select a Queue</p>
                            <p className="text-sm mt-2 text-gray-500">Select a queue from the sidebar to manage patients.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
