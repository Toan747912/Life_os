"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/store/workspace.store";
import { entityService } from "@/services/entity.service";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskItem } from "@/components/tasks/TaskItem";

export default function TasksPage() {
    const { activeWorkspaceId } = useWorkspaceStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data: tasks, isLoading, refetch } = useQuery({
        queryKey: ["tasks", activeWorkspaceId],
        queryFn: () => {
            if (!activeWorkspaceId) return [];
            return entityService.getAll(activeWorkspaceId);
        },
        enabled: !!activeWorkspaceId,
    });

    // Filter only tasks
    const taskEntities = tasks?.filter((e) => e.type === "task") || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Tasks</h1>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                </Button>
            </div>

            {isLoading ? (
                <div>Loading tasks...</div>
            ) : (
                <div className="space-y-2">
                    {taskEntities.length === 0 ? (
                        <p className="text-muted-foreground">No tasks found. Create one to get started.</p>
                    ) : (
                        taskEntities.map((task) => (
                            <TaskItem key={task.id} task={task} onUpdate={refetch} />
                        ))
                    )}
                </div>
            )}

            <CreateTaskDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={refetch}
                workspaceId={activeWorkspaceId!}
            />
        </div>
    );
}
