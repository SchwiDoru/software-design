import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, AlertCircle, FastForward, XCircle, User, Mail, CheckCircle2, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../../admin/AdminLayout";
import { Button } from "../../ui/Button";
import { adminOverride } from "../../../data/patientActions";
import { readQueueEntries, subscribeQueueStore } from "../../../data/queueStore";
import { getPatientByEmail } from "../../../services/patients";
import type { PatientProfile } from "../../../types";

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
    status: "Waiting"
  }
];
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
export default function PatientDetail() {
  const { id } = useParams();
  const patientEmail = decodeURIComponent(id ?? "");
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPushSuccess, setShowPushSuccess] = useState(false);
  const [showCancelSuccess, setShowCancelSuccess] = useState(false);
const [entries, setEntries] = useState([
  ...readQueueEntries(),
  { 
    id: -1,
    userId: id, 
    status: "Waiting", 
    position: 3, 
    queueId: 1,
    joinTime: new Date().toISOString(),
    priority: "Low",
    user: { id: -1, name: "Test Patient", email: "test@example.com", role: "Patient" } 
  }
]);

  useEffect(() => {
    return subscribeQueueStore(() => setEntries(readQueueEntries()));
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadPatient = async () => {
      try {
        if (!patientEmail) {
          if (!isCancelled) {
            setPatient(null);
          }
          return;
        }

        const nextPatient = await getPatientByEmail(patientEmail);
        if (!isCancelled) {
          setPatient(nextPatient);
        }
      } catch (error) {
        console.warn("Failed to load patient detail", error);
        if (!isCancelled) {
          setPatient(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingPatient(false);
        }
      }
    };

    void loadPatient();

    return () => {
      isCancelled = true;
    };
  }, [patientEmail, showSuccess, showPushSuccess, showCancelSuccess]);

  const patientId = patientEmail;
  const currentEntry = patient?.currentEntry ?? entries.find(e => e.userId === patientId);

  const triggerAction = async (action: 'TOP' | 'EMERGENCY' | 'CANCEL') => {
    if (currentEntry) {
      try {
        if (action === "TOP") {
          await fetch(`${API_URL}/queueentry/${currentEntry.id}/position`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ position: 0 })
          });
        }

        if (action === "EMERGENCY") {
          await fetch(`${API_URL}/queueentry/${currentEntry.id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "InProgress" })
          });
        }

        if (action === "CANCEL") {
          await fetch(`${API_URL}/queueentry/${currentEntry.id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Removed" })
          });
        }
      } catch (error) {
        console.warn("Failed to update patient queue action", error);
      }
    } else {
      adminOverride(patientId as any, action);
    }
    
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

  if (isLoadingPatient || patient || !patient) {
    return (
      <AdminLayout>
        <AnimatePresence>
          {showPushSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-500 text-sm"
            >
              <CheckCircle2 size={16} /> Patient queue action applied
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

          {isLoadingPatient ? (
            <div className="surface-card p-8 text-muted-foreground">Loading patient details...</div>
          ) : patient ? (
            <>
              <div className="surface-card p-8 mb-8 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-accent/10 flex items-center justify-center text-4xl font-bold text-accent">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-4xl font-semibold text-foreground">{patient.name}</h1>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><User size={14}/> {patient.email}</span>
                      <span className="flex items-center gap-1"><Mail size={14}/> {patient.email}</span>
                      <span className="flex items-center gap-1"><Phone size={14}/> {patient.phoneNumber || "No phone on file"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  <div className="surface-card p-6 border-l-4 border-accent">
                    <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Live Controls</h2>
                    {currentEntry && currentEntry.status === "Waiting" ? (
                      <div className="space-y-3">
                        <div className="bg-muted/30 rounded-xl p-4 mb-4">
                          <p className="text-sm text-muted-foreground">Currently Waiting in:</p>
                          <p className="font-bold text-foreground">Position #{(currentEntry.position ?? 0) + 1}</p>
                        </div>
                        <Button variant="primary" className="w-full justify-start gap-3" onClick={() => void triggerAction('TOP')}>
                          <FastForward size={18} /> Push to Top
                        </Button>
                        <Button variant="success" className="w-full justify-start gap-3" onClick={() => void triggerAction('EMERGENCY')}>
                          <AlertCircle size={18} /> Mark In Progress
                        </Button>
                        <Button variant="danger" className="w-full justify-start gap-3" onClick={() => void triggerAction('CANCEL')}>
                          <XCircle size={18} /> Remove Visit
                        </Button>
                      </div>
                    ) : currentEntry ? (
                      <div className="p-4 bg-muted rounded-xl text-center text-sm text-muted-foreground">
                        Patient queue status: <span className="font-medium text-foreground">{currentEntry.status}</span>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted rounded-xl text-center text-sm text-muted-foreground">
                        Patient is not currently in any active queue.
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="surface-card overflow-hidden">
                    <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Clinical Records</h2>
                      <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-1 rounded">
                        {patient.histories.length} Records
                      </span>
                    </div>
                    
                    <div className="divide-y divide-border">
                      {patient.histories.length > 0 ? (
                        patient.histories.map((visit) => (
                          <div key={visit.historyId} className="p-6 hover:bg-muted/5 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-lg text-foreground">
                                  {visit.queueEntry?.queue?.service?.name ?? visit.historyDetails[0]?.serviceType ?? "Clinic Visit"}
                                </p>
                                <p className="text-sm text-muted-foreground">{visit.historyDetails[0]?.diagnosis || "No diagnosis recorded"}</p>
                              </div>
                              <span className="text-xs font-mono text-muted-foreground">{new Date(visit.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-accent/20 pl-4 py-1 mt-2">
                              "{visit.historyDetails[0]?.assessment || "No clinical notes recorded."}"
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">No visit history recorded for this patient yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="surface-card p-8 text-muted-foreground">Patient details could not be found.</div>
          )}
        </div>
      </AdminLayout>
    );
  }

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
              {currentEntry && currentEntry.status === "Waiting" ? (
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
