import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Check, X } from "lucide-react";

function StaffUpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const requirements = [
    { label: "At least 12 characters", met: password.length >= 12 },
    { label: "Contains a number", met: /[0-9]/.test(password) },
    { label: "Contains a symbol (@$!%*?)", met: /[^A-Za-z0-9]/.test(password) },
    { label: "Passwords match", met: password === confirmPassword && password !== "" },
  ];

  const allMet = requirements.every(req => req.met);

  // Changed to SyntheticEvent to avoid deprecation and handleUpdate to match form
  const handleUpdate = (e: React.SyntheticEvent) => { 
    e.preventDefault();
    if (!allMet) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Staff credentials updated successfully.");
      navigate("/staff-login"); 
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="card max-w-md w-full border-t-4 border-blue-500 shadow-2xl bg-white p-8">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-50 rounded-full">
            <ShieldCheck className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-mono font-bold uppercase tracking-tight">
            Rotate Staff Credentials
          </h2>
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Security Level: High</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input
              type="password"
              placeholder="New Secure Password"
              className="input-field pl-10 bg-slate-50 border-slate-200 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input
              type="password"
              placeholder="Confirm Secure Password"
              className="input-field pl-10 bg-slate-50 border-slate-200 focus:border-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {req.met ? (
                  <Check className="text-emerald-500" size={14} />
                ) : (
                  <X className="text-slate-300" size={14} />
                )}
                <span className={req.met ? "text-emerald-700 font-medium" : "text-slate-500"}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          <button 
            type="submit" 
            disabled={loading || !allMet}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-30 disabled:grayscale"
          >
            {loading ? "Syncing with Security Vault..." : "Commit Changes"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate("/staff-login")} 
            className="text-xs text-slate-400 hover:text-blue-600 font-medium"
          >
            Abort and Return to Staff Portal
          </button>
        </div>
      </div>
    </div>
  );
}

export default StaffUpdatePassword;