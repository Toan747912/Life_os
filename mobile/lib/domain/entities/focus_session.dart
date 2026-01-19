import 'package:equatable/equatable.dart';

enum SessionStatus { completed, interrupted }

class FocusSession extends Equatable {
  final String id;
  final DateTime startTime;
  final DateTime? endTime;
  final int durationSeconds;
  final SessionStatus status;
  final String? sessionTag;
  final String? notes;
  final String? taskId;
  final String? subjectId;

  const FocusSession({
    required this.id,
    required this.startTime,
    this.endTime,
    required this.durationSeconds,
    this.status = SessionStatus.completed,
    this.sessionTag,
    this.notes,
    this.taskId,
    this.subjectId,
  });

  @override
  List<Object?> get props => [
    id,
    startTime,
    endTime,
    durationSeconds,
    status,
    sessionTag,
    notes,
    taskId,
    subjectId,
  ];
}
