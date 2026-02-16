import { useState } from "react";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="relative min-h-screen md:ml-72">
        <div className="sticky top-0 z-30 border-b border-border/70 bg-background/90 px-4 py-4 backdrop-blur sm:px-6 md:hidden">
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground"
            onClick={() => setIsSidebarOpen(true)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            Menu
          </button>
        </div>

        <div className="px-4 py-6 sm:px-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
