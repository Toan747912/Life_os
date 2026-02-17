import React from 'react';
import {
    LayoutDashboard,
    CheckSquare,
    BookOpen,
    Settings,
    User,
    Menu,
    X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const NavItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center w-full gap-3 px-4 py-3 rounded-lg transition-all duration-200",
            "hover:bg-indigo-50 hover:text-indigo-600",
            active ? "bg-indigo-600 text-white shadow-md" : "text-gray-600"
        )}
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </button>
);

const Layout = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = React.useState(true);

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
                    !isSidebarOpen && "-translate-x-full lg:w-20"
                )}
            >
                <div className="h-full flex flex-col p-4">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <h1 className={cn("text-2xl font-bold text-indigo-600 transition-all", !isSidebarOpen && "lg:hidden")}>
                            Life OS
                        </h1>
                        <button className="p-2 lg:hidden" onClick={() => setSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <NavItem icon={LayoutDashboard} label="Dashboard" active />
                        <NavItem icon={CheckSquare} label="Habits & Tasks" />
                        <NavItem icon={BookOpen} label="Learning" />
                        <NavItem icon={Settings} label="Settings" />
                    </nav>

                    <div className="mt-auto border-t border-slate-100 pt-4">
                        <NavItem icon={User} label="Profile" />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 lg:px-8 shrink-0">
                    <button
                        className="p-2 -ml-2 mr-4 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Welcome back!</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                            TU
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/50">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
