import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, AlertCircle, FastForward, XCircle, User, Phone, Mail, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../../admin/AdminLayout";
import { Button } from "../../ui/Button";
import { adminOverride } from "../../../data/patientActions";
import { readQueueEntries, subscribeQueueStore } from "../../../data/queueStore";

const MOCK_HISTORY = [
  {
    id: "VST-9901",
    date: "2026-02-15",
    type: "General Consultation",
    doctor: "Dr. Smith",
    notes: "Patient reported seasonal allergies. Prescribed antihistamines and advised rest.",
    status: "Completed"
  },
  {
    id: "VST-8842",
    date: "2025-11-10",
    type: "Blood Test",
    doctor: "Lab Tech Alpha",
    notes: "Routine checkup. All vitals within normal range. Slight Vitamin D deficiency.",
    status: "waiting"
  }
];
export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPushSuccess, setShowPushSuccess] = useState(false);
  const [showCancelSuccess, setShowCancelSuccess] = useState(false);
const [entries, setEntries] = useState([
  ...readQueueEntries(),
  { 
    userId: id, 
    status: "waiting", 
    position: 3, 
    user: { name: "Test Patient", email: "test@example.com" } 
  }
]);

  useEffect(() => {
    return subscribeQueueStore(() => setEntries(readQueueEntries()));
  }, []);

  const patientId = id;
  const currentEntry = entries.find(e => e.userId === patientId);

  const triggerAction = (action: 'TOP' | 'EMERGENCY' | 'CANCEL') => {   
    adminOverride(patientId as any, action);
    
    if (action === 'EMERGENCY') {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        //navigate('/admin/queue');
      }, 2000);
    }
    if (action === 'TOP') {
      setShowPushSuccess(true);
      // Automatically hide the message after 3 seconds
      setTimeout(() => setShowPushSuccess(false), 3000);
    }

    if (action === 'CANCEL') {
    setShowCancelSuccess(true);
    setTimeout(() => {
      setShowCancelSuccess(false);
      // Optional: navigate('/admin/patients') or let them stay on the cleared page
    }, 2000);
  }
  };

  return (
    <AdminLayout>
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="surface-card p-12 text-center shadow-2xl border-emerald-500/20"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Patient Served</h2>
              <p className="mt-2 text-muted-foreground">Emergency override successful.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
            {showPushSuccess && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-500 text-sm"
            >
                <CheckCircle2 size={16} /> Patient moved to position #1
            </motion.div>
            )}
        </AnimatePresence>
        <AnimatePresence>
        {showCancelSuccess && (
            <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }} 
                animate={{ scale: 1, y: 0 }}
                className="surface-card p-12 text-center shadow-2xl border-red-500/20"
            >
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
                <XCircle size={48} />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Visit Cancelled</h2>
                <p className="mt-2 text-muted-foreground">The appointment has been removed from the queue.</p>
            </motion.div>
            </motion.div>
        )}
        </AnimatePresence>

      <div className="mx-auto w-full max-w-7xl pb-20">
        <Link 
        to="/admin/patients" 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent mb-6 transition-colors"
        >
        <ChevronLeft size={16} /> Back to Directory
        </Link>

        {/* PROFILE HEADER */}
        <div className="surface-card p-8 mb-8 flex flex-col md:flex-row justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-accent/10 flex items-center justify-center text-4xl font-bold text-accent">
              {currentEntry?.user?.name.charAt(0) || "P"}
            </div>
            <div>
              <h1 className="text-4xl font-semibold text-foreground">{currentEntry?.user?.name || "Patient Profile"}</h1>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><User size={14}/> ID: {id}</span>
                <span className="flex items-center gap-1"><Mail size={14}/> {currentEntry?.user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* QUEUE ACTIONS */}
          <div className="lg:col-span-1 space-y-6">
            <div className="surface-card p-6 border-l-4 border-accent">
              <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Live Controls</h2>
              {currentEntry && currentEntry.status === "waiting" ? (
                <div className="space-y-3">
                  <div className="bg-muted/30 rounded-xl p-4 mb-4">
                    <p className="text-sm text-muted-foreground">Currently Waiting in:</p>
                    <p className="font-bold text-foreground">Position #{currentEntry.position}</p>
                  </div>
                  <Button variant="primary" className="w-full justify-start gap-3" onClick={() => triggerAction('TOP')}>
                    <FastForward size={18} /> Push to Top
                  </Button>
                  <Button variant="success" className="w-full justify-start gap-3" onClick={() => triggerAction('EMERGENCY')}>
                    <AlertCircle size={18} /> Emergency Serve
                  </Button>
                  <Button variant="danger" className="w-full justify-start gap-3" onClick={() => triggerAction('CANCEL')}>
                    <XCircle size={18} /> Cancel Visit
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-xl text-center text-sm text-muted-foreground">
                  Patient is not currently in any queue.
                </div>
              )}
            </div>
          </div>

          {/* HISTORY SECTION */}
        <div className="lg:col-span-2">
            <div className="surface-card overflow-hidden">
              <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Clinical Records</h2>
                <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-1 rounded">
                  {MOCK_HISTORY.length} Records
                </span>
              </div>
              
              <div className="divide-y divide-border">
                {MOCK_HISTORY.map((visit) => (
                  <div key={visit.id} className="p-6 hover:bg-muted/5 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-lg text-foreground">{visit.type}</p>
                        <p className="text-sm text-muted-foreground">Dr. {visit.doctor}</p>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{visit.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-accent/20 pl-4 py-1 mt-2">
                      "{visit.notes}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}