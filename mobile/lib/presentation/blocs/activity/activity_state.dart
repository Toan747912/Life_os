import 'package:equatable/equatable.dart';
import '../../../domain/entities/activity.dart';

enum ActivityStatus { initial, loading, success, failure }

class ActivityState extends Equatable {
  final ActivityStatus status;
  final List<Activity> activities;
  final String? errorMessage;

  const ActivityState({
    this.status = ActivityStatus.initial,
    this.activities = const [],
    this.errorMessage,
  });

  ActivityState copyWith({
    ActivityStatus? status,
    List<Activity>? activities,
    String? errorMessage,
  }) {
    return ActivityState(
      status: status ?? this.status,
      activities: activities ?? this.activities,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, activities, errorMessage];
}
