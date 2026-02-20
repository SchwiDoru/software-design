import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "../Navbar";

function StatusQueue() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(location.state?.showSuccessModal || false);
  const [countdown, setCountdown] = useState(location.state?.totalMinutes || 0);
  const [position, setPosition] = useState(location.state?.position || 0);

  const serviceName = location.state?.serviceName || "General";

  // Clear success modal after user interacts or 5 seconds
  const dismissModal = () => setShowModal(false);

  const handleLeave = () => {
    localStorage.removeItem("activeQueue"); // Unlock queue
    navigate("/join");
  };

  return (
    <div className="min-h-screen bg-blue-50 relative">
      <Navbar />

      {/* SUCCESS MODAL OVERLAY - Matched to image_a82aa5.png */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">Registration Success</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">You have joined the line</h2>
            <p className="text-slate-500 text-sm mb-6">
              You are assigned to <span className="font-bold text-slate-700">{serviceName}</span>. 
              Position #{position}. Please stay ready.
            </p>
            <div className="flex gap-3">
              <button onClick={dismissModal} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm">I am ready</button>
              <button onClick={dismissModal} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN STATUS UI */}
      <div className="flex flex-col items-center py-20 px-4">
        <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-xl text-center">
            <div className="bg-slate-900 text-white inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase mb-4 tracking-widest">
                {serviceName} Department
            </div>
            <h1 className="text-4xl font-black mb-1">#{position}</h1>
            <p className="text-slate-400 text-sm mb-8 uppercase font-bold tracking-widest">Your Position</p>

            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-8">
                <p className="text-xs font-bold text-blue-400 uppercase mb-2">Estimated Arrival</p>
                <p className="text-3xl font-black text-blue-900">{countdown} Minutes</p>
            </div>

            <button onClick={handleLeave} className="text-red-500 font-bold text-sm hover:underline">
                Leave Queue
            </button>
        </div>
      </div>
    </div>
  );
}
export default StatusQueue;