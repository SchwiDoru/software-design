import Navbar from "../Navbar"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

function UpdatePassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    // In a real app, you'd send the new password to your API here
    setIsSuccess(true);
    
    // Redirect to login after a short delay
    setTimeout(() => navigate("/login"), 3000);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex justify-center items-center py-20 px-4">
        <div className="card w-full max-w-md">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="text-2xl font-semibold mb-2">Create New Password</h2>
                <p className="text-muted-foreground text-sm mb-8">
                  Please enter a strong password that you haven't used before.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-muted-foreground" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="New Password"
                      className="input-field pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-muted-foreground" size={18} />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      className="input-field pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  {/* Password Match Indicator */}
                  {confirmPassword && (
                    <p className={`text-xs ${password === confirmPassword ? "text-emerald-600" : "text-destructive"}`}>
                      {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </p>
                  )}

                  <button 
                    type="submit" 
                    className="btn-primary w-full py-3 mt-4"
                    disabled={!password || password !== confirmPassword}
                  >
                    Update Password
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Password Updated!</h2>
                <p className="text-muted-foreground mb-8">
                  Your password has been changed successfully. Redirecting you to login...
                </p>
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: "100%" }} 
                    transition={{ duration: 3 }}
                    className="bg-emerald-500 h-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default UpdatePassword