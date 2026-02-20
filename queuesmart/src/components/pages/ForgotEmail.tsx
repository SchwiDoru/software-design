import Navbar from "../Navbar"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Phone, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"

function ForgotEmail() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock result - in reality, this comes from your DB
  const foundEmail = "kirito_tester@gmail.com";

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate a DB lookup delay
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const maskEmail = (email: string) => {
    const [name, domain] = email.split("@");
    return `${name.substring(0, 2)}${"*".repeat(name.length - 2)}@${domain}`;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex justify-center items-center py-20 px-4">
        <div className="card w-full max-w-md shadow-xl">
          <h2 className="text-2xl font-semibold mb-2">Find Your Account</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Enter your registered phone number to recover your email address.
          </p>

          {step === 1 ? (
            <form onSubmit={handleLookup} className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 text-muted-foreground" size={18} />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="input-field pl-10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Find My Email"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={32} />
              </div>
              <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">Account found! Your email is:</p>
                <p className="text-lg font-mono font-bold mt-2 tracking-tight">
                  {maskEmail(foundEmail)}
                </p>
              </div>
              <Link to="/login" className="btn-primary block w-full py-3">
                Go to Login
              </Link>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-accent hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotEmail