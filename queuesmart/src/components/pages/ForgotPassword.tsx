import Navbar from "../Navbar"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, Send } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion" // Reusing your motion library

function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex justify-center items-center py-20">
        <div className="card w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-2">Reset Password</h2>
          
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleSubmit} className="space-y-4"
              >
                <p className="text-muted-foreground text-sm mb-6">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-muted-foreground" size={18} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="input-field pl-10"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  Send Reset Link <Send size={18} />
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-center py-4"
              >
                <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Check your inbox</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  We've sent a password reset link to your email.
                </p>
                <Link to="/login" className="btn-primary block w-full py-3">
                  Return to Login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-accent">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword