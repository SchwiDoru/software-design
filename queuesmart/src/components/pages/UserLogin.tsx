import Navbar from "../Navbar"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { getDefaultRouteForRole, loginUser, saveAuthenticatedUser } from "../../services/auth"

function UserLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await loginUser({ email, password });
      saveAuthenticatedUser(response);
      navigate(getDefaultRouteForRole(response.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen"> 
      <Navbar />
      <div className="flex justify-center items-center py-20">
        <div className="card w-full max-w-md">
          <h2 className="text-2xl text-center mb-6 font-semibold text-foreground">User Login</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button className="btn-primary w-full py-3" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging In..." : "Login"}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <Link to="/register" className="block text-sm text-accent hover:underline">
              Need an account? Register as a patient
            </Link>
            <Link to="/forgot-password" title="reset password link" className="block text-sm text-accent hover:underline">
              Forgot Password?
            </Link>
            <Link to="/forgot-email" className="block text-sm text-muted-foreground hover:text-foreground">
              Forgot Email? Use Phone Number
            </Link>
            <Link to="/staff-login" className="block text-sm text-muted-foreground hover:text-foreground">
              Staff/Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
export default UserLogin
