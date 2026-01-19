"use client";

import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { MiniTimer } from "@/components/focus/MiniTimer";

export function Header() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    // ...

    return (
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 dark:bg-zinc-800/40 px-6">
            <div className="w-full flex-1">
                {/* Breadcrumbs or Title could go here */}
            </div>
            <div className="flex items-center gap-4">
                <MiniTimer />
                <div className="text-sm text-muted-foreground">
                    {user?.username ? `Hello, ${user.username}` : "Guest"}
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </header>
    );
}
