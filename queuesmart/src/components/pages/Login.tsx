import { useState } from "react"
import Navbar from "../Navbar"
import Button from "../ui/Button"
import Card from "../ui/Card"
import { Input } from "../ui/Input"
import SectionLabel from "../ui/SectionLabel"
import type { UserRole } from "../../types/clinic"

const roleOptions: UserRole[] = ["Patient", "Staff", "Admin"]

function Login() {
  const [role, setRole] = useState<UserRole>("Patient")

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Navbar />

      <main className="app-container flex min-h-[calc(100vh-4rem)] items-center py-10 sm:py-16">
        <Card className="mx-auto w-full max-w-xl" featured>
          <SectionLabel>Secure Access</SectionLabel>
          <h1 className="mt-4 text-4xl tracking-[-0.01em] sm:text-5xl">
            {role} Login
          </h1>
          <p className="mt-3 text-sm sm:text-base">
            Use your registered credentials to access your queue and clinic tools.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 rounded-xl bg-[color:var(--muted)] p-2">
            {roleOptions.map((option) => (
              <button
                className={`h-11 rounded-lg text-sm font-medium transition-all duration-200 ${
                  role === option
                    ? "bg-white text-[#0052FF] shadow-[0_4px_8px_rgba(15,23,42,0.08)]"
                    : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                }`}
                key={option}
                onClick={() => setRole(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>

          <form className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-[color:var(--foreground)]" htmlFor="login-email">
                Email
              </label>
              <Input id="login-email" placeholder="name@clinic.com" required type="email" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-[color:var(--foreground)]" htmlFor="login-password">
                Password
              </label>
              <Input id="login-password" placeholder="Enter your password" required type="password" />
            </div>
            <Button className="mt-2 w-full" size="lg" type="submit">
              Continue as {role}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  )
}

export default Login
