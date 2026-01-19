import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../blocs/activity/activity_bloc.dart';
import '../blocs/activity/activity_event.dart';
import '../blocs/activity/activity_state.dart';
import '../widgets/responsive_scaffold.dart';

class ActivityListScreen extends StatelessWidget {
  const ActivityListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ResponsiveScaffold(
      mobileBody: Scaffold(
        appBar: AppBar(
          title: const Text('Activities'),
          actions: [
            IconButton(
              icon: const Icon(Icons.calendar_month),
              onPressed: () {
                context.push('/calendar');
              },
            ),
            IconButton(
              icon: const Icon(Icons.sync),
              onPressed: () {
                context.read<ActivityBloc>().add(SyncActivities());
              },
            ),
          ],
        ),
        body: BlocBuilder<ActivityBloc, ActivityState>(
          builder: (context, state) {
            if (state.status == ActivityStatus.loading) {
              return const Center(child: CircularProgressIndicator());
            } else if (state.status == ActivityStatus.failure) {
              return Center(child: Text('Error: ${state.errorMessage}'));
            } else if (state.activities.isEmpty) {
              return const Center(child: Text('No activities yet.'));
            }

            return ListView.builder(
              itemCount: state.activities.length,
              itemBuilder: (context, index) {
                final activity = state.activities[index];
                return ListTile(
                  title: Text(activity.title),
                  subtitle: Text(activity.dueAt?.toString() ?? 'No due date'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.school, color: Colors.blue),
                        onPressed: () {
                          // Navigate to Memorizer with content
                          context.push(
                            '/memorizer',
                            extra: {
                              'content':
                                  activity.metadata?['content'] ??
                                  activity.title,
                              'activityId': activity.id,
                            },
                          );
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () {
                          context.read<ActivityBloc>().add(
                            DeleteActivity(activity.id),
                          );
                        },
                      ),
                    ],
                  ),
                );
              },
            );
          },
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () {
            // Show dialog to add activity
            _showAddActivityDialog(context);
          },
          child: const Icon(Icons.add),
        ),
      ),
    );
  }

  void _showAddActivityDialog(BuildContext context) {
    final titleController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('New Activity'),
          content: TextField(
            controller: titleController,
            decoration: const InputDecoration(labelText: 'Title'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                if (titleController.text.isNotEmpty) {
                  context.read<ActivityBloc>().add(
                    AddActivity(titleController.text),
                  );
                  Navigator.pop(context);
                }
              },
              child: const Text('Add'),
            ),
          ],
        );
      },
    );
  }
}
