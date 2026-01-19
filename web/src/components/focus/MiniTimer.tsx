"use client";

import { useTimer } from "@/contexts/TimerContext";
import { Timer } from "lucide-react";

export function MiniTimer() {
    const { timeLeft, isActive } = useTimer();

    // Show only when active or paused with some time elapsed?
    // User wants to see it when learning.
    // If we only show it when isActive || timeLeft < 25*60 (started), it's good UX.
    const MOMENT_WORK = 25 * 60;
    const isStarted = timeLeft < MOMENT_WORK;

    // Or if user specifically wants it always? Let's hide if initial full state and not active.
    if (!isActive && !isStarted) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/40 border border-red-500/30 rounded-full text-red-200 font-mono text-sm ml-4">
            <Timer className="h-3.5 w-3.5" />
            <span className="font-bold tabular-nums">{formatTime(timeLeft)}</span>
        </div>
    );
}
