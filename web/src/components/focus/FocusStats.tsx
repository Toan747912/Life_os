"use client";

import { useQuery } from "@tanstack/react-query";
import { focusService } from "@/services/focus.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Hash } from "lucide-react";

export function FocusStats() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["focus-stats"],
        queryFn: focusService.getStats,
    });

    if (isLoading) {
        return <div>Loading stats...</div>;
    }

    const formatTotalTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Focus Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatTotalTime(stats?.totalDuration || 0)}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    <Hash className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
                </CardContent>
            </Card>
        </div>
    );
}
