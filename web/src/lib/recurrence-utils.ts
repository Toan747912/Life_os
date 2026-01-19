import { Activity } from "@/types/activity";
import { rrulestr } from "rrule";

export const RecurrenceUtils = {
    getInstances: (activity: Activity, rangeStart: Date, rangeEnd: Date): Activity[] => {
        // If no start or due date, can't place on calendar
        if (!activity.dueAt && !activity.startAt) return [];

        const baseDate = new Date(activity.startAt || activity.dueAt!);

        // Non-recurring
        if (!activity.recurrenceRule) {
            if (baseDate >= rangeStart && baseDate <= rangeEnd) {
                return [activity];
            }
            return [];
        }

        // Recurring
        try {
            // rrule requires UTC handling usually, but we'll try basic usage
            // We need to construct RRule from string. using rrule.rrulestr
            // Note: rrule library might need the 'dtstart' to be set explicitly if not in string

            const rule = rrulestr(activity.recurrenceRule, {
                dtstart: baseDate
            });

            const dates = rule.between(rangeStart, rangeEnd, true);

            return dates.map((date) => {
                // Clone activity
                // Adjust dates? Or just use the 'date' as the occurrence date
                // If activity has duration, we preserve it. 
                // For simplicity, we just assume dueAt becomes 'date'.

                return {
                    ...activity,
                    id: `${activity.id}_${date.getTime()}`, // Virtual ID
                    dueAt: date.toISOString(),
                    // startAt? If we have it, we shift it.
                };
            });

        } catch (e) {
            console.error("Error parsing rrule", e);
            return [];
        }
    }
};
