import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../core/utils/recurrence_utils.dart';
import '../../domain/entities/activity.dart';
import '../blocs/activity/activity_bloc.dart';
import '../blocs/activity/activity_state.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  CalendarFormat _calendarFormat = CalendarFormat.month;

  @override
  void initState() {
    super.initState();
    _selectedDay = _focusedDay;
  }

  // Get activities for a specific day
  List<Activity> _getEventsForDay(DateTime day, List<Activity> allActivities) {
    // Generate occurrences for the requested day
    // We assume the Calendar calls this for each day cell.
    // Optimization: Pre-calculate occurrences for the month?
    // Isar works well with fetching.

    // For now, iterate all valid activities and check if they occur on 'day'
    final dayStart = DateTime(day.year, day.month, day.day);
    final dayEnd = dayStart.add(const Duration(days: 1));

    final events = <Activity>[];

    for (var act in allActivities) {
      final occurrences = RecurrenceUtils.generateOccurrences(
        act,
        dayStart,
        dayEnd,
      );
      events.addAll(occurrences);
    }
    return events;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scheduler')),
      body: BlocBuilder<ActivityBloc, ActivityState>(
        builder: (context, state) {
          final allActivities = state.activities;

          return Column(
            children: [
              TableCalendar<Activity>(
                firstDay: DateTime.utc(2020, 10, 16),
                lastDay: DateTime.utc(2030, 3, 14),
                focusedDay: _focusedDay,
                calendarFormat: _calendarFormat,

                selectedDayPredicate: (day) {
                  return isSameDay(_selectedDay, day);
                },
                onDaySelected: (selectedDay, focusedDay) {
                  setState(() {
                    _selectedDay = selectedDay;
                    _focusedDay = focusedDay;
                  });
                },
                onFormatChanged: (format) {
                  setState(() {
                    _calendarFormat = format;
                  });
                },
                onPageChanged: (focusedDay) {
                  _focusedDay = focusedDay;
                },

                eventLoader: (day) {
                  return _getEventsForDay(day, allActivities);
                },

                // Polish: Styling
                calendarStyle: CalendarStyle(
                  markerDecoration: const BoxDecoration(
                    color: Colors.blue,
                    shape: BoxShape.circle,
                  ),
                  todayDecoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.5),
                    shape: BoxShape.circle,
                  ),
                  selectedDecoration: const BoxDecoration(
                    color: Colors.blue,
                    shape: BoxShape.circle,
                  ),
                ),
              ),

              const SizedBox(height: 8.0),

              Expanded(child: _buildEventList(_selectedDay!, allActivities)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildEventList(DateTime day, List<Activity> allActivities) {
    final events = _getEventsForDay(day, allActivities);

    if (events.isEmpty) {
      return const Center(child: Text('No activities for this day.'));
    }

    return ListView.builder(
      itemCount: events.length,
      itemBuilder: (context, index) {
        final event = events[index];
        return ListTile(
          leading: const Icon(Icons.event),
          title: Text(event.title),
          subtitle: Text(event.dueAt != null ? 'Due: ${event.dueAt}' : ''),
        );
      },
    );
  }
}
