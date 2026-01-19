import 'package:study_os_app/domain/entities/task.dart';

class TaskModel extends Task {
  const TaskModel({
    required super.id,
    required super.title,
    super.description,
    super.priority,
    super.status,
    super.dueDate,
    super.isRecurring,
    super.recurrenceRule,
    super.subjectId,
    super.parentId,
    required super.createdAt,
  });

  factory TaskModel.fromMap(Map<String, dynamic> map) {
    return TaskModel(
      id: map['id'],
      title: map['title'],
      description: map['description'],
      priority: _parsePriority(map['priority']),
      status: _parseStatus(map['status']),
      dueDate: map['due_date'] != null ? DateTime.parse(map['due_date']) : null,
      isRecurring: map['is_recurring'] == 1,
      recurrenceRule: map['recurrence_rule'],
      subjectId: map['subject_id'],
      parentId: map['parent_id'],
      createdAt: DateTime.parse(map['created_at']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'priority': priority.name.toUpperCase(),
      'status': status.name.toUpperCase(),
      'due_date': dueDate?.toIso8601String(),
      'is_recurring': isRecurring ? 1 : 0,
      'recurrence_rule': recurrenceRule,
      'subject_id': subjectId,
      'parent_id': parentId,
      'created_at': createdAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  static TaskPriority _parsePriority(String value) {
    switch (value) {
      case 'URGENT':
        return TaskPriority.urgent;
      case 'HIGH':
        return TaskPriority.high;
      case 'LOW':
        return TaskPriority.low;
      default:
        return TaskPriority.normal;
    }
  }

  static TaskStatus _parseStatus(String value) {
    switch (value) {
      case 'IN_PROGRESS':
        return TaskStatus.inProgress;
      case 'DONE':
        return TaskStatus.done;
      default:
        return TaskStatus.todo;
    }
  }
}
