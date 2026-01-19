import 'package:study_os_app/domain/entities/focus_session.dart';

class SessionModel extends FocusSession {
  const SessionModel({
    required super.id,
    required super.startTime,
    super.endTime,
    required super.durationSeconds,
    super.status,
    super.sessionTag,
    super.notes,
    super.taskId,
    super.subjectId,
  });

  factory SessionModel.fromMap(Map<String, dynamic> map) {
    return SessionModel(
      id: map['id'],
      startTime: DateTime.parse(map['start_time']),
      endTime: map['end_time'] != null ? DateTime.parse(map['end_time']) : null,
      durationSeconds: map['duration_seconds'],
      status: map['status'] == 'INTERRUPTED'
          ? SessionStatus.interrupted
          : SessionStatus.completed,
      sessionTag: map['session_tag'],
      notes: map['notes'],
      taskId: map['task_id'],
      subjectId: map['subject_id'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'start_time': startTime.toIso8601String(),
      'end_time': endTime?.toIso8601String(),
      'duration_seconds': durationSeconds,
      'status': status == SessionStatus.interrupted
          ? 'INTERRUPTED'
          : 'COMPLETED',
      'session_tag': sessionTag,
      'notes': notes,
      'task_id': taskId,
      'subject_id': subjectId,
      'created_at': DateTime.now().toIso8601String(),
    };
  }
}
