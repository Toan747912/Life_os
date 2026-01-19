import 'package:equatable/equatable.dart';

enum TaskPriority { urgent, high, normal, low }

enum TaskStatus { todo, inProgress, done }

class Task extends Equatable {
  final String id;
  final String title;
  final String? description;
  final TaskPriority priority;
  final TaskStatus status;
  final DateTime? dueDate;
  final bool isRecurring;
  final String? recurrenceRule;
  final String? subjectId;
  final String? parentId;
  final DateTime createdAt;

  const Task({
    required this.id,
    required this.title,
    this.description,
    this.priority = TaskPriority.normal,
    this.status = TaskStatus.todo,
    this.dueDate,
    this.isRecurring = false,
    this.recurrenceRule,
    this.subjectId,
    this.parentId,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
    id,
    title,
    description,
    priority,
    status,
    dueDate,
    isRecurring,
    recurrenceRule,
    subjectId,
    parentId,
    createdAt,
  ];
}
