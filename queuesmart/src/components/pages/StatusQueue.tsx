import Navbar from "../Navbar"; // Added Navbar to match JoinQueue design
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function StatusQueue() {
  const location = useLocation();

  // 1. Initialize states using data passed from JoinQueue
  const [countdown, setCountdown] = useState(location.state?.totalMinutes || 0);
  const [currentPosition, setCurrentPosition] = useState(location.state?.position || 0);
  const [tipIndex, setTipIndex] = useState(0);
  const fullName = location.state?.fullName || "Guest";

  const healthTips = [
    "Fact: Drinking water can boost your metabolism by 24-30%.",
    "Tip: Take a 5-minute walk for every hour you sit.",
    "Fact: Your heart beats about 100,000 times a day.",
    "Tip: Eating slowly helps your brain realize when you're full.",
    "Fact: Humans are the only species known to blush.",
    "Tip: 7-9 hours of sleep is essential for long-term health."
  ];

  // 2. Cycle of tips (Every 10 seconds)
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % healthTips.length);
    }, 10000);
    return () => clearInterval(tipTimer);
  }, [healthTips.length]);

  // 3. MAIN TIMER: Countdown logic (Simulated: 500ms = 1 minute)
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCountdown((prevTime: number) => {
        if (prevTime <= 0) return 0;
        const newTime = prevTime - 1;

        // Decrease position every 15 simulated minutes
        if (newTime > 0 && newTime % 15 === 0) {
          setCurrentPosition((prevPos: number) => (prevPos > 1 ? prevPos - 1 : 1));
        }
        return newTime;
      });
    }, 500); // Testing speed: 1 min per 0.5 sec

    return () => clearInterval(clockTimer);
  }, []);

  const formatWaitTime = (totalMin: number) => {
    if (totalMin <= 0) return "Ready for consultation!";
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
    return `${hours}h ${minutes}m`;
  };

  const expectedTime = new Date(Date.now() + countdown * 60000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />

      <div className="flex flex-col justify-center items-center py-20 relative">
        
        {/* TOP Left Corner: Health Facts Overlay */}
        <div className=" w-full max-w-md p-4 bg-blue-400/10 border border-blue-200 backdrop-blur-md rounded-lg shadow-sm mb-6 transition-all duration-500">
          <p className="text-blue-800 text-xs font-bold uppercase tracking-tight mb-2">
            Did you know?
          </p>
          <p className="text-blue-900 text-sm italic leading-relaxed">
            "{healthTips[tipIndex]}"
          </p>
        </div>

        {/* Main Status Card - Design matched to JoinQueue */}
        <div className="bg-white shadow-lg rounded-xl p-10 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-2">Hello, {fullName}!</h2>
          <p className="text-gray-600 mb-8">
            You are currently <span className="text-blue-600 font-bold">#{currentPosition}</span> in line.
          </p>

          {/* Time Status - Matching the blue box style from JoinQueue */}
          <div className="bg-blue-100 rounded-lg p-6 mb-8 border border-blue-200 shadow-inner">
            <div className="mb-4">
              <p className="text-xs text-blue-500 uppercase font-bold tracking-widest mb-1">
                Estimated Wait Time
              </p>
              <p className="text-2xl font-black text-blue-900">
                {formatWaitTime(countdown)}
              </p>
            </div>
            <div className="pt-4 border-t border-blue-200">
              <p className="text-xs text-blue-500 uppercase font-bold tracking-widest mb-1">
                Expected Consultation
              </p>
              <p className="text-xl font-bold text-blue-800">
                {expectedTime}
              </p>
            </div>
          </div>

          <button className="w-full bg-red-100 text-red-600 py-3 rounded-lg hover:bg-red-200 transition font-medium active:scale-95">
            Leave Queue
          </button>
        </div>

        {/* Navigation Link - Matching JoinQueue design */}
        <div className="mt-6">
          <Link
            to="/"
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium tracking-wide"
          >
            Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}

export default StatusQueue;