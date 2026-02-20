import Navbar from "../Navbar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Users, Clock, ArrowRight, AlertCircle } from "lucide-react";

// Corrected paths: ../../ reaches the root 'data' folder from 'components/pages'
import hoshinoImg from "../../data/hoshino.jpg";
import kaguyaImg from "../../data/kaguya.jpg";
import yuiImg from "../../data/yui.jpg";
import nyanImg from "../../data/nyan.jpg";

function JoinQueue() {
  const [fullName, setFullName] = useState("");
  const [showError, setShowError] = useState(false); // New state for error popup
  const navigate = useNavigate();
  const minutesPerPerson = 15;

  const services = [
    { id: "gen", name: "General Consultation", currentQueue: 7, color: "bg-blue-400", img: hoshinoImg },
    { id: "vax", name: "Vaccinations", currentQueue: 3, color: "bg-pink-400", img: kaguyaImg },
    { id: "med", name: "Medical Certificate", currentQueue: 2, color: "bg-purple-400", img: yuiImg },
    { id: "emer", name: "Emergency", currentQueue: 1, color: "bg-red-500", img: nyanImg },
  ];

  const handleJoin = (service: any) => {
    if (!fullName.trim()) {
      setShowError(true); // Trigger popup instead of alert
      return;
    }

    const existingQueue = localStorage.getItem("activeQueue");
    if (existingQueue) {
      alert(`Conflict: Already in ${existingQueue} line!`);
      return;
    }

    localStorage.setItem("activeQueue", service.name);
    
    navigate("/status", {
      state: {
        totalMinutes: (service.currentQueue + 1) * minutesPerPerson,
        fullName: fullName,
        position: service.currentQueue + 1,
        serviceName: service.name,
        showSuccessModal: true 
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Navbar />

      {/* ERROR POPUP (Replaces the Alert) */}
      {showError && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2 text-red-500 mb-4">
              <AlertCircle size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Identification Required</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Identify yourself, Peasant!</h2>
            <p className="text-slate-500 text-sm mb-6">Please enter your name before selecting a service.</p>
            <button 
              onClick={() => setShowError(false)} 
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Schale Clinic Registration</h1>
          <input
            type="text"
            placeholder="Enter Student/Patient Name"
            className="mt-6 w-full max-w-md px-6 py-3 border-2 border-blue-100 rounded-full focus:border-blue-500 outline-none shadow-sm transition-all"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s) => (
            <div key={s.id} className="bg-white rounded-3xl overflow-hidden shadow-md border border-slate-100 hover:shadow-xl transition-all group">
              {/* CENTERED IMAGE CONTAINER */}
              <div className={`${s.color} h-48 relative overflow-hidden flex items-center justify-center`}>
                <img 
                  src={s.img} 
                  alt={s.name} 
                  className="relative h-44 w-auto object-contain z-10 group-hover:scale-110 transition-transform duration-300" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-20" />
                <h3 className="absolute bottom-4 left-0 w-full text-center text-white font-bold uppercase tracking-widest text-[10px] z-30">
                  {s.name}
                </h3>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                  <span className="flex items-center gap-1"><Users size={12}/> {s.currentQueue} Waiting</span>
                  <span className="flex items-center gap-1 text-blue-500"><Clock size={12}/> {s.currentQueue * minutesPerPerson}m</span>
                </div>
                <button onClick={() => handleJoin(s)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs hover:bg-blue-600 transition-all flex justify-center items-center gap-2 uppercase tracking-widest">
                  Join Queue <ArrowRight size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default JoinQueue;