export type Priority = 'High' | 'Medium' | 'Low';
export type QueueStatus = 'Open' | 'Closed';
export type QueueEntryStatus = 'Waiting' | 'Served' | 'Cancelled' | 'Pending' | 'InProgress' | 'Removed' | 'Completed';
export type UserRole = 'Admin' | 'Patient' | 'Staff';

// User & Profile (Combined for convenience in frontend display)
export interface User {
    id: number;
    email: string;
    role: UserRole;
    name: string;
    phone?: string; // Optional as per schema NULL
}

export interface AuthResponse {
    message: string;
    user: User;
}

// Service Management
export interface Service {
    id: number;
    name: string; // Max 100 chars
    description: string;
    duration: number; // Expected Duration
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
    id: number;
    queueId: number;
    userId: string;
    // Joined user details for display
    user?: User;
    queue?: Queue;
    position: number | null;
    joinTime: string; // ISO Date string
    status: QueueEntryStatus;
    priority: Priority;
    description?: string;
}

export interface NotificationEvent {
    id: number;
    type: "QueueJoined" | "FirstInLine" | "QueueApproved";
    audience: "AdminStaff" | "Patient";
    title: string;
    message: string;
    createdAt: string;
    userId?: string;
    queueId?: number;
    queueEntryId?: number;
}

// Admin Dashboard specific types
export interface AdminDashboardStats {
    totalServices: number;
    activeQueues: number;
    usersWaiting: number;
}
