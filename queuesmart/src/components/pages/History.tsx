import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "../Navbar";
import { useUIStore } from "../../data/historyPageBack";
import { useAuth } from "../auth/AuthProvider";
import { getPatientHistory } from "../../services/history";
import { getActiveQueueEntry } from "../../services/queueEntry";
import type { HistoryRecord, QueueEntry } from "../../types";

export default function HistoryPage() {
  const { user: authenticatedUser } = useAuth();
  const { historyPage, setHistoryPage } = useUIStore();
  const [histories, setHistories] = useState<HistoryRecord[]>([]);
  const [activeVisit, setActiveVisit] = useState<QueueEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 4;

  useEffect(() => {
    if (!authenticatedUser) {
      setHistories([]);
      setActiveVisit(null);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadHistory = async () => {
      try {
        const [nextHistory, nextActiveVisit] = await Promise.all([
          getPatientHistory(authenticatedUser.email),
          getActiveQueueEntry(authenticatedUser.email)
        ]);
        if (!isCancelled) {
          setHistories(nextHistory);
          setActiveVisit(nextActiveVisit);
        }
      } catch (error) {
        console.warn("Failed to load patient history", error);
        if (!isCancelled) {
          setHistories([]);
          setActiveVisit(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isCancelled = true;
    };
  }, [authenticatedUser]);

  const totalPages = Math.max(1, Math.ceil(histories.length / itemsPerPage));
  const startIndex = (historyPage - 1) * itemsPerPage;
  const currentItems = useMemo(
    () => histories.slice(startIndex, startIndex + itemsPerPage),
    [histories, startIndex]
  );
  const hasHistory = currentItems.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <header className="inverted-section pt-20 pb-16 px-6 shrink-0">
        <div className="mx-auto max-w-6xl">
          <div className="section-label mb-6">
            <span className="section-label-dot bg-accent-secondary" />
            <span className="section-label-text text-white/80">Medical Records</span>
          </div>
          <h1 className="text-5xl text-white">Your <span className="gradient-text">Queue History</span></h1>
          <p className="mt-4 text-white/60 max-w-xl text-lg">
            Review your current visit status and completed checkouts.
          </p>
        </div>
      </header>

      <main className="flex-grow bg-white px-6 py-12">
        <div className="mx-auto max-w-6xl">
          {activeVisit ? (
            <div className="surface-card mb-6 border-accent/20 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Current Visit</p>
                  <h2 className="mt-2 text-2xl text-foreground">
                    {activeVisit.queue?.service?.name ?? "Clinic Visit"}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {activeVisit.status === "Pending"
                      ? "Your request has been received and is waiting for staff review."
                      : activeVisit.status === "Waiting"
                        ? `You are currently #${(activeVisit.position ?? 0) + 1} in line.`
                        : "Go to the front desk. Staff is preparing your visit with the doctor."}
                  </p>
                </div>
                <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                  {activeVisit.status === "InProgress" ? "Waiting for Doctor" : activeVisit.status}
                </span>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4">
            {isLoading ? (
              <div className="surface-card p-8 text-sm text-muted-foreground">Loading patient history...</div>
            ) : !hasHistory ? (
              <div className="surface-card p-8 text-center text-muted-foreground">
                No completed visits have been recorded yet. Once staff marks your doctor visit complete, it will appear here.
              </div>
            ) : (
            <AnimatePresence mode="wait">
              {currentItems.map((item) => (
                <motion.div
                  key={item.historyId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={`/history/${encodeURIComponent(item.historyId)}`}
                    className="surface-card group flex items-center justify-between p-6 hover:border-accent/40"
                  >
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:block text-center min-w-[60px]">
                        <p className="font-mono text-[10px] uppercase tracking-tighter text-muted-foreground">
                          {new Date(item.date).toLocaleString(undefined, { month: "short" })}
                        </p>
                        <p className="text-2xl font-bold">{new Date(item.date).getDate()}</p>
                      </div>
                      <div className="h-10 w-[1px] bg-border hidden sm:block" />
                      <div>
                        <h3 className="text-xl font-medium">{item.queueEntry?.queue?.service?.name ?? item.historyDetails[0]?.serviceType ?? "Clinic Visit"}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className={item.queueEntry?.status === "Cancelled" ? 'text-rose-500 flex items-center gap-1' : 'text-emerald-600 flex items-center gap-1'}>
                            {item.queueEntry?.status === "Cancelled" ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                            {item.queueEntry?.status === "Cancelled" ? "Cancelled" : "Completed"}
                          </span>
                          <span className="text-muted-foreground">QueueSmart Clinic</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-full bg-muted p-3 group-hover:bg-accent group-hover:text-white transition-all">
                      <ArrowRight size={18} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
            )}
          </div>

          {/* Corrected Pagination Controls inside return */}
          <footer className="mt-12 flex items-center justify-center gap-6">
            <button 
              onClick={() => setHistoryPage(Math.max(historyPage - 1, 1))}
              disabled={historyPage === 1 || histories.length === 0}
              className="p-2 rounded-full border border-border hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setHistoryPage(pageNum)}
                  className={`h-8 w-8 rounded-lg font-mono text-sm transition-all cursor-pointer ${
                    historyPage === pageNum 
                    ? "bg-accent text-white shadow-lg shadow-accent/20" 
                    : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setHistoryPage(Math.min(historyPage + 1, totalPages))}
              disabled={historyPage === totalPages || histories.length === 0}
              className="p-2 rounded-full border border-border hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
}
