"use client";

import { Play, Pause, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimer } from "@/contexts/TimerContext";

const MOMENT_WORK = 25 * 60; // 25 minutes default

export function FocusTimer() {
    const { timeLeft, isActive, toggleTimer, resetTimer, endSession, isPending } = useTimer();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <Card className="flex flex-col items-center justify-center p-6 text-center">
            <CardHeader>
                <CardTitle>Focus Timer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-6xl font-bold tracking-tighter tabular-nums">
                    {formatTime(timeLeft)}
                </div>

                <div className="flex gap-4">
                    <Button
                        variant={isActive ? "secondary" : "default"}
                        size="lg"
                        className="w-24"
                        onClick={toggleTimer}
                    >
                        {isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {isActive ? "Pause" : "Start"}
                    </Button>

                    <Button variant="outline" size="lg" onClick={resetTimer} title="Reset">
                        <RotateCcw className="h-4 w-4" />
                    </Button>

                    {(timeLeft < MOMENT_WORK && !isActive) && (
                        <Button
                            variant="destructive"
                            size="lg"
                            onClick={endSession}
                            disabled={isPending}
                            title="End Session"
                        >
                            <Save className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

