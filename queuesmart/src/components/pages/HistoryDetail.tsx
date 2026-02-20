import { Link } from "react-router-dom";
// Added CheckCircle2 to imports
import { Pill, ChevronLeft, Activity, Stethoscope, Microscope, CheckCircle2 } from "lucide-react";
import Navbar from "../Navbar";

export default function HistoryDetailPage() {
  const mockDetail = {
    id: "QS-2025-1024-99",
    date: "October 24, 2025",
    clinic: "City Health Hub",
    encounters: [
      {
        service: "Initial Assessment",
        type: "Consultation",
        assessment: "Patient reported sharp chest pain and shortness of breath starting 2 hours ago. Heart rate elevated at 110bpm.",
        diagnosis: "Suspected Tachycardia",
        prescriptions: [{ name: "Aspirin 81mg", instructions: "1 tablet • Immediate" }]
      },
      {
        service: "Diagnostic Imaging",
        type: "Radiology",
        assessment: "Chest X-Ray performed to rule out pulmonary issues. Lungs appear clear; no signs of pneumonia.",
        diagnosis: "Normal Lung Function",
        prescriptions: []
      },
      {
        service: "Laboratory Work",
        type: "Blood Test",
        assessment: "Full blood count and cardiac enzyme markers (Troponin) requested. Results pending further review.",
        diagnosis: "Pending Results",
        prescriptions: [{ name: "Beta Blocker", instructions: "1 tablet • 2x daily" }]
      }
    ]
  };

  // ADD THIS LINE: It gathers all prescriptions from all encounters into one list
  const allMeds = mockDetail.encounters.flatMap(enc => enc.prescriptions);

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
            <p className="mt-2 text-white/60">{mockDetail.date} • {mockDetail.clinic}</p>
          </div>
          
          <div className="hidden md:block bg-white/5 border border-white/10 rounded-2xl p-4 text-right">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-1">Queue Reference</p>
            <p className="text-white font-mono text-lg font-bold">{mockDetail.id}</p>
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

          {mockDetail.encounters.map((enc, idx) => (
            <div key={idx} className="surface-card p-8 relative overflow-hidden group">
              <div className="absolute top-6 right-6 text-muted-foreground/10 group-hover:text-accent/10 transition-colors">
                {enc.type === "Consultation" && <Stethoscope size={64} />}
                {enc.type === "Radiology" && <Activity size={64} />}
                {enc.type === "Blood Test" && <Microscope size={64} />}
              </div>

              <div className="relative z-10">
                <p className="text-accent font-mono text-[10px] uppercase tracking-widest mb-2">{enc.type}</p>
                <h3 className="text-2xl font-bold mb-6">{enc.service}</h3>
                
                <div className="space-y-6">
                  <div>
                    <h5 className="text-xs font-mono uppercase text-muted-foreground mb-2">Clinical Assessment</h5>
                    <p className="text-foreground/80 leading-relaxed italic border-l-2 border-muted pl-4">"{enc.assessment}"</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-mono uppercase text-muted-foreground mb-1">Diagnosis</h5>
                    <p className="text-lg font-medium">{enc.diagnosis}</p>
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
                allMeds.map((p, i) => (
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