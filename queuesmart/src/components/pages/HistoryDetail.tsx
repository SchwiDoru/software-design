import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom"; // Added useParams
import { Pill, ChevronLeft, Activity, Stethoscope, Microscope, CheckCircle2, Loader2 } from "lucide-react";
import Navbar from "../Navbar";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export default function HistoryDetailPage() {
  const { id } = useParams(); // Grabs the ID from the URL
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisitDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/History/${id}`);
        if (!response.ok) throw new Error("Failed to fetch visit details");
        const data = await response.json();
        setVisit(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchVisitDetail();
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p>Loading visit details...</p>
        </div>
      </div>
    );
  }

  // Error state if no visit found
  if (!visit) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center">
          <p className="text-xl font-bold">Visit not found</p>
          <Link to="/history" className="text-accent hover:underline mt-4">Back to History</Link>
        </div>
      </div>
    );
  }

  // Gathers all prescriptions from all encounters into one list
  // Note: Using optional chaining ?. in case encounters or prescriptions are missing
  const allMeds = visit.encounters?.flatMap((enc: any) => enc.prescriptions || []) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header Section */}
      <header className="inverted-section pt-20 pb-16 px-6">
        <div className="mx-auto max-w-6xl flex justify-between items-end">
          <div>
            <Link to="/history" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest mb-6">
              <ChevronLeft size={14} /> Back to History
            </Link>
            <h1 className="text-5xl text-white font-display">Visit <span className="gradient-text">Details</span></h1>
            <p className="mt-2 text-white/60">
              {new Date(visit.date || visit.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • {visit.clinic || "City Health Hub"}
            </p>
          </div>
          
          <div className="hidden md:block bg-white/5 border border-white/10 rounded-2xl p-4 text-right">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-1">Queue Reference</p>
            <p className="text-white font-mono text-lg font-bold">{visit.id || visit.historyID}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12">
        
        {/* Left: Stacked Service Encounters */}
        <section className="space-y-6">
          <div className="section-label mb-2">
            <span className="section-label-dot" />
            <span className="section-label-text">Service Breakdown</span>
          </div>

          {visit.encounters?.map((enc: any, idx: number) => (
            <div key={idx} className="surface-card p-8 relative overflow-hidden group">
              <div className="absolute top-6 right-6 text-muted-foreground/10 group-hover:text-accent/10 transition-colors">
                {(enc.type === "Consultation" || enc.type === "General") && <Stethoscope size={64} />}
                {enc.type === "Radiology" && <Activity size={64} />}
                {enc.type === "Blood Test" && <Microscope size={64} />}
              </div>

              <div className="relative z-10">
                <p className="text-accent font-mono text-[10px] uppercase tracking-widest mb-2">{enc.type}</p>
                <h3 className="text-2xl font-bold mb-6">{enc.service}</h3>
                
                <div className="space-y-6">
                  <div>
                    <h5 className="text-xs font-mono uppercase text-muted-foreground mb-2">Clinical Assessment</h5>
                    <p className="text-foreground/80 leading-relaxed italic border-l-2 border-muted pl-4">
                      "{enc.assessment || "No assessment notes provided."}"
                    </p>
                  </div>
                  <div>
                    <h5 className="text-xs font-mono uppercase text-muted-foreground mb-1">Diagnosis</h5>
                    <p className="text-lg font-medium">{enc.diagnosis || "Finalizing..."}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Right Column: Prescription Check */}
        <aside className="lg:sticky lg:top-8 h-fit">
          <div className="bg-foreground rounded-[2.5rem] p-10 text-background shadow-2xl">
            <div className="flex items-center gap-3 mb-10">
              <Pill className="text-accent-secondary" size={24} />
              <h4 className="font-mono text-xs uppercase tracking-widest text-accent-secondary font-bold">Prescription Plan</h4>
            </div>

            <div className="space-y-8">
              {allMeds.length > 0 ? (
                allMeds.map((p: any, i: number) => (
                  <div key={i} className="border-l border-white/10 pl-6 group">
                    <p className="text-xl text-white font-medium group-hover:text-accent-secondary transition-colors">
                      {p.name}
                    </p>
                    <p className="text-sm text-white/40 mt-1">{p.instructions}</p>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-white/10 rounded-3xl">
                  <div className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="text-accent-secondary" size={24} />
                  </div>
                  <p className="text-white font-medium">No Prescriptions</p>
                  <p className="text-white/30 text-xs mt-1 max-w-[180px] mx-auto">
                    No medications were issued during this visit.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}