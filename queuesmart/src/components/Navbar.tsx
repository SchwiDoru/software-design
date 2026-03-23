import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthenticatedUser, getAuthenticatedUser, getDefaultRouteForRole } from "../services/auth";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const authenticatedUser = getAuthenticatedUser();
  const dashboardPath = authenticatedUser ? getDefaultRouteForRole(authenticatedUser.role) : "/login";
  const primaryLabel = authenticatedUser
    ? authenticatedUser.role === "Patient"
      ? "Dashboard"
      : "Admin Portal"
    : "Login";

  const handleLogout = () => {
    clearAuthenticatedUser();
    setIsMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="text-xl font-semibold tracking-tight sm:text-2xl">
          QueueSmart <span className="gradient-text">Clinic</span>
        </Link>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-foreground md:hidden"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <Link 
            to="/history" 
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            History
          </Link>
          <Link
            to="/join"
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Join Queue
          </Link>
          <Link
            to="/dashboard"
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Patient Status
          </Link>
          <Link
            to={dashboardPath}
            className="rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-5 py-2 text-sm font-medium text-white shadow-[0_4px_14px_rgba(0,82,255,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            {primaryLabel}
          </Link>
          {authenticatedUser ? (
            <>
              <span className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-muted-foreground">
                {authenticatedUser.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Logout
              </button>
            </>
          ) : null}
        </div>
      </nav>

      {isMenuOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-2">
            <Link
              to="/join"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              Join Queue
            </Link>
            <Link
              to="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              Patient Status
            </Link>
            <Link
              to={dashboardPath}
              onClick={() => setIsMenuOpen(false)}
              className="rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-3 py-3 text-center text-sm font-medium text-white"
            >
              {primaryLabel}
            </Link>
            {authenticatedUser ? (
              <>
                <div className="rounded-xl border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
                  Signed in as {authenticatedUser.name}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted"
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar
