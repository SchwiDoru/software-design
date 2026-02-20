import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Mail, ArrowLeft, Loader2 } from "lucide-react";

function StaffForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Using SyntheticEvent to avoid deprecation warning
  const handleResetRequest = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      setIsSent(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="card max-w-md w-full border-t-4 border-blue-500 shadow-2xl bg-white p-8">
        
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-50 rounded-full">
            <ShieldAlert className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-mono font-bold uppercase tracking-tight">
            Staff Access Recovery
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            Verification required via internal employee database
          </p>
        </div>

        {!isSent ? (
          <form onSubmit={handleResetRequest} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type="email"
                placeholder="Work Email Address"
                className="input-field pl-10 bg-slate-50 border-slate-200 focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !email}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Verifying Identity...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="text-sm font-medium text-slate-800">
              Recovery protocol initiated.
            </div>
            <p className="text-xs text-slate-500">
              If {email} matches an active staff account, a secure reset link has been dispatched to your work inbox.
            </p>
            <button 
              onClick={() => setIsSent(false)}
              className="text-xs text-blue-600 hover:underline"
            >
              Try a different email
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <Link 
            to="/staff-login"
            className="text-xs font-medium text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Staff Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default StaffForgotPassword;