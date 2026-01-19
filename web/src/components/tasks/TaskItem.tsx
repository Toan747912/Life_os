"use client";

import { useState } from "react";
import { Entity, entityService } from "@/services/entity.service";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

// Need to implement Checkbox component or use simple input for now
// For speed, let's just use a simple input type="checkbox" styled with Tailwind or create a Checkbox component real quick.
// I'll stick to native input with custom styling locally or assume Checkbox exists.
// Wait, I haven't created Checkbox component. Let's create `components/ui/checkbox.tsx` next or use inline.
// I'll use inline standard input for now to save a tool call slightly, or create it.
// Actually, let's do it properly. I'll add Checkbox installation to the plan/thoughts but for now use this file.

// TaskItem Mocking Checkbox with standard input
export function TaskItem({ task, onUpdate }: { task: Entity; onUpdate: () => void }) {
    const isDone = task.data.status === "done";

    const { mutate: toggleStatus, isPending } = useMutation({
        mutationFn: async () => {
            const newStatus = isDone ? "todo" : "done";
            await entityService.update(task.id, {
                data: {
                    ...task.data,
                    status: newStatus,
                },
            });
        },
        onSuccess: () => {
            onUpdate();
        },
    });

    return (
        <Card className="mb-2">
            <CardContent className="p-4 flex items-center gap-3">
                <div
                    className={cn(
                        "h-5 w-5 rounded border border-primary flex items-center justify-center cursor-pointer transition-colors",
                        isDone ? "bg-primary text-primary-foreground" : "bg-transparent",
                        isPending && "opacity-50 cursor-wait"
                    )}
                    onClick={() => !isPending && toggleStatus()}
                >
                    {isDone && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                </div>

                <span className={cn("flex-1 text-sm font-medium", isDone && "line-through text-muted-foreground")}>
                    {task.data.title || "Untitled Task"}
                </span>
            </CardContent>
        </Card>
    );
}
