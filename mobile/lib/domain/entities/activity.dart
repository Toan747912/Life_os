import 'package:equatable/equatable.dart';

enum ActivityStatus { todo, done, archived }

class Activity extends Equatable {
  final String id;
  final String? serverId;
  final String title;
  final ActivityStatus status;
  final DateTime? startAt;
  final DateTime? dueAt;
  final String? recurrenceRule;
  final Map<String, dynamic>? metadata;
  final DateTime? lastUpdatedAt;
  final DateTime? createdAt;
  final bool isSynced;

  const Activity({
    required this.id,
    this.serverId,
    required this.title,
    this.status = ActivityStatus.todo,
    this.startAt,
    this.dueAt,
    this.recurrenceRule,
    this.metadata,
    this.lastUpdatedAt,
    this.createdAt,
    this.isSynced = false,
  });

  Activity copyWith({
    String? id,
    String? serverId,
    String? title,
    ActivityStatus? status,
    DateTime? startAt,
    DateTime? dueAt,
    String? recurrenceRule,
    Map<String, dynamic>? metadata,
    DateTime? lastUpdatedAt,
    DateTime? createdAt,
    bool? isSynced,
  }) {
    return Activity(
      id: id ?? this.id,
      serverId: serverId ?? this.serverId,
      title: title ?? this.title,
      status: status ?? this.status,
      startAt: startAt ?? this.startAt,
      dueAt: dueAt ?? this.dueAt,
      recurrenceRule: recurrenceRule ?? this.recurrenceRule,
      metadata: metadata ?? this.metadata,
      lastUpdatedAt: lastUpdatedAt ?? this.lastUpdatedAt,
      createdAt: createdAt ?? this.createdAt,
      isSynced: isSynced ?? this.isSynced,
    );
  }

  @override
  List<Object?> get props => [
    id,
    serverId,
    title,
    status,
    startAt,
    dueAt,
    recurrenceRule,
    metadata,
    lastUpdatedAt,
    createdAt,
    isSynced,
  ];
}
