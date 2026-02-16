import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "../lib/cn"

const navItems = [
  { label: "Home", to: "/" },
  { label: "Join Queue", to: "/join" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Login", to: "/login" },
]

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[rgba(250,250,250,0.92)] backdrop-blur-md">
      <div className="app-container flex h-16 items-center justify-between">
        <Link
          className="text-xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-2xl"
          to="/"
        >
          Queue<span className="gradient-text">Smart</span> Clinic
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-[#0052FF]/10 text-[#0052FF]"
                    : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                )}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <button
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--border)] text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--muted)] md:hidden"
          onClick={() => setIsOpen((open) => !open)}
          type="button"
        >
          <span className="sr-only">Menu</span>
          <span className="block h-0.5 w-5 bg-current" />
          <span className="absolute block h-0.5 w-5 translate-y-1.5 bg-current" />
          <span className="absolute block h-0.5 w-5 -translate-y-1.5 bg-current" />
        </button>
      </div>

      {isOpen && (
        <nav className="border-t border-[color:var(--border)] bg-[color:var(--background)] md:hidden">
          <div className="app-container grid gap-2 py-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to
              return (
                <Link
                  className={cn(
                    "rounded-lg px-4 py-3 text-sm font-medium",
                    isActive
                      ? "bg-[#0052FF]/10 text-[#0052FF]"
                      : "text-[color:var(--muted-foreground)]"
                  )}
                  key={item.to}
                  onClick={() => setIsOpen(false)}
                  to={item.to}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </header>
  )
}

export default Navbar
