import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ShieldCheck, Lock, User } from "lucide-react"
import { getDefaultRouteForRole } from "../../services/auth"
import { useAuth } from "../auth/AuthProvider"

function StaffLogin() {
  const navigate = useNavigate();
  const { loginAsStaff } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await loginAsStaff({ email, password });
      navigate(getDefaultRouteForRole(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to authorize login right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* bg-slate-900 ensures this page looks different from the patient side */
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4"> 
      <div className="card w-full max-w-md border-t-4 border-blue-500 shadow-2xl bg-white p-8">
        
        {/* Header Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-50 rounded-full">
            <ShieldCheck className="text-blue-600" size={40} />
          </div>
        </div>

        <h2 className="text-xl font-mono font-bold text-center mb-8 uppercase tracking-tight text-slate-800">
          Staff Portal Access
        </h2>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              type="email" 
              placeholder="Work Email" 
              className="w-full px-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900 transition-colors" 
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full px-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900 transition-colors" 
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98]" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Authorizing..." : "Authorize Login"}
          </button>
        </form>

        {/* Action Links */}
        <div className="mt-8 text-center space-y-3 pt-6 border-t border-slate-100">
          <Link 
            to="/staff-forgot-password" 
            className="block text-xs font-semibold text-blue-600 hover:underline transition-all"
          >
            Reset Staff Password
          </Link>
          
          <Link 
            to="/login" 
            className="block text-[10px] text-slate-400 hover:text-blue-500 uppercase tracking-widest transition-all"
          >
            Back to Patient Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default StaffLogin
