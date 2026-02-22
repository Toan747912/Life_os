import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import router để chuyển trang
import {
    LayoutDashboard,
    CheckSquare,
    BookOpen,
    Settings,
    User,
    Menu,
    X,
    Brain,
    Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Hàm tiện ích để gộp class Tailwind
const cn = (...inputs) => twMerge(clsx(inputs));

// Component từng món trong Menu
const NavItem = ({ icon: Icon, label, to, active }) => (
    <Link
        to={to}
        className={cn(
            "flex items-center w-full gap-3 px-4 py-3 rounded-lg transition-all duration-200",
            "hover:bg-indigo-50 hover:text-indigo-600",
            active ? "bg-indigo-600 text-white shadow-md" : "text-gray-600"
        )}
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </Link>
);

const Layout = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation(); // Lấy đường dẫn hiện tại để active menu

    // Danh sách menu (để dễ quản lý link)
    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/" },
        { icon: BookOpen, label: "Learning", path: "/learning" },
        { icon: Zap, label: "Study", path: "/study" },
        { icon: CheckSquare, label: "Tasks", path: "/tasks" },
        { icon: Settings, label: "Settings", path: "/settings" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            {/* --- Sidebar --- */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
                    !isSidebarOpen && "-translate-x-full lg:w-0 lg:p-0 lg:border-none" // Ẩn hẳn sidebar trên Desktop khi đóng
                )}
            >
                <div className={cn("h-full flex flex-col p-4", !isSidebarOpen && "hidden")}>
                    {/* Logo Area */}
                    <div className="flex items-center justify-between mb-8 px-2">
                        <div className="flex items-center gap-2 text-indigo-600">
                            <Brain size={28} />
                            <h1 className="text-2xl font-bold transition-all">Life OS</h1>
                        </div>
                        <button className="p-2 lg:hidden text-gray-500" onClick={() => setSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => (
                            <NavItem
                                key={item.path}
                                icon={item.icon}
                                label={item.label}
                                to={item.path}
                                active={location.pathname === item.path} // Tự động active nếu đúng trang
                            />
                        ))}
                    </nav>

                    {/* Footer Sidebar */}
                    <div className="mt-auto border-t border-slate-100 pt-4">
                        <button className="flex items-center w-full gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                            <User size={20} />
                            <span className="font-medium">Profile</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- Main Content --- */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={20} />
                        </button>
                        {/* Nút toggle sidebar trên Desktop (Option thêm) */}
                        <button
                            className="hidden lg:block p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? <Menu size={20} /> : <Menu size={20} />}
                        </button>

                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">
                            Welcome back, Toàn!
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                            TN
                        </div>
                    </div>
                </header>

                {/* Page Content */}
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