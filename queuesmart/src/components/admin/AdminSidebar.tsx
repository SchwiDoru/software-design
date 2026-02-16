import { Link, useLocation } from "react-router-dom";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const links = [
    { name: "Dashboard", path: "/admin" },
    { name: "Manage Queues", path: "/admin/queue" }
  ];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-label="Close admin sidebar"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-border bg-card/95 shadow-[0_20px_25px_rgba(15,23,42,0.1)] backdrop-blur transition-transform duration-300 md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="border-b border-border px-6 py-6">
          <Link to="/admin" className="text-2xl leading-none text-foreground" onClick={onClose}>
            QueueSmart <span className="gradient-text">Admin</span>
          </Link>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Clinic operations</p>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={onClose}
              className={`block rounded-xl px-4 py-3 text-sm font-medium transition-all ${isActive(link.path)
                  ? "bg-gradient-to-r from-accent to-accent-secondary text-white shadow-[0_4px_14px_rgba(0,82,255,0.25)]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <Link
            to="/"
            className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            Live Site
          </Link>
        </div>
      </aside>
    </>
  );
}
