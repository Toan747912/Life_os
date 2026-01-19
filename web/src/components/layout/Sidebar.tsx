"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    CheckSquare,
    Calendar,
    Settings,
    BookOpen,
    Brain,
} from "lucide-react";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Activities",
        href: "/activities",
        icon: CheckSquare,
    },
    {
        title: "Focus",
        href: "/focus",
        icon: BookOpen,
    },
    {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
    },
    {
        title: "Memorizer",
        href: "/memorizer",
        icon: Brain,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden border-r bg-gray-100/40 dark:bg-zinc-800/40 lg:block lg:w-64 lg:shrink-0">
            <div className="flex h-full flex-col gap-2">
                <div className="flex h-14 items-center border-b px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <span className="">Life OS</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <nav className="grid items-start px-4 text-sm font-medium">
                        {sidebarItems.map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    pathname === item.href
                                        ? "bg-gray-100 text-primary dark:bg-zinc-800"
                                        : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    );
}
