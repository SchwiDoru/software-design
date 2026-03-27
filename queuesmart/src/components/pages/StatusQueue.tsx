import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "../Navbar";
import NotificationToastStack from "../ui/NotificationToastStack";
import { estimateWaitTime, getActiveQueueEntry, leaveQueue } from "../../services/queueEntry";
import { useNotificationFeed } from "../../hooks/useNotificationFeed";
import { useAuth } from "../auth/AuthProvider";
import type { QueueEntry } from "../../types";

interface QueueSession {
  queueId: number;
  userId: string;
  userName?: string;
  serviceName: string;
}

function StatusQueue() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authenticatedUser } = useAuth();
  const locationState = location.state as QueueSession & { showSuccessModal?: boolean; totalMinutes?: number; position?: number };
  const [showModal, setShowModal] = useState(locationState?.showSuccessModal || false);
  const [countdown, setCountdown] = useState(locationState?.totalMinutes || 0);
  const [position, setPosition] = useState(locationState?.position || 0);
  const [activeEntry, setActiveEntry] = useState<QueueEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [queueSession] = useState<QueueSession | null>(() => {
    const stored = localStorage.getItem("activeQueue");
    if (!stored) return null;
    try {
      return JSON.parse(stored) as QueueSession;
    } catch {
      return null;
    }
  });
  const { notifications, dismissNotification } = useNotificationFeed(authenticatedUser);

  const serviceName = activeEntry?.queue?.service?.name || location.state?.serviceName || queueSession?.serviceName || "General";
  const patientName = authenticatedUser?.name || queueSession?.userName || "Patient";

  const dismissModal = () => setShowModal(false);

  useEffect(() => {
    let timer: number | undefined;

    const refreshQueueState = async () => {
      if (!authenticatedUser) {
        return;
      }

      try {
        const nextActiveEntry = await getActiveQueueEntry(authenticatedUser.email);

        setActiveEntry(nextActiveEntry);
        if (!nextActiveEntry) {
          setPosition(0);
          setCountdown(0);
          return;
        }

        const waitInfo = await estimateWaitTime(nextActiveEntry.queueId, authenticatedUser.email);
        setPosition(nextActiveEntry.status === "Pending" ? 0 : (waitInfo.position ?? 0) + 1);
        setCountdown(waitInfo.estimatedWaitTimeMinutes);
      } catch (error) {
        console.warn("Failed to get queue status", error);
      } finally {
        setIsLoading(false);
      }
    };

    void refreshQueueState();

    timer = window.setInterval(() => {
      void refreshQueueState();
    }, 15000);

    return () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
      }
    };
  }, [authenticatedUser, location.state, queueSession]);

  const handleLeave = async () => {
    if (authenticatedUser && activeEntry) {
      try {
        await leaveQueue(activeEntry.queueId, authenticatedUser.email);
      } catch (error: any) {
        console.warn("Error leaving queue", error);
      }
    }

    localStorage.removeItem("activeQueue"); // Unlock queue
    navigate("/join");
  };

  if (!authenticatedUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-blue-50 relative">
      <Navbar />

      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">Queue Request Sent</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">You have joined the queue</h2>
            <p className="text-slate-500 text-sm mb-6">
              {patientName}, your request for <span className="font-bold text-slate-700">{serviceName}</span> has been sent to staff.
              We will keep this page updated as your status changes.
            </p>
            <div className="flex gap-3">
              <button onClick={dismissModal} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm">I am ready</button>
              <button onClick={dismissModal} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center py-20 px-4">
        <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-xl text-center">
            <div className="bg-slate-900 text-white inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase mb-4 tracking-widest">
                {serviceName} Department
            </div>
            <h1 className="text-4xl font-black mb-1">
              {isLoading
                ? "--"
                : activeEntry?.status === "Pending"
                  ? "Pending"
                  : activeEntry?.status === "InProgress"
                    ? "Front Desk"
                    : `#${position}`}
            </h1>
            <p className="text-slate-400 text-sm mb-8 uppercase font-bold tracking-widest">
              {activeEntry?.status === "Pending"
                ? "Awaiting Staff Review"
                : activeEntry?.status === "InProgress"
                  ? "Proceed Now"
                  : "Your Position"}
            </p>

            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-8">
                <p className="text-xs font-bold text-blue-400 uppercase mb-2">Estimated Arrival</p>
                <p className="text-3xl font-black text-blue-900">
                  {activeEntry?.status === "Pending"
                    ? "Waiting for review"
                    : activeEntry?.status === "InProgress"
                      ? "Please proceed"
                      : `${countdown} Minutes`}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  {activeEntry?.status === "InProgress"
                    ? "Go to the front desk. Staff is preparing your visit with the doctor."
                    : activeEntry
                      ? `Current status: ${activeEntry.status}`
                      : "You do not have an active queue entry right now."}
                </p>
            </div>

            {activeEntry ? (
              <button onClick={handleLeave} className="text-red-500 font-bold text-sm hover:underline">
                  Leave Queue
              </button>
            ) : (
              <button onClick={() => navigate("/join")} className="text-blue-600 font-bold text-sm hover:underline">
                  Join Another Queue
              </button>
            )}
        </div>
      </div>

      <NotificationToastStack notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
}
export default StatusQueue;
