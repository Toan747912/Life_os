"use client";

import { Activity } from "@/types/activity";
import Link from "next/link";

interface ActivityItemProps {
    activity: Activity;
    onToggle: (id: string, currentStatus: string) => void;
    onDelete: (id: string) => void;
}

export default function ActivityItem({ activity, onToggle, onDelete }: ActivityItemProps) {
    const isDone = activity.status === "DONE";

    return (
        <div className="flex items-center justify-between p-4 mb-3 bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => onToggle(activity.id, activity.status)}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                />
                <div>
                    <h3 className={`font-medium ${isDone ? "line-through text-gray-500" : "text-white"}`}>
                        {activity.title}
                    </h3>
                    {activity.dueAt && (
                        <p className="text-xs text-gray-400">Due: {new Date(activity.dueAt).toLocaleDateString()}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Link
                    href={`/memorizer?id=${activity.id}`}
                    className="text-blue-400 hover:text-blue-300 p-2"
                    title="Practice"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </Link>
                <button
                    onClick={() => onDelete(activity.id)}
                    className="text-red-400 hover:text-red-300 p-2"
                    title="Delete"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
