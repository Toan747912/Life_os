"use client";

import { useQuery } from "@tanstack/react-query";
import { activityService } from "@/services/activity.service";
import { useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css'; // Import styles
import { RecurrenceUtils } from "@/lib/recurrence-utils";
import { Activity } from "@/types/activity";

type Value = typeof Calendar extends React.ComponentType<infer P> ?
    (P extends { value?: infer V } ? V : never) : never;
// Simple type hack or just use any/Date
type DateValue = Date | null | [Date | null, Date | null];

export default function CalendarPage() {
    const [date, setDate] = useState<Date>(new Date());

    const { data: activities } = useQuery({
        queryKey: ["activities"],
        queryFn: activityService.getAll,
    });

    // Calculate events for the Selected Date
    const getEventsForDay = (d: Date): Activity[] => {
        if (!activities) return [];

        // Start of day
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);

        // End of day
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);

        const events: Activity[] = [];
        activities.forEach(act => {
            const instances = RecurrenceUtils.getInstances(act, start, end);
            events.push(...instances);
        });
        return events;
    };

    const selectedEvents = getEventsForDay(date);

    // Styling helper for tiles (dots)
    const tileContent = ({ date: tileDate, view }: { date: Date; view: string }) => {
        if (view !== 'month' || !activities) return null;

        // Check if any event falls on this day
        // Optimization: This runs for every tile, be careful with perf. 
        // Ideally pre-calculate.
        const start = new Date(tileDate); start.setHours(0, 0, 0, 0);
        const end = new Date(tileDate); end.setHours(23, 59, 59, 999);

        const hasEvent = activities.some(act => {
            const instances = RecurrenceUtils.getInstances(act, start, end);
            return instances.length > 0;
        });

        if (hasEvent) {
            return <div className="h-2 w-2 bg-blue-500 rounded-full mx-auto mt-1"></div>;
        }
        return null;
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 text-white">
            <h1 className="text-3xl font-bold mb-6">Calendar</h1>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-black">
                    {/* React Calendar */}
                    <Calendar
                        onChange={(val) => {
                            if (val instanceof Date) setDate(val);
                        }}
                        value={date}
                        tileContent={tileContent}
                        className="rounded-lg border-none"
                    />
                </div>

                <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-4 text-white">
                        Activities for {date.toLocaleDateString()}
                    </h2>

                    <div className="space-y-3">
                        {selectedEvents.length > 0 ? (
                            selectedEvents.map((act) => (
                                <div key={act.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                    <h3 className="font-bold">{act.title}</h3>
                                    <p className="text-sm text-gray-400">
                                        {act.dueAt ? new Date(act.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day'}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No activities scheduled.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
