import 'package:rrule/rrule.dart';
import '../../domain/entities/activity.dart';

class RecurrenceUtils {
  /// Generates occurrences for an activity within a given date range.
  /// If [activity.recurrenceRule] is null, returns the activity itself if it falls in range.
  static List<Activity> generateOccurrences(
    Activity activity,
    DateTime startRange,
    DateTime endRange,
  ) {
    if (activity.startAt == null && activity.dueAt == null) {
      return [];
    }

    final baseDate = activity.startAt ?? activity.dueAt!;

    // Non-recurring
    if (activity.recurrenceRule == null || activity.recurrenceRule!.isEmpty) {
      if (baseDate.isAfter(startRange) && baseDate.isBefore(endRange)) {
        return [activity];
      }
      return [];
    }

    // Recurring
    try {
      final rrule = RecurrenceRule.fromString(activity.recurrenceRule!);

      // rrule package requires UTC usually, be careful with timezones
      // For simplicity, we assume robust timezone handling or local consistency
      final occurrences = rrule.getInstances(
        start: baseDate.toUtc(),
        before: endRange.toUtc(),
        after: startRange.toUtc(),
        includeAfter: true,
        includeBefore: true,
      );

      return occurrences.map((date) {
        // Create a copy of activity with new dates
        // Note: ID should probably adjust or have a virtual instance ID?
        // keeping original ID might confuse "complete this instance" vs "complete all"
        // For visual scheduler, same ID is fine if we just want to show them.
        return Activity(
          id: '${activity.id}_${date.millisecondsSinceEpoch}', // Virtual ID
          serverId: activity.serverId,
          title: activity.title,
          status:
              activity.status, // All instances inherit status? Or calculate?
          startAt: activity.startAt != null ? date.toLocal() : null,
          dueAt: activity.dueAt != null
              ? date.toLocal().add(
                  activity.dueAt!.difference(
                    activity.startAt ?? activity.dueAt!,
                  ),
                )
              : date.toLocal(),
          recurrenceRule: activity.recurrenceRule,
          metadata: activity.metadata,
          lastUpdatedAt: activity.lastUpdatedAt,
          createdAt: activity.createdAt,
          isSynced: activity.isSynced,
        );
      }).toList();
    } catch (e) {
      // Fallback if rrule parse fails
      return [];
    }
  }
}
