"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { focusService, FocusSessionStatus } from "@/services/focus.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface TimerContextType {
    timeLeft: number;
    isActive: boolean;
    startTime: string | null;
    toggleTimer: () => void;
    resetTimer: () => void;
    endSession: () => void;
    isPending: boolean; // For saving state
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const MOMENT_WORK = 25 * 60; // 25 minutes default

export function TimerProvider({ children }: { children: ReactNode }) {
    const [timeLeft, setTimeLeft] = useState(MOMENT_WORK);
    const [isActive, setIsActive] = useState(false);
    const [startTime, setStartTime] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const { mutate: saveSession, isPending } = useMutation({
        mutationFn: async (status: FocusSessionStatus) => {
            const now = new Date();
            const endISO = now.toISOString();
            const startISO = startTime || now.toISOString(); // fallback
            const duration = MOMENT_WORK - timeLeft;

            if (duration < 60) return; // Don't save if less than 1 minute

            await focusService.createSession({
                startTime: startISO,
                endTime: endISO,
                duration: duration,
                status: status,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["focus-stats"] });
            resetTimerState();
        },
    });

    const resetTimerState = useCallback(() => {
        setIsActive(false);
        setTimeLeft(MOMENT_WORK);
        setStartTime(null);
    }, []);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setIsActive(false);
                        saveSession(FocusSessionStatus.COMPLETED);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, saveSession]);

    const toggleTimer = useCallback(() => {
        if (!isActive && !startTime) {
            setStartTime(new Date().toISOString());
        }
        setIsActive(!isActive);
    }, [isActive, startTime]);

    const resetTimer = useCallback(() => {
        resetTimerState();
    }, [resetTimerState]);

    const endSession = useCallback(() => {
        saveSession(FocusSessionStatus.INTERRUPTED);
    }, [saveSession]);

    return (
        <TimerContext.Provider value={{ timeLeft, isActive, startTime, toggleTimer, resetTimer, endSession, isPending }}>
            {children}
        </TimerContext.Provider>
    );
}

export function useTimer() {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error("useTimer must be used within a TimerProvider");
    }
    return context;
}
