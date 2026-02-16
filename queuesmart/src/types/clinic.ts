export type UserRole = "Admin" | "Patient" | "Staff"
export type NotificationPreference = "PhoneSMS" | "EmailSMS"
export type ServicePriority = "High" | "Medium" | "Low"
export type QueueStatus = "open" | "closed"
export type QueueEntryStatus = "waiting" | "served" | "cancelled"
export type NotificationStatus = "sent" | "viewed"

export interface UserCredentials {
  id: number
  email: string
  encryptedPassword: string
  role: UserRole
}

export interface UserProfile {
  name: string
  email: string
  phone: string | null
  preferences: NotificationPreference
}

export interface Service {
  id: number
  name: string
  description: string | null
  durationMinutes: number
  priority: ServicePriority
}

export interface Queue {
  id: number
  serviceID: number
  status: QueueStatus
  date: string
}

export interface QueueEntry {
  queueID: number
  userID: number
  position: number
  joinTime: string
  status: QueueEntryStatus
}

export interface NotificationHistory {
  id: number
  userID: number
  message: string
  timeStamp: string
  status: NotificationStatus
}

export interface QueueEntryView {
  queueID: number
  userID: number
  patientName: string
  email: string
  serviceID: number
  position: number
  joinTime: string
  status: QueueEntryStatus
}
