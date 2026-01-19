import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../blocs/activity/activity_bloc.dart';
import '../blocs/activity/activity_state.dart' as bloc_state;
import '../../domain/entities/activity.dart' as domain;

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard')),
      body: BlocBuilder<ActivityBloc, bloc_state.ActivityState>(
        builder: (context, state) {
          if (state.status == bloc_state.ActivityStatus.loading) {
            return const Center(child: CircularProgressIndicator());
          }

          // Calculate Stats
          final total = state.activities.length;
          final todo = state.activities
              .where((a) => a.status == domain.ActivityStatus.todo)
              .length;
          final done = state.activities
              .where((a) => a.status == domain.ActivityStatus.done)
              .length;

          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildStatCard(
                  context,
                  title: 'Total Tasks',
                  count: total,
                  icon: Icons.assignment,
                  color: Colors.blue,
                ),
                const SizedBox(height: 16),
                _buildStatCard(
                  context,
                  title: 'To Do',
                  count: todo,
                  icon: Icons.checklist,
                  color: Colors.orange,
                ),
                const SizedBox(height: 16),
                _buildStatCard(
                  context,
                  title: 'Completed',
                  count: done,
                  icon: Icons.check_circle,
                  color: Colors.green,
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required String title,
    required int count,
    required IconData icon,
    required Color color,
  }) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(
                    context,
                  ).textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
                ),
                const SizedBox(height: 8),
                Text(
                  count.toString(),
                  style: Theme.of(context).textTheme.displayMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
            Icon(icon, size: 48, color: color.withValues(alpha: 0.5)),
          ],
        ),
      ),
    );
  }
}
