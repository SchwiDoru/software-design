export type Priority = 'High' | 'Medium' | 'Low';
export type QueueStatus = 'open' | 'closed';
export type QueueEntryStatus = 'waiting' | 'served' | 'cancelled';
export type UserRole = 'Admin' | 'Patient' | 'Staff';

// User & Profile (Combined for convenience in frontend display)
export interface User {
    id: number;
    email: string;
    role: UserRole;
    name: string;
    phone?: string; // Optional as per schema NULL
}

// Service Management
export interface Service {
    id: number;
    name: string; // Max 100 chars
    description: string;
    durationMinutes: number; // Expected Duration
    priority: Priority;
}

// Queue Management
export interface Queue {
    id: number;
    serviceId: number;
    status: QueueStatus;
    createdAt: string; // ISO Date string
    // Optional: Frontend might need the service details joined
    service?: Service;
}

// Queue Entry (User in a Queue)
export interface QueueEntry {
    queueId: number;
    userId: number;
    // Joined user details for display
    user?: User;
    position: number;
    joinTime: string; // ISO Date string
    status: QueueEntryStatus;
}

// Admin Dashboard specific types
export interface AdminDashboardStats {
    totalServices: number;
    activeQueues: number;
    usersWaiting: number;
}
