import type {
  NotificationHistory,
  Queue,
  QueueEntryView,
  Service,
  UserProfile,
} from "../types/clinic"

export const clinicServices: Service[] = [
  {
    id: 1,
    name: "General Consultation",
    description: "First visit assessment for walk-in patients.",
    durationMinutes: 30,
    priority: "High",
  },
  {
    id: 2,
    name: "Follow-up Visit",
    description: "Short check-in for existing treatment plans.",
    durationMinutes: 20,
    priority: "Medium",
  },
  {
    id: 3,
    name: "Lab Result Review",
    description: "Doctor review of bloodwork, scans, and reports.",
    durationMinutes: 15,
    priority: "Low",
  },
]

export const activeQueues: Queue[] = [
  {
    id: 101,
    serviceID: 1,
    status: "open",
    date: "2026-02-16",
  },
  {
    id: 102,
    serviceID: 2,
    status: "open",
    date: "2026-02-16",
  },
  {
    id: 103,
    serviceID: 3,
    status: "open",
    date: "2026-02-16",
  },
]

export const patientProfiles: UserProfile[] = [
  {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "5552319090",
    preferences: "EmailSMS",
  },
  {
    name: "Aisha Morgan",
    email: "aisha.morgan@example.com",
    phone: "5558712219",
    preferences: "PhoneSMS",
  },
  {
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "5554432200",
    preferences: "PhoneSMS",
  },
]

export const liveQueueEntries: QueueEntryView[] = [
  {
    queueID: 101,
    userID: 1,
    patientName: "John Doe",
    email: "john.doe@example.com",
    serviceID: 1,
    position: 1,
    joinTime: "2026-02-16T09:00:00",
    status: "waiting",
  },
  {
    queueID: 102,
    userID: 2,
    patientName: "Aisha Morgan",
    email: "aisha.morgan@example.com",
    serviceID: 2,
    position: 1,
    joinTime: "2026-02-16T09:12:00",
    status: "waiting",
  },
  {
    queueID: 101,
    userID: 3,
    patientName: "Jane Smith",
    email: "jane.smith@example.com",
    serviceID: 1,
    position: 2,
    joinTime: "2026-02-16T09:20:00",
    status: "waiting",
  },
]

export const notificationHistory: NotificationHistory[] = [
  {
    id: 1,
    userID: 1,
    message: "Your appointment is in approximately 20 minutes.",
    timeStamp: "2026-02-16T09:35:00",
    status: "sent",
  },
  {
    id: 2,
    userID: 3,
    message: "You are now next in line for General Consultation.",
    timeStamp: "2026-02-16T09:50:00",
    status: "viewed",
  },
]

export const clinicBusinessRules = {
  oneActiveQueuePerPatient: "A patient can only be in one line at a time.",
}

export function getServiceById(serviceID: number) {
  return clinicServices.find((service) => service.id === serviceID)
}

export function getWaitingEntries() {
  return liveQueueEntries.filter((entry) => entry.status === "waiting")
}

export function getEstimatedConsultationTime(
  serviceDurationMinutes: number,
  queuePosition: number
) {
  const estimate = new Date()
  estimate.setMinutes(
    estimate.getMinutes() + serviceDurationMinutes * queuePosition
  )

  return estimate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}
