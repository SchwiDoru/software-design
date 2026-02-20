import { Link } from "react-router-dom"
import { ShieldCheck, Lock, User } from "lucide-react"

function StaffLogin() {
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
        <div className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Staff ID or Email" 
              className="w-full px-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900 transition-colors" 
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full px-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900 transition-colors" 
            />
          </div>

          <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98]">
            Authorize Login
          </button>
        </div>

        {/* Action Links */}
        <div className="mt-8 text-center space-y-3 pt-6 border-t border-slate-100">
          <Link 
            to="/staff-forgot-password" 
            className="block text-xs font-semibold text-blue-600 hover:underline transition-all"
          >
            Reset Staff Password
          </Link>
          
          <Link 
            to="/idk" 
            className="block text-[10px] text-slate-400 hover:text-blue-500 uppercase tracking-widest transition-all"
          >
            Forgot Staff ID?
          </Link>
        </div>
      </div>
    </div>
  )
}

export default StaffLogin