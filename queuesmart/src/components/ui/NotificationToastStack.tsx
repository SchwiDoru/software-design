import type { NotificationEvent } from "../../types";

interface NotificationToastStackProps {
  notifications: NotificationEvent[];
  onDismiss: (id: number) => void;
}

const notificationStyles: Record<NotificationEvent["type"], string> = {
  QueueJoined: "border-blue-200 bg-white",
  FirstInLine: "border-amber-200 bg-amber-50",
  QueueApproved: "border-emerald-200 bg-emerald-50",
  FrontDesk: "border-cyan-200 bg-cyan-50",
  VisitCompleted: "border-violet-200 bg-violet-50",
};

const labelStyles: Record<NotificationEvent["type"], string> = {
  QueueJoined: "text-blue-600",
  FirstInLine: "text-amber-700",
  QueueApproved: "text-emerald-700",
  FrontDesk: "text-cyan-700",
  VisitCompleted: "text-violet-700",
};

export default function NotificationToastStack({ notifications, onDismiss }: NotificationToastStackProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[90] flex flex-col gap-3 sm:inset-x-auto sm:right-6 sm:w-[380px]">
      {notifications.map((notification) => (
        <article
          key={notification.id}
          className={`rounded-2xl border p-4 shadow-[0_18px_35px_rgba(15,23,42,0.16)] ${notificationStyles[notification.type]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${labelStyles[notification.type]}`}>
                {notification.type === "QueueJoined"
                  ? "Queue Update"
                  : notification.type === "QueueApproved"
                    ? "Review Update"
                    : notification.type === "VisitCompleted"
                      ? "Visit History"
                      : "Patient Alert"}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{notification.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(notification.id)}
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Dismiss notification"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p>
        </article>
      ))}
    </div>
  );
}
