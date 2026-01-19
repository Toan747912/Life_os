import 'package:study_os_app/domain/entities/subject.dart';

class SubjectModel extends Subject {
  const SubjectModel({
    required super.id,
    required super.name,
    super.colorHex,
    super.iconKey,
    super.targetHoursPerWeek,
    super.isArchived,
    required super.createdAt,
  });

  factory SubjectModel.fromMap(Map<String, dynamic> map) {
    return SubjectModel(
      id: map['id'],
      name: map['name'],
      colorHex: map['color_hex'] ?? '#FFFFFF',
      iconKey: map['icon_key'],
      targetHoursPerWeek: map['target_hours_per_week'] ?? 0,
      isArchived: map['is_archived'] == 1,
      createdAt: DateTime.parse(map['created_at']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'color_hex': colorHex,
      'icon_key': iconKey,
      'target_hours_per_week': targetHoursPerWeek,
      'is_archived': isArchived ? 1 : 0,
      'created_at': createdAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }
}
