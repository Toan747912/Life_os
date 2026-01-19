class UnifiedEntity {
  final String id;
  final String type;
  final Map<String, dynamic> data;
  final String workspaceId;
  final String? parentId;
  final String position;
  final DateTime createdAt;
  final DateTime updatedAt;

  const UnifiedEntity({
    required this.id,
    required this.type,
    required this.data,
    required this.workspaceId,
    this.parentId,
    this.position = '0',
    required this.createdAt,
    required this.updatedAt,
  });

  factory UnifiedEntity.fromJson(Map<String, dynamic> json) {
    return UnifiedEntity(
      id: json['id'],
      type: json['type'],
      data: json['data'] ?? {},
      workspaceId: json['workspace_id'] ?? json['workspaceId'] ?? '',
      parentId:
          json['parent_id'] ??
          json['parentId'], // Handle both snake_case (DB) and camelCase (API)
      position: json['position'] ?? '0',
      createdAt: DateTime.parse(json['created_at'] ?? json['createdAt']),
      updatedAt: DateTime.parse(json['updated_at'] ?? json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'data': data,
      'workspaceId': workspaceId,
      'parentId': parentId,
      'position': position,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
