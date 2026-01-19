"use client";

import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/store/workspace.store";
import { entityService } from "@/services/entity.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, ListTodo, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
    const { activeWorkspaceId } = useWorkspaceStore();

    const { data: tasks, isLoading } = useQuery({
        queryKey: ["tasks", activeWorkspaceId],
        queryFn: () => {
            if (!activeWorkspaceId) return [];
            return entityService.getAll(activeWorkspaceId);
        },
        enabled: !!activeWorkspaceId,
    });

    const taskEntities = tasks?.filter((e) => e.type === "task") || [];
    const totalTasks = taskEntities.length;
    const todoTasks = taskEntities.filter((t) => t.data.status === "todo").length;
    const doneTasks = taskEntities.filter((t) => t.data.status === "done").length;

    if (isLoading) {
        return <div>Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTasks}</div>
                        <p className="text-xs text-muted-foreground">All tasks in workspace</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">To Do</CardTitle>
                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todoTasks}</div>
                        <p className="text-xs text-muted-foreground">Tasks waiting for action</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{doneTasks}</div>
                        <p className="text-xs text-muted-foreground">Tasks finished</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
