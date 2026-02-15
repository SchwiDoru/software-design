import type { Queue, QueueEntry } from '../types';

export const MOCK_QUEUES: Queue[] = [
    {
        id: 1,
        serviceId: 101,
        status: 'open',
        createdAt: new Date().toISOString(),
        service: {
            id: 101,
            name: 'General Consultation',
            description: 'Standard check-up with a GP',
            durationMinutes: 15,
            priority: 'Medium'
        }
    },
    {
        id: 2,
        serviceId: 102,
        status: 'closed',
        createdAt: new Date().toISOString(),
        service: {
            id: 102,
            name: 'Emergency Room',
            description: 'Urgent care for critical conditions',
            durationMinutes: 30,
            priority: 'High'
        }
    },
    {
        id: 3,
        serviceId: 103,
        status: 'open',
        createdAt: new Date().toISOString(),
        service: {
            id: 103,
            name: 'Vaccination',
            description: 'Flu shots and other vaccines',
            durationMinutes: 5,
            priority: 'Low'
        }
    }
];

export const MOCK_ENTRIES: QueueEntry[] = [
    { queueId: 1, userId: 201, position: 1, joinTime: new Date(Date.now() - 30 * 60000).toISOString(), status: 'waiting', user: { id: 201, name: 'John Doe', email: 'john@example.com', role: 'Patient' } },
    { queueId: 1, userId: 202, position: 2, joinTime: new Date(Date.now() - 20 * 60000).toISOString(), status: 'waiting', user: { id: 202, name: 'Jane Smith', email: 'jane@example.com', role: 'Patient' } },
    { queueId: 2, userId: 204, position: 1, joinTime: new Date(Date.now() - 10 * 60000).toISOString(), status: 'waiting', user: { id: 204, name: 'Alice Brown', email: 'alice@example.com', role: 'Patient' } },
    { queueId: 1, userId: 203, position: 3, joinTime: new Date(Date.now() - 5 * 60000).toISOString(), status: 'waiting', user: { id: 203, name: 'Bob Wilson', email: 'bob@example.com', role: 'Patient' } }
];
