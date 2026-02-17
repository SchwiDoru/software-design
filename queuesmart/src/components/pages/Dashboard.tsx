import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../Navbar";
import type { Queue, QueueEntry, User } from "../../types";
import { readQueueEntries, readQueues, subscribeQueueStore } from "../../data/queueStore";

type NotificationTone = "info" | "alert" | "success";

interface PatientNotification {
  id: string;
  tone: NotificationTone;
  title: string;
  detail: string;
  createdAt: string;
}

type PatientStatus = "Waiting" | "Next" | "Ready" | "Served";

const nowLabel = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [queues, setQueues] = useState<Queue[]>(readQueues);
  const [entries, setEntries] = useState<QueueEntry[]>(readQueueEntries);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [manualStatus, setManualStatus] = useState<PatientStatus | null>(null);
  const [isNextPopupOpen, setIsNextPopupOpen] = useState(false);
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const previousPositionRef = useRef<number | null>(null);
  const hadEntryRef = useRef(false);

  useEffect(() => {
    return subscribeQueueStore(() => {
      setQueues(readQueues());
      setEntries(readQueueEntries());
    });
  }, []);

  const waitingEntries = useMemo(() => {
    return entries.filter((entry) => entry.status === "waiting").sort((a, b) => a.position - b.position);
  }, [entries]);

  const patients = useMemo<User[]>(() => {
    const patientsMap = new Map<number, User>();
    waitingEntries.forEach((entry) => {
      if (entry.user && !patientsMap.has(entry.userId)) {
        patientsMap.set(entry.userId, entry.user);
      }
    });
    return Array.from(patientsMap.values());
  }, [waitingEntries]);

  useEffect(() => {
    const idParam = searchParams.get("userId");
    if (idParam) {
      setPatientId(Number(idParam));
      return;
    }

    if (!idParam && patients.length > 0 && patientId === null) {
      setPatientId(patients[0].id);
      setSearchParams({ userId: patients[0].id.toString() });
    }
  }, [patientId, patients, searchParams, setSearchParams]);

  const currentEntry = waitingEntries.find((entry) => entry.userId === patientId);
  const currentPatient = patients.find((patient) => patient.id === patientId);
  const currentQueue = queues.find((queue) => queue.id === currentEntry?.queueId);

  const queueEntries = useMemo(() => {
    if (!currentEntry) {
      return [];
    }
    return waitingEntries
      .filter((entry) => entry.queueId === currentEntry.queueId)
      .sort((a, b) => a.position - b.position);
  }, [currentEntry, waitingEntries]);

  const queuePosition = currentEntry?.position ?? null;
  const estimatedMinutes = currentEntry
    ? (currentEntry.position - 1) * (currentQueue?.service?.durationMinutes ?? 15)
    : 0;
  const openQueues = queues.filter((queue) => queue.status === "open");

  const derivedStatus: PatientStatus = !currentEntry
    ? "Served"
    : manualStatus === "Ready"
      ? "Ready"
      : currentEntry.position === 1
        ? "Next"
        : "Waiting";

  const addNotification = (tone: NotificationTone, title: string, detail: string) => {
    const item: PatientNotification = {
      id: `${Date.now()}-${Math.random()}`,
      tone,
      title,
      detail,
      createdAt: nowLabel()
    };

    setNotifications((previous) => [item, ...previous].slice(0, 6));
  };

  useEffect(() => {
    if (!currentPatient) {
      return;
    }
    setNotifications([
      {
        id: `joined-${currentPatient.id}`,
        tone: "info",
        title: "Checked In",
        detail: `${currentPatient.name}, your dashboard is active and tracking your queue.`,
        createdAt: nowLabel()
      }
    ]);
    previousPositionRef.current = null;
    hadEntryRef.current = false;
    setManualStatus(null);
  }, [currentPatient]);

  useEffect(() => {
    if (!currentEntry) {
      if (hadEntryRef.current) {
        addNotification("success", "Visit Started", "You have been called and removed from the waiting queue.");
      }
      hadEntryRef.current = false;
      previousPositionRef.current = null;
      setIsNextPopupOpen(false);
      return;
    }

    hadEntryRef.current = true;

    if (previousPositionRef.current !== null && currentEntry.position < previousPositionRef.current) {
      addNotification(
        "info",
        "Position Updated",
        `Good news. You moved from #${previousPositionRef.current} to #${currentEntry.position}.`
      );
    }

    if (currentEntry.position === 1) {
      setIsNextPopupOpen(true);
      addNotification("alert", "You Are Next", "Please get ready. Staff may call you any moment.");
    }

    previousPositionRef.current = currentEntry.position;
  }, [currentEntry]);

  const handleAcknowledgeNext = () => {
    setManualStatus("Ready");
    setIsNextPopupOpen(false);
    addNotification("success", "Status Updated", "You are marked as ready.");
  };

  const notificationToneStyles: Record<NotificationTone, string> = {
    info: "border-accent/30 bg-accent/5 text-accent",
    alert: "border-amber-200 bg-amber-50 text-amber-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700"
  };

  const statusStyles: Record<PatientStatus, string> = {
    Waiting: "bg-blue-50 text-blue-700",
    Next: "bg-amber-50 text-amber-700",
    Ready: "bg-emerald-50 text-emerald-700",
    Served: "bg-muted text-muted-foreground"
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="section-label mb-4">
                <span className="section-label-dot" />
                <span className="section-label-text">Patient Dashboard</span>
              </div>
              <h1 className="text-4xl leading-tight text-foreground sm:text-[3.25rem]">
                Live queue updates for <span className="gradient-text">your visit</span>
              </h1>
              <p className="mt-2 text-muted-foreground">
                Track queue position, service status, and real-time clinic notifications.
              </p>
            </div>

            <div className="w-full max-w-xs">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Demo Patient
              </label>
              <select
                className="input-field"
                value={patientId ?? ""}
                onChange={(event) => {
                  const selected = Number(event.target.value);
                  setPatientId(selected);
                  setSearchParams({ userId: selected.toString() });
                }}
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="surface-card p-5">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Queue Position</p>
              <p className="mt-3 text-4xl font-semibold text-foreground">{queuePosition ?? "--"}</p>
            </article>

            <article className="surface-card p-5">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Current Status</p>
              <div className="mt-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusStyles[derivedStatus]}`}>
                  {derivedStatus}
                </span>
              </div>
            </article>

            <article className="surface-card p-5">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Estimated Wait</p>
              <p className="mt-3 text-4xl font-semibold text-foreground">{estimatedMinutes}m</p>
            </article>

            <article className="surface-card p-5">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Active Services</p>
              <p className="mt-3 text-4xl font-semibold text-foreground">{openQueues.length}</p>
            </article>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="surface-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-3xl text-foreground">Queue Details</h2>
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.1em] text-accent">
                  {currentQueue?.service?.name ?? "No active queue"}
                </span>
              </div>

              {queueEntries.length > 0 ? (
                <ul className="space-y-3">
                  {queueEntries.slice(0, 5).map((entry) => (
                    <li
                      key={entry.userId}
                      className={`flex items-center justify-between rounded-xl border p-3 ${entry.userId === patientId ? "border-accent/30 bg-accent/5" : "border-border bg-card"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                          {entry.position}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{entry.user?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined{" "}
                            {new Date(entry.joinTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                      {entry.userId === patientId ? (
                        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-white">You</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
                  No waiting entry found for this patient.
                </div>
              )}
            </div>

            <div className="surface-card p-6">
              <h2 className="text-3xl text-foreground">Notifications</h2>
              <p className="mt-2 text-sm text-muted-foreground">Overview of current queue status and patient alerts.</p>
              <div className="mt-5 space-y-3">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <article
                      key={notification.id}
                      className={`rounded-xl border p-4 ${notificationToneStyles[notification.tone]}`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <span className="font-mono text-xs uppercase tracking-[0.12em]">{notification.createdAt}</span>
                      </div>
                      <p className="mt-2 text-sm">{notification.detail}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                    Notification summary will appear here.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="inverted-section rounded-3xl px-6 py-8 sm:px-8">
            <div className="grid gap-4 md:grid-cols-3 md:items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-background/70">Current service</p>
                <p className="mt-2 text-2xl">{currentQueue?.service?.name ?? "Not Assigned"}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-background/70">Duration</p>
                <p className="mt-2 text-2xl">{currentQueue?.service?.durationMinutes ?? 0} min</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-background/70">Queue status</p>
                <p className="mt-2 text-2xl capitalize">{currentQueue?.status ?? "waiting"}</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {isNextPopupOpen && derivedStatus !== "Ready" && (
        <div className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-accent/30 bg-card p-5 shadow-[0_20px_25px_rgba(15,23,42,0.1)] sm:inset-x-auto sm:right-6 sm:w-[420px]">
          <div className="mb-3 flex items-center gap-3">
            <span className="section-label-dot" />
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-accent">Queue Alert</p>
          </div>
          <h3 className="text-2xl text-foreground">You are next in line</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Position #{queuePosition}. Please stay ready for your call.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleAcknowledgeNext}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-5 text-sm font-medium text-white"
            >
              I am ready
            </button>
            <button
              onClick={() => setIsNextPopupOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
