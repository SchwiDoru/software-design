import type { Queue, QueueEntry } from '../types';

export const MOCK_QUEUES: Queue[] = [
    {
        id: 1,
        serviceId: 101,
        status: 'Open',
        createdAt: new Date().toISOString(),
        service: {
            id: 101,
            name: 'General Consultation',
            description: 'Standard check-up with a GP',
            duration: 15,
            priority: 'Medium'
        }
    },
    {
        id: 2,
        serviceId: 102,
        status: 'Closed',
        createdAt: new Date().toISOString(),
        service: {
            id: 102,
            name: 'Emergency Room',
            description: 'Urgent care for critical conditions',
            duration: 30,
            priority: 'High'
        }
    },
    {
        id: 3,
        serviceId: 103,
        status: 'Open',
        createdAt: new Date().toISOString(),
        service: {
            id: 103,
            name: 'Vaccination',
            description: 'Flu shots and other vaccines',
            duration: 5,
            priority: 'Low'
        }
    }
];

export const MOCK_ENTRIES: QueueEntry[] = [
    {
        id: 301,
        queueId: 1,
        userId: 'john@example.com',
        position: 1,
        joinTime: new Date(Date.now() - 30 * 60000).toISOString(),
        status: 'Waiting',
        priority: 'Medium',
        user: { id: 201, name: 'John Doe', email: 'john@example.com', role: 'Patient' }
    },
    {
        id: 302,
        queueId: 1,
        userId: 'jane@example.com',
        position: 2,
        joinTime: new Date(Date.now() - 20 * 60000).toISOString(),
        status: 'Waiting',
        priority: 'Low',
        user: { id: 202, name: 'Jane Smith', email: 'jane@example.com', role: 'Patient' }
    },
    {
        id: 303,
        queueId: 2,
        userId: 'alice@example.com',
        position: 1,
        joinTime: new Date(Date.now() - 10 * 60000).toISOString(),
        status: 'Waiting',
        priority: 'High',
        user: { id: 204, name: 'Alice Brown', email: 'alice@example.com', role: 'Patient' }
    },
    {
        id: 304,
        queueId: 1,
        userId: 'bob@example.com',
        position: 3,
        joinTime: new Date(Date.now() - 5 * 60000).toISOString(),
        status: 'Waiting',
        priority: 'Medium',
        user: { id: 203, name: 'Bob Wilson', email: 'bob@example.com', role: 'Patient' }
    }
];
