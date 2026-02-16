import { type FormEvent, useMemo, useState } from "react"
import Navbar from "../Navbar"
import Button from "../ui/Button"
import Card from "../ui/Card"
import { Input, Select } from "../ui/Input"
import SectionLabel from "../ui/SectionLabel"
import {
  clinicBusinessRules,
  clinicServices,
  getEstimatedConsultationTime,
  liveQueueEntries,
} from "../../data/mockClinic"
import type { NotificationPreference } from "../../types/clinic"

interface JoinTicket {
  serviceName: string
  queuePosition: number
  waitMinutes: number
  estimatedConsultationTime: string
}

function JoinQueue() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [serviceID, setServiceID] = useState(String(clinicServices[0]?.id ?? 1))
  const [preference, setPreference] = useState<NotificationPreference>("PhoneSMS")
  const [ticket, setTicket] = useState<JoinTicket | null>(null)

  const selectedService = useMemo(
    () => clinicServices.find((service) => String(service.id) === serviceID),
    [serviceID]
  )

  const existingQueueEntry = useMemo(
    () =>
      liveQueueEntries.find(
        (entry) =>
          entry.status === "waiting" &&
          entry.email.toLowerCase() === email.trim().toLowerCase()
      ),
    [email]
  )

  const waitingAhead = useMemo(() => {
    if (!selectedService) {
      return 0
    }

    return liveQueueEntries.filter(
      (entry) =>
        entry.status === "waiting" && entry.serviceID === selectedService.id
    ).length
  }, [selectedService])

  const estimatedWaitMinutes = selectedService
    ? waitingAhead * selectedService.durationMinutes
    : 0

  const estimatedConsultationTime = selectedService
    ? getEstimatedConsultationTime(selectedService.durationMinutes, waitingAhead + 1)
    : "N/A"

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedService || existingQueueEntry) {
      return
    }

    setTicket({
      serviceName: selectedService.name,
      queuePosition: waitingAhead + 1,
      waitMinutes: estimatedWaitMinutes,
      estimatedConsultationTime,
    })
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Navbar />

      <main className="app-container py-10 sm:py-16">
        <SectionLabel>Patient Check-In</SectionLabel>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card featured>
            <h1 className="text-3xl tracking-[-0.01em] sm:text-4xl">
              Join the clinic queue
            </h1>
            <p className="mt-3 max-w-xl text-sm sm:text-base">
              Sign up in under a minute and receive updates so you can wait more
              comfortably before your consultation.
            </p>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[color:var(--foreground)]" htmlFor="full-name">
                  Full Name
                </label>
                <Input
                  id="full-name"
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Jane Smith"
                  required
                  value={fullName}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[color:var(--foreground)]" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="jane.smith@example.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[color:var(--foreground)]" htmlFor="phone">
                    Phone (optional)
                  </label>
                  <Input
                    id="phone"
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="5551234567"
                    value={phone}
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[color:var(--foreground)]" htmlFor="service">
                    Service
                  </label>
                  <Select
                    id="service"
                    onChange={(event) => setServiceID(event.target.value)}
                    value={serviceID}
                  >
                    {clinicServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[color:var(--foreground)]" htmlFor="preference">
                    Notification
                  </label>
                  <Select
                    id="preference"
                    onChange={(event) =>
                      setPreference(event.target.value as NotificationPreference)
                    }
                    value={preference}
                  >
                    <option value="PhoneSMS">Phone SMS</option>
                    <option value="EmailSMS">Email SMS</option>
                  </Select>
                </div>
              </div>

              {existingQueueEntry && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {clinicBusinessRules.oneActiveQueuePerPatient} We already found an
                  active queue entry for this email.
                </div>
              )}

              <Button className="mt-2 w-full sm:w-auto" disabled={Boolean(existingQueueEntry)} size="lg" type="submit">
                Confirm Queue Spot
              </Button>
            </form>
          </Card>

          <div className="grid gap-5">
            <Card elevated>
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#0052FF]">
                Current Estimate
              </p>
              <h3 className="mt-2 text-2xl">Live Wait Snapshot</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-xl bg-[color:var(--muted)] p-4">
                  <p className="text-xs uppercase tracking-wide">People Ahead</p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                    {waitingAhead}
                  </p>
                </div>
                <div className="rounded-xl bg-[color:var(--muted)] p-4">
                  <p className="text-xs uppercase tracking-wide">Est. Wait</p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                    {estimatedWaitMinutes} min
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm">
                Expected consultation start around{" "}
                <span className="font-semibold text-[color:var(--foreground)]">
                  {estimatedConsultationTime}
                </span>
                .
              </p>
            </Card>

            {ticket && (
              <Card>
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#0052FF]">
                  Booking Confirmed
                </p>
                <h3 className="mt-2 text-2xl">You are in line</h3>
                <p className="mt-2 text-sm">
                  Service:{" "}
                  <span className="font-semibold text-[color:var(--foreground)]">
                    {ticket.serviceName}
                  </span>
                </p>
                <p className="mt-1 text-sm">
                  Queue position:{" "}
                  <span className="font-semibold text-[color:var(--foreground)]">
                    #{ticket.queuePosition}
                  </span>
                </p>
                <p className="mt-1 text-sm">
                  Estimated call time:{" "}
                  <span className="font-semibold text-[color:var(--foreground)]">
                    {ticket.estimatedConsultationTime}
                  </span>
                </p>
                <p className="mt-1 text-sm">
                  Notification channel:{" "}
                  <span className="font-semibold text-[color:var(--foreground)]">
                    {preference === "PhoneSMS" ? "Phone SMS" : "Email SMS"}
                  </span>
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default JoinQueue
