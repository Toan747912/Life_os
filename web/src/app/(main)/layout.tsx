"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TimerProvider } from "@/contexts/TimerContext";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, user } = useAuthStore();
    const { fetchWorkspaces, activeWorkspaceId } = useWorkspaceStore(); // Added workspace store
    const router = useRouter();

    useEffect(() => {
        // Determine if we need to redirect
        // We add a small delay or check purely on state to avoid hydration mismatch issues if strictly needed,
        // but useEffect is fine for client-side redirect.
        if (!isAuthenticated) {
            router.push("/login");
        } else {
            fetchWorkspaces(); // Fetch workspaces when authenticated
        }
    }, [isAuthenticated, router, fetchWorkspaces]); // Added fetchWorkspaces to dependencies

    if ((!isAuthenticated && !user) || !activeWorkspaceId) { // Modified conditional rendering
        // wait for auth and workspace
        if (!isAuthenticated && !user) return null; // or a loading spinner
        // If authenticated but no workspace yet (loading), show loader or null
        // Actually fetchWorkspaces will set activeWorkspaceId.
        // We can render children only when activeWorkspaceId is present to avoid API calls with null ID.
        // But let's allow rendering sidebar/header at least.
    }

    return (
        <TimerProvider>
            <div className="flex h-screen bg-black text-white overflow-hidden">
                {/* Desktop Sidebar - Hidden on mobile */}
                <aside className="hidden md:flex w-64 flex-col border-r border-gray-800">
                    <Sidebar />
                </aside>

                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {/* Mobile Header */}
                    <Header />

                    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-black">
                        {children}
                    </main>
                </div>
            </div>
        </TimerProvider>
    );
}
