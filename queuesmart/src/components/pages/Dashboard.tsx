import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../Navbar";
import NotificationToastStack from "../ui/NotificationToastStack";
import { estimateWaitTime, getActiveQueueEntry } from "../../services/queueEntry";
import { useNotificationFeed } from "../../hooks/useNotificationFeed";
import { useAuth } from "../auth/AuthProvider";
import type { NotificationEvent, QueueEntry } from "../../types";

export default function Dashboard() {
  const { user: authenticatedUser } = useAuth();
  const [activeEntry, setActiveEntry] = useState<QueueEntry | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { notifications, recentNotifications, dismissNotification } = useNotificationFeed(authenticatedUser);

  useEffect(() => {
    if (!authenticatedUser) {
      return;
    }

    let isCancelled = false;

    const loadDashboard = async () => {
      try {
        const nextEntry = await getActiveQueueEntry(authenticatedUser.email);
        if (isCancelled) {
          return;
        }

        setActiveEntry(nextEntry);

        if (!nextEntry) {
          setEstimatedMinutes(0);
          return;
        }

        const waitInfo = await estimateWaitTime(nextEntry.queueId, authenticatedUser.email);
        if (!isCancelled) {
          setEstimatedMinutes(waitInfo.estimatedWaitTimeMinutes);
        }
      } catch (error) {
        console.warn("Failed to load patient dashboard", error);
        if (!isCancelled) {
          setActiveEntry(null);
          setEstimatedMinutes(0);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();
    const timer = window.setInterval(() => {
      void loadDashboard();
    }, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, [authenticatedUser]);

  const positionLabel = !activeEntry
    ? "--"
    : activeEntry.status === "Pending"
      ? "Pending"
      : activeEntry.status === "InProgress"
        ? "Front Desk"
      : `#${(activeEntry.position ?? 0) + 1}`;

  const statusTone = activeEntry?.status === "Waiting"
    ? "bg-blue-50 text-blue-700"
    : activeEntry?.status === "Pending"
      ? "bg-amber-50 text-amber-700"
      : activeEntry?.status === "InProgress"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-muted text-muted-foreground";

  const notificationSummary: NotificationEvent[] = recentNotifications.slice(0, 6);

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
                Signed in as {authenticatedUser?.name}. Your queue details now come from the backend instead of the demo selector.
              </p>
            </div>
          </div>

          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="surface-card p-5">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Queue Position</p>
              <p className="mt-3 text-4xl font-semibold text-foreground">{isLoading ? "--" : positionLabel}</p>
            </article>

            <article className="surface-card p-5">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Current Status</p>
              <div className="mt-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusTone}`}>
                  {activeEntry?.status ?? "No Active Queue"}
                </span>
              </div>
            </article>

            <article className="surface-card p-5">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Estimated Wait</p>
              <p className="mt-3 text-4xl font-semibold text-foreground">
                {activeEntry?.status === "Pending"
                  ? "--"
                  : activeEntry?.status === "InProgress"
                    ? "Now"
                    : `${estimatedMinutes}m`}
              </p>
            </article>

            <article className="surface-card p-5">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Current Service</p>
              <p className="mt-3 text-xl font-semibold text-foreground">
                {activeEntry?.queue?.service?.name ?? "Not assigned"}
              </p>
            </article>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="surface-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-3xl text-foreground">Queue Details</h2>
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.1em] text-accent">
                  {activeEntry?.queue?.service?.name ?? "No active queue"}
                </span>
              </div>

              {activeEntry ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Patient</p>
                    <h3 className="mt-3 text-2xl font-semibold text-foreground">{authenticatedUser?.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{authenticatedUser?.email}</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-5">
                    <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Visit Status</p>
                    <p className="mt-3 text-lg text-foreground">
                      {activeEntry.status === "Pending"
                        ? "Your request is waiting for staff review."
                        : activeEntry.status === "Waiting"
                          ? `You are currently #${(activeEntry.position ?? 0) + 1} in line.`
                          : "Go to the front desk. Staff is preparing your visit with the doctor."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
                  <p className="text-lg font-medium text-foreground">No active queue entry</p>
                  <p className="mt-2 text-sm">Join a service when you are ready and we will track it here.</p>
                  <Link
                    to="/join"
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-5 text-sm font-medium text-white"
                  >
                    Join Queue
                  </Link>
                </div>
              )}
            </div>

            <div className="surface-card p-6">
              <h2 className="text-3xl text-foreground">Notification History</h2>
              <p className="mt-2 text-sm text-muted-foreground">Recent patient alerts stored by the backend queue handler.</p>
              <div className="mt-5 space-y-3">
                {notificationSummary.length > 0 ? (
                  notificationSummary.map((notification) => (
                    <article
                      key={notification.id}
                      className={`rounded-xl border p-4 ${notification.type === "FirstInLine"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : notification.type === "QueueApproved"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : notification.type === "FrontDesk"
                            ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                            : notification.type === "VisitCompleted"
                              ? "border-violet-200 bg-violet-50 text-violet-700"
                              : "border-accent/30 bg-accent/5 text-accent"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <span className="font-mono text-xs uppercase tracking-[0.12em]">
                          {new Date(notification.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm">{notification.message}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                    Notification history will appear here once backend events exist for this patient.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="inverted-section rounded-3xl px-6 py-8 sm:px-8">
            <div className="grid gap-4 md:grid-cols-3 md:items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-background/70">Current service</p>
                <p className="mt-2 text-2xl">{activeEntry?.queue?.service?.name ?? "Not Assigned"}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-background/70">Duration</p>
                <p className="mt-2 text-2xl">{activeEntry?.queue?.service?.duration ?? 0} min</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-background/70">Queue status</p>
                <p className="mt-2 text-2xl capitalize">{activeEntry?.queue?.status ?? "waiting"}</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <NotificationToastStack notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
}
