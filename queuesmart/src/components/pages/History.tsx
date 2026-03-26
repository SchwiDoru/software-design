import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Navbar from "../Navbar"; 
import { useUIStore } from "../../data/historyPageBack";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export default function HistoryPage() {
  const { historyPage, setHistoryPage } = useUIStore();
  const [pastQueues, setPastQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 4;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/History`);
        if (!response.ok) throw new Error("Failed to fetch history");
        const data = await response.json();
        
        const records = Array.isArray(data) ? data : [];
        setPastQueues(records);

        // If current page is now empty because of a new fetch, reset to 1
        if (records.length > 0 && (historyPage - 1) * itemsPerPage >= records.length) {
          setHistoryPage(1);
        }
      } catch (error) {
        setPastQueues([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // FIX: Ensure totalPages is at least 1 so "Page 1" always exists
  const totalPages = Math.max(Math.ceil(pastQueues.length / itemsPerPage), 1);
  const startIndex = (historyPage - 1) * itemsPerPage;
  const currentItems = pastQueues.slice(startIndex, startIndex + itemsPerPage);

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
            Review your clinical outcomes and past visits.
          </p>
        </div>
      </header>

      <main className="flex-grow bg-white px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Loading your medical history...</p>
              </div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  {currentItems.length > 0 ? (
                    currentItems.map((item) => (
                      <motion.div
                        key={item.id || item.historyID}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link 
                          to={`/history/${item.id || item.historyID}`}
                          className="surface-card group flex items-center justify-between p-6 hover:border-accent/40"
                        >
                          <div className="flex items-center gap-6">
                            <div className="hidden sm:block text-center min-w-[60px]">
                              <p className="font-mono text-[10px] uppercase tracking-tighter text-muted-foreground">
                                {new Date(item.date || item.completedAt).toLocaleString('default', { month: 'short' })}
                              </p>
                              <p className="text-2xl font-bold">
                                {new Date(item.date || item.completedAt).getDate()}
                              </p>
                            </div>
                            <div className="h-10 w-[1px] bg-border hidden sm:block" />
                            <div>
                              <h3 className="text-xl font-medium">{item.service || item.queueEntry?.queue?.service?.name}</h3>
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                <span className={(item.status === 'Served' || item.status === 'Completed') ? 'text-emerald-600 flex items-center gap-1' : 'text-rose-500 flex items-center gap-1'}>
                                  {(item.status === 'Served' || item.status === 'Completed') ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                  {item.status}
                                </span>
                                <span className="text-muted-foreground">• {item.clinic || "City Health Hub"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-full bg-muted p-3 group-hover:bg-accent group-hover:text-white transition-all">
                            <ArrowRight size={18} />
                          </div>
                        </Link>
                      </motion.div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">
                      No past visit records found.
                    </div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          <footer className="mt-12 flex items-center justify-center gap-6">
            <button 
              onClick={() => setHistoryPage(Math.max(historyPage - 1, 1))}
              disabled={historyPage === 1 || loading}
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
              disabled={historyPage === totalPages || loading}
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