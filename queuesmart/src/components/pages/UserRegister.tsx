import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import { getDefaultRouteForRole } from "../../services/auth";
import { useAuth } from "../auth/AuthProvider";

function UserRegister() {
  const navigate = useNavigate();
  const { registerAsPatient } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await registerAsPatient({
        name,
        email,
        password,
        confirmPassword,
        phone: phone.trim() || undefined
      });

      navigate(getDefaultRouteForRole(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex justify-center items-center py-20 px-4">
        <div className="card w-full max-w-md">
          <h2 className="text-2xl text-center mb-2 font-semibold text-foreground">Create Patient Account</h2>
          <p className="text-center text-sm text-muted-foreground mb-6">
            Register as a patient. Staff and admin accounts are created internally.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              className="input-field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="input-field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="input-field"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="input-field"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number (Optional)"
              className="input-field"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button type="submit" className="btn-primary w-full py-3" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <Link to="/login" className="block text-sm text-accent hover:underline">
              Already have an account? Log in
            </Link>
            <Link to="/staff-login" className="block text-sm text-muted-foreground hover:text-foreground">
              Staff/Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserRegister;
