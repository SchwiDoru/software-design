import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "../Navbar"; 
import { useUIStore } from "../../data/historyPageBack";

// Define your data here so the component can find it
const pastQueues = [
  { id: "q-101", date: "Oct 24, 2025", service: "General Consultation", status: "Served", clinic: "City Health Hub" },
  { id: "q-102", date: "Sep 12, 2025", service: "Blood Work", status: "Cancelled", clinic: "City Health Hub" },
  { id: "q-103", date: "Aug 05, 2025", service: "Vaccination", status: "Served", clinic: "Westside Medical" },
  { id: "q-104", date: "Jul 19, 2025", service: "Dermatology", status: "Served", clinic: "Skin & Care Clinic" },
  { id: "q-105", date: "Jun 30, 2025", service: "Consultation", status: "Served", clinic: "City Health Hub" },
  { id: "q-106", date: "May 14, 2025", service: "Physical Therapy", status: "Cancelled", clinic: "Rehab Center" },
];

export default function HistoryPage() {
  const { historyPage, setHistoryPage } = useUIStore();
  const itemsPerPage = 4;

  const totalPages = Math.ceil(pastQueues.length / itemsPerPage);
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
            <AnimatePresence mode="wait">
              {currentItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link 
                    to={`/history/${item.id}`}
                    className="surface-card group flex items-center justify-between p-6 hover:border-accent/40"
                  >
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:block text-center min-w-[60px]">
                        <p className="font-mono text-[10px] uppercase tracking-tighter text-muted-foreground">
                          {item.date.split(' ')[0]}
                        </p>
                        <p className="text-2xl font-bold">{item.date.split(' ')[1].replace(',', '')}</p>
                      </div>
                      <div className="h-10 w-[1px] bg-border hidden sm:block" />
                      <div>
                        <h3 className="text-xl font-medium">{item.service}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className={item.status === 'Served' ? 'text-emerald-600 flex items-center gap-1' : 'text-rose-500 flex items-center gap-1'}>
                            {item.status === 'Served' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            {item.status}
                          </span>
                          <span className="text-muted-foreground">• {item.clinic}</span>
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
          </div>

          {/* Corrected Pagination Controls inside return */}
          <footer className="mt-12 flex items-center justify-center gap-6">
            <button 
              onClick={() => setHistoryPage(Math.max(historyPage - 1, 1))}
              disabled={historyPage === 1}
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
              disabled={historyPage === totalPages}
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