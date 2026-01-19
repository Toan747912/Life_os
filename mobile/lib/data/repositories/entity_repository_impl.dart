import 'dart:convert';
import 'package:uuid/uuid.dart';
import '../../domain/repositories/entity_repository.dart';
import '../models/entity_model.dart';
import '../datasources/database_helper.dart';
import '../services/sync_service.dart';
import '../../domain/repositories/auth_repository.dart';

class EntityRepositoryImpl implements EntityRepository {
  final DatabaseHelper databaseHelper;
  final SyncService syncService;
  final AuthRepository authRepository;

  EntityRepositoryImpl({
    required this.authRepository,
    required this.syncService,
    DatabaseHelper? databaseHelper,
  }) : databaseHelper = databaseHelper ?? DatabaseHelper.instance;

  @override
  Future<List<UnifiedEntity>> getEntities(String workspaceId) async {
    final db = await databaseHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'entities',
      where: 'workspace_id = ? AND deleted_at IS NULL',
      whereArgs: [workspaceId],
      orderBy: 'created_at DESC',
    );

    // Trigger background sync on load (optional but good for getting fresh data)
    // syncService.pullChanges(workspaceId);

    return List.generate(maps.length, (i) {
      final map = maps[i];
      // Map SQLite columns map back to UnifiedEntity model
      return UnifiedEntity(
        id: map['id'],
        type: map['type'],
        data: jsonDecode(map['data']),
        workspaceId: map['workspace_id'],
        parentId: map['parent_id'],
        position: map['position'] ?? '0',
        createdAt: DateTime.parse(map['created_at']),
        updatedAt: DateTime.parse(map['updated_at']),
      );
    });
  }

  @override
  Future<UnifiedEntity> createEntity(
    String workspaceId,
    String type,
    Map<String, dynamic> data,
  ) async {
    final db = await databaseHelper.database;
    final id = const Uuid().v4();
    final now = DateTime.now().toIso8601String();

    final entity = UnifiedEntity(
      id: id,
      type: type,
      data: data,
      workspaceId: workspaceId,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    await db.insert('entities', {
      'id': id,
      'type': type,
      'data': jsonEncode(data),
      'workspace_id': workspaceId,
      'created_at': now,
      'updated_at': now,
      'synced_at': null, // Not synced yet
    });

    // Background sync
    syncService.pushChanges();

    return entity;
  }
}
