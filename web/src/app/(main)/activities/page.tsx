"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { activityService } from "@/services/activity.service";
import ActivityItem from "@/components/ActivityItem";
import { useState } from "react";
import { CreateActivityDto } from "@/types/activity";

export default function ActivitiesPage() {
    const queryClient = useQueryClient();
    const [newActivityTitle, setNewActivityTitle] = useState("");

    const { data: activities, isLoading } = useQuery({
        queryKey: ["activities"],
        queryFn: activityService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: activityService.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activities"] }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'TODO' | 'DONE' }) =>
            activityService.update(id, { status }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activities"] }),
    });

    const deleteMutation = useMutation({
        mutationFn: activityService.delete,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activities"] }),
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newActivityTitle.trim()) return;

        const newActivity: CreateActivityDto = {
            title: newActivityTitle,
        };
        createMutation.mutate(newActivity);
        setNewActivityTitle("");
    };

    if (isLoading) return <div className="p-8 text-center text-white">Loading activities...</div>;

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-white mb-6">Activities</h1>

            {/* Create Form */}
            <form onSubmit={handleCreate} className="mb-8 flex gap-2">
                <input
                    type="text"
                    value={newActivityTitle}
                    onChange={(e) => setNewActivityTitle(e.target.value)}
                    placeholder="Add a new activity..."
                    className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
                />
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending ? "Adding..." : "Add"}
                </button>
            </form>

            {/* List */}
            <div className="space-y-2">
                {activities && activities.length > 0 ? (
                    activities.map((activity) => (
                        <ActivityItem
                            key={activity.id}
                            activity={activity}
                            onToggle={(id, current) => {
                                const newStatus = current === 'DONE' ? 'TODO' : 'DONE';
                                updateMutation.mutate({ id, status: newStatus });
                            }}
                            onDelete={(id) => deleteMutation.mutate(id)}
                        />
                    ))
                ) : (
                    <p className="text-gray-400 text-center">No activities yet. Start by adding one!</p>
                )}
            </div>
        </div>
    );
}
