import { Link, useLocation } from "react-router-dom";

export default function AdminSidebar() {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    const links = [
        { name: "Dashboard", path: "/admin" },
        { name: "Manage Queues", path: "/admin/queue" },
    ];

    return (
        <aside className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 flex flex-col z-10">
            <div className="p-6 border-b border-gray-200">
                <Link to="/admin" className="text-xl font-bold text-primary">
                    QueueSmart <span className="text-gray-500 text-sm">Admin</span>
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {links.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`block px-4 py-2 rounded-lg transition-colors ${isActive(link.path)
                            ? "bg-blue-50 text-primary font-medium"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                    >
                        {link.name}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
                <Link to="/" className="block px-4 py-2 text-gray-500 hover:text-red-600 transition-colors">
                    Logout / Live Site
                </Link>
            </div>
        </aside>
    );
}
