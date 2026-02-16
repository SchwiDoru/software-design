import { Link } from "react-router-dom"
import Navbar from "../Navbar"
import Card from "../ui/Card"
import SectionLabel from "../ui/SectionLabel"
import { buttonClasses } from "../ui/Button"
import { clinicBusinessRules, clinicServices, getWaitingEntries } from "../../data/mockClinic"

const waitingPatients = getWaitingEntries().length

function Home() {
  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Navbar />

      <main>
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute -left-28 -top-20 h-72 w-72 rounded-full bg-[#0052FF]/10 blur-3xl" />
          <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-[#4D7CFF]/10 blur-3xl" />

          <div className="app-container grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <SectionLabel>Walk-In Queue Platform</SectionLabel>
              <h1 className="text-[2.75rem] leading-[1.05] tracking-[-0.02em] sm:text-6xl lg:text-[5.25rem]">
                Skip the crowd,
                <span className="gradient-text"> not your turn.</span>
              </h1>
              <p className="max-w-xl text-base text-[color:var(--muted-foreground)] sm:text-lg">
                QueueSmart helps clinic visitors sign up quickly, receive updates,
                and show up right when they are about to be called.
              </p>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Link className={buttonClasses("primary", "lg", "w-full sm:w-auto")} to="/join">
                  Join Queue
                </Link>
                <Link className={buttonClasses("secondary", "lg", "w-full sm:w-auto")} to="/dashboard">
                  Staff Dashboard
                </Link>
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-[color:var(--muted-foreground)]">
                Open Daily 9:00 AM - 5:00 PM
              </p>
            </div>

            <div className="relative hidden min-h-[420px] lg:block">
              <div className="rotate-slow absolute inset-8 rounded-full border border-dashed border-[#0052FF]/35" />
              <div className="absolute left-5 top-6 h-14 w-14 rounded-2xl bg-gradient-to-br from-[#0052FF] to-[#4D7CFF] shadow-[0_8px_24px_rgba(0,82,255,0.35)]" />

              <Card className="float-card-a absolute left-12 top-20 w-72">
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#0052FF]">
                  Live Queue
                </p>
                <p className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
                  {waitingPatients}
                </p>
                <p className="mt-1 text-sm">patients currently waiting</p>
              </Card>

              <Card className="float-card-b absolute bottom-12 right-4 w-72">
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#0052FF]">
                  Business Rule
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">
                  {clinicBusinessRules.oneActiveQueuePerPatient}
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="app-container">
            <SectionLabel>Services</SectionLabel>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {clinicServices.map((service) => (
                <Card className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_25px_rgba(15,23,42,0.1)]" key={service.id}>
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052FF] to-[#4D7CFF] text-sm font-semibold text-white">
                    {service.id}
                  </div>
                  <h3 className="text-xl">{service.name}</h3>
                  <p className="mt-2 text-sm">
                    {service.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between text-sm">
                    <span className="rounded-full bg-[#0052FF]/8 px-3 py-1 text-[#0052FF]">
                      {service.priority} Priority
                    </span>
                    <span className="font-medium text-[color:var(--foreground)]">
                      {service.durationMinutes} min
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#0F172A] py-20 text-slate-100">
          <div className="dot-pattern absolute inset-0 opacity-35" />
          <div className="app-container relative">
            <SectionLabel>How It Works</SectionLabel>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <Card className="border-slate-700/60 bg-slate-900/55 text-slate-100">
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-slate-300">Step 1</p>
                <h3 className="mt-2 text-2xl text-slate-50">Check In</h3>
                <p className="mt-3 text-sm text-slate-300">
                  Enter your details and select the service you need at the clinic.
                </p>
              </Card>
              <Card className="border-slate-700/60 bg-slate-900/55 text-slate-100">
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-slate-300">Step 2</p>
                <h3 className="mt-2 text-2xl text-slate-50">Wait Smarter</h3>
                <p className="mt-3 text-sm text-slate-300">
                  Keep your spot while receiving SMS or email notifications as your turn gets closer.
                </p>
              </Card>
              <Card className="border-slate-700/60 bg-slate-900/55 text-slate-100">
                <p className="font-mono text-xs uppercase tracking-[0.12em] text-slate-300">Step 3</p>
                <h3 className="mt-2 text-2xl text-slate-50">Get Served</h3>
                <p className="mt-3 text-sm text-slate-300">
                  Arrive at the consultation area when called and the staff serves you in order.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home
