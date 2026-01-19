import 'package:equatable/equatable.dart';

class Subject extends Equatable {
  final String id;
  final String name;
  final String colorHex;
  final String? iconKey;
  final int targetHoursPerWeek;
  final bool isArchived;
  final DateTime createdAt;

  const Subject({
    required this.id,
    required this.name,
    this.colorHex = '#FFFFFF',
    this.iconKey,
    this.targetHoursPerWeek = 0,
    this.isArchived = false,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
    id,
    name,
    colorHex,
    iconKey,
    targetHoursPerWeek,
    isArchived,
    createdAt,
  ];
}
