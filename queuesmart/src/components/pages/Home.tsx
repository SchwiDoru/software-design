import Navbar from "../Navbar";
import { Link } from "react-router-dom";
import { MOCK_ENTRIES, MOCK_QUEUES } from "../../data/mockData";

function Home() {
  const totalWaiting = MOCK_ENTRIES.filter((entry) => entry.status === "waiting").length;
  const activeServices = MOCK_QUEUES.filter((queue) => queue.status === "open");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
        <div className="pointer-events-none absolute -right-28 top-16 h-72 w-72 rounded-full bg-accent/10 blur-[90px]" />
        <div className="pointer-events-none absolute -left-24 bottom-10 h-80 w-80 rounded-full bg-accent-secondary/10 blur-[110px]" />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="section-label mb-6">
              <span className="section-label-dot" />
              <span className="section-label-text">Digital Queue Desk</span>
            </div>

            <h1 className="text-[2.75rem] leading-[1.05] text-foreground sm:text-6xl lg:text-[5.25rem]">
              Smart clinic flow for <span className="gradient-text">faster visits</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Check in online, track your live queue position, and get notified when it is your turn.
              Open daily from 9:00 AM to 5:00 PM with 30-minute consultation windows.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/join"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-8 font-medium text-white shadow-[0_4px_14px_rgba(0,82,255,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
              >
                Join Queue
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-white px-8 font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-muted"
              >
                View Patient Dashboard
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative mx-auto h-[430px] w-[420px]">
              <div
                className="absolute inset-0 rounded-full border border-dashed border-accent/30"
                style={{ animation: "rotate-slow 60s linear infinite" }}
              />
              <div className="absolute left-8 top-9 rounded-2xl border border-border bg-white p-5 shadow-[0_20px_25px_rgba(15,23,42,0.1)]" style={{ animation: "float-card 5s ease-in-out infinite" }}>
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Live Queue</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{totalWaiting}</p>
                <p className="text-sm text-muted-foreground">patients waiting</p>
              </div>
              <div className="absolute bottom-16 right-0 w-56 rounded-2xl bg-gradient-to-br from-accent to-accent-secondary p-[2px] shadow-[0_8px_24px_rgba(0,82,255,0.35)]" style={{ animation: "float-card 4s ease-in-out infinite" }}>
                <div className="rounded-[14px] bg-card p-5">
                  <p className="text-xs uppercase tracking-[0.15em] text-accent">Now Serving</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {activeServices[0]?.service?.name ?? "General Consultation"}
                  </p>
                  <p className="text-sm text-muted-foreground">Position updates in real time</p>
                </div>
              </div>
              <div className="absolute bottom-6 left-12 h-20 w-20 rounded-3xl bg-accent shadow-[0_8px_24px_rgba(0,82,255,0.35)]" />
            </div>
          </div>
        </div>
      </section>

      <section className="inverted-section px-4 py-16 sm:px-6">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 text-center lg:grid-cols-4">
          <div>
            <p className="text-4xl font-semibold">{MOCK_QUEUES.length}</p>
            <p className="mt-2 text-sm uppercase tracking-[0.12em] text-background/70">Total Services</p>
          </div>
          <div>
            <p className="text-4xl font-semibold">{activeServices.length}</p>
            <p className="mt-2 text-sm uppercase tracking-[0.12em] text-background/70">Active Queues</p>
          </div>
          <div>
            <p className="text-4xl font-semibold">{totalWaiting}</p>
            <p className="mt-2 text-sm uppercase tracking-[0.12em] text-background/70">Patients Waiting</p>
          </div>
          <div>
            <p className="text-4xl font-semibold">30m</p>
            <p className="mt-2 text-sm uppercase tracking-[0.12em] text-background/70">Avg Slot</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <div className="section-label mb-5">
            <span className="section-label-dot" />
            <span className="section-label-text">Clinic Services</span>
          </div>
          <h2 className="text-4xl leading-tight text-foreground sm:text-[3.25rem]">
            Active services available <span className="gradient-text">right now</span>
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {MOCK_QUEUES.map((queue) => (
              <article key={queue.id} className="surface-card surface-card-hover p-6">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                  <span className={`h-2 w-2 rounded-full ${queue.status === "open" ? "bg-emerald-500" : "bg-slate-400"}`} />
                  <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">{queue.status}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">{queue.service?.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{queue.service?.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">{queue.service?.priority} Priority</span>
                  <span className="text-muted-foreground">{queue.service?.durationMinutes} min</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
