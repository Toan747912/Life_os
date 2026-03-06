import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    Headphones,
    Settings,
    Menu,
    Brain,
    Zap,
    LogOut,
    PlusCircle,
    Lightbulb,
    BookMarked,
    GalleryVerticalEnd,
    ChevronLeft,
    Wallet,
    Target,
    MessageCircle,
    Swords,
    Sparkles,
} from 'lucide-react';

// Navigation structure with groups
const NAV_GROUPS = [
    {
        label: 'Tổng quan',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
            { icon: Lightbulb, label: 'Insights', path: '/insights' },
        ]
    },
    {
        label: 'Học Ngôn Ngữ',
        items: [
            { icon: BookOpen, label: 'Learning', path: '/learning' },
            { icon: Zap, label: 'Study Session', path: '/study' },
            { icon: Headphones, label: 'Dictation', path: '/dictations' },
            { icon: PlusCircle, label: 'Tạo Dictation', path: '/dictation/create' },
        ]
    },
    {
        label: 'Từ Vựng',
        items: [
            { icon: BookMarked, label: 'Từ vựng của tôi', path: '/vocabulary' },
            { icon: GalleryVerticalEnd, label: 'Bộ Thẻ (Decks)', path: '/decks' },
            { icon: GalleryVerticalEnd, label: 'Flashcards', path: '/flashcards' },
        ]
    },
    {
        label: 'Thực Hành & AI',
        items: [
            { icon: Swords, label: 'Nhiệm Vụ (Quests)', path: '/quests' },
            { icon: Target, label: 'Mục Tiêu (Goals)', path: '/goals' },
            { icon: MessageCircle, label: 'Luyện Nói AI', path: '/speaking' },
            { icon: Sparkles, label: 'Kịch Bản AI', path: '/aipractice' }
        ]
    },
    {
        label: 'Cuộc Sống',
        items: [
            { icon: Wallet, label: 'Tài Chính', path: '/finance' },
        ]
    },
    {
        label: 'Hệ Thống',
        items: [
            { icon: Settings, label: 'Settings', path: '/settings' },
        ]
    }
];

const Layout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    const userName = user?.fullName || user?.email?.split('@')[0] || 'User';
    const userInitial = userName.charAt(0).toUpperCase();

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`flex items-center ${collapsed ? 'justify-center px-3' : 'justify-between px-5'} py-5 border-b border-white/30`}>
                {!collapsed && (
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                            <Brain size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-800 leading-none">Life OS</h1>
                            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">AI Powered</p>
                        </div>
                    </Link>
                )}
                {collapsed && (
                    <Link to="/">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform">
                            <Brain size={20} className="text-white" />
                        </div>
                    </Link>
                )}
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                    <ChevronLeft size={16} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Nav Groups */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
                {NAV_GROUPS.map((group) => (
                    <div key={group.label}>
                        {!collapsed && (
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">{group.label}</p>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const active = isActive(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        title={collapsed ? item.label : undefined}
                                        onClick={() => setMobileOpen(false)}
                                        className={`
                                            flex items-center gap-3 rounded-xl transition-all duration-200 relative overflow-hidden
                                            ${collapsed ? 'justify-center px-3 py-2.5' : 'px-3 py-2.5'}
                                            ${active
                                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-700'
                                            }
                                        `}
                                    >
                                        {active && <div className="absolute inset-0 bg-white/5 rounded-xl" />}
                                        <item.icon size={18} className={`shrink-0 ${active ? 'text-white' : ''}`} />
                                        {!collapsed && (
                                            <span className="text-sm font-medium relative z-10">{item.label}</span>
                                        )}
                                        {active && !collapsed && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Footer */}
            <div className={`border-t border-white/30 ${collapsed ? 'p-3' : 'p-4'}`}>
                {!collapsed ? (
                    <div className="bg-slate-50/80 rounded-xl p-3 mb-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                            {userInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700 truncate">{userName}</p>
                            <p className="text-[10px] text-slate-400">Life OS Member</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center mb-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {userInitial}
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    title={collapsed ? 'Đăng xuất' : undefined}
                    className={`flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-all text-sm font-medium ${collapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={17} className="shrink-0" />
                    {!collapsed && <span>Đăng xuất</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 flex font-sans text-slate-900 selection:bg-indigo-200 selection:text-indigo-900">
            {/* Decorative blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/20 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-violet-200/20 blur-[100px]" />
            </div>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 flex flex-col 
                bg-white/70 backdrop-blur-xl border-r border-white/60 shadow-xl shadow-slate-900/5
                transition-all duration-300 ease-in-out
                ${collapsed ? 'w-20' : 'w-64'}
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:relative lg:translate-x-0 lg:shadow-none
            `}>
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative z-10">
                {/* Top Header */}
                <header className="h-16 bg-white/60 backdrop-blur-xl border-b border-white/60 flex items-center justify-between px-5 lg:px-8 shrink-0 sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        {/* Mobile menu toggle */}
                        <button
                            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu size={20} />
                        </button>

                        {/* Breadcrumb / page title */}
                        <div>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest hidden sm:block">Life OS</p>
                            <p className="text-sm font-bold text-slate-700 leading-tight">
                                {NAV_GROUPS.flatMap(g => g.items).find(i => isActive(i.path))?.label || 'Dashboard'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notification bell */}
                        <button className="w-9 h-9 rounded-xl bg-white/60 border border-slate-200/60 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                            </svg>
                        </button>

                        {/* Avatar */}
                        <div className="flex items-center gap-2.5 bg-slate-50/80 rounded-xl px-3 py-2 border border-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow">
                                {userInitial}
                            </div>
                            <span className="text-sm font-semibold text-slate-700 hidden sm:block">{userName}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-5 lg:p-8">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;