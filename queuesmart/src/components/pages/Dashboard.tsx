import Navbar from "../Navbar"
import Button from "../ui/Button"
import Card from "../ui/Card"
import SectionLabel from "../ui/SectionLabel"
import { activeQueues, getServiceById, getWaitingEntries } from "../../data/mockClinic"
import type { QueueEntryStatus } from "../../types/clinic"

const waitingEntries = getWaitingEntries().sort((a, b) => a.position - b.position)

const averageServiceMinutes =
  waitingEntries.length === 0
    ? 0
    : Math.round(
        waitingEntries.reduce((sum, entry) => {
          const service = getServiceById(entry.serviceID)
          return sum + (service?.durationMinutes ?? 0)
        }, 0) / waitingEntries.length
      )

const statusStyles: Record<QueueEntryStatus, string> = {
  waiting: "bg-amber-100 text-amber-800",
  served: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
}

function Dashboard() {
  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Navbar />

      <main className="app-container py-10 sm:py-16">
        <SectionLabel>Staff Operations</SectionLabel>
        <h1 className="mt-4 text-4xl tracking-[-0.01em] sm:text-5xl">Queue Dashboard</h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base">
          Monitor active clinic queues, call the next patient, and keep service
          flow smooth throughout the day.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#0052FF]">
              Open Queues
            </p>
            <p className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
              {activeQueues.filter((queue) => queue.status === "open").length}
            </p>
          </Card>
          <Card>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#0052FF]">
              Waiting Patients
            </p>
            <p className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
              {waitingEntries.length}
            </p>
          </Card>
          <Card>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#0052FF]">
              Avg Service Time
            </p>
            <p className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
              {averageServiceMinutes} min
            </p>
          </Card>
          <Card>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#0052FF]">
              Queue Date
            </p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
              Feb 16
            </p>
            <p className="text-sm">2026</p>
          </Card>
        </div>

        <Card className="mt-6" elevated>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl">Today&apos;s Queue Entries</h2>
            <Button size="md">Serve Next Patient</Button>
          </div>

          <div className="mt-6 hidden overflow-hidden rounded-xl border border-[color:var(--border)] md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[color:var(--muted)]">
                  <th className="px-4 py-3 font-semibold text-[color:var(--foreground)]">Position</th>
                  <th className="px-4 py-3 font-semibold text-[color:var(--foreground)]">Patient</th>
                  <th className="px-4 py-3 font-semibold text-[color:var(--foreground)]">Service</th>
                  <th className="px-4 py-3 font-semibold text-[color:var(--foreground)]">Join Time</th>
                  <th className="px-4 py-3 font-semibold text-[color:var(--foreground)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {waitingEntries.map((entry) => {
                  const service = getServiceById(entry.serviceID)
                  return (
                    <tr className="border-t border-[color:var(--border)]" key={`${entry.queueID}-${entry.userID}`}>
                      <td className="px-4 py-3 text-[color:var(--foreground)]">#{entry.position}</td>
                      <td className="px-4 py-3 text-[color:var(--foreground)]">{entry.patientName}</td>
                      <td className="px-4 py-3">{service?.name ?? "Unknown Service"}</td>
                      <td className="px-4 py-3">
                        {new Date(entry.joinTime).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[entry.status]}`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 md:hidden">
            {waitingEntries.map((entry) => {
              const service = getServiceById(entry.serviceID)
              return (
                <div
                  className="rounded-xl border border-[color:var(--border)] bg-white p-4"
                  key={`${entry.queueID}-${entry.userID}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[color:var(--foreground)]">#{entry.position}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[entry.status]}`}>
                      {entry.status}
                    </span>
                  </div>
                  <p className="mt-2 text-base font-medium text-[color:var(--foreground)]">{entry.patientName}</p>
                  <p className="mt-1 text-sm">{service?.name ?? "Unknown Service"}</p>
                  <p className="mt-1 text-sm">
                    Joined{" "}
                    {new Date(entry.joinTime).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      </main>
    </div>
  )
}

export default Dashboard
