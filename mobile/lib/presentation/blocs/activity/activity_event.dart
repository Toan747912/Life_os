import 'package:equatable/equatable.dart';
import '../../../domain/entities/activity.dart';

abstract class ActivityEvent extends Equatable {
  const ActivityEvent();

  @override
  List<Object> get props => [];
}

class LoadActivities extends ActivityEvent {}

class AddActivity extends ActivityEvent {
  final String title;

  const AddActivity(this.title);

  @override
  List<Object> get props => [title];
}

class UpdateActivity extends ActivityEvent {
  final Activity activity;

  const UpdateActivity(this.activity);

  @override
  List<Object> get props => [activity];
}

class DeleteActivity extends ActivityEvent {
  final String id;

  const DeleteActivity(this.id);

  @override
  List<Object> get props => [id];
}

class SyncActivities extends ActivityEvent {}
