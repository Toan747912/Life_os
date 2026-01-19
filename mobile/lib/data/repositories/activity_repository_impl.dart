import 'dart:convert';
import 'package:isar/isar.dart';
import '../../domain/entities/activity.dart';
import '../../domain/repositories/activity_repository.dart';
import '../models/local_activity.dart';

class ActivityRepositoryImpl implements ActivityRepository {
  final Isar isar;

  ActivityRepositoryImpl(this.isar);

  @override
  Future<List<Activity>> getActivities() async {
    final localActivities = await isar.localActivitys.where().findAll();
    return localActivities.map(_toDomain).toList();
  }

  @override
  Future<Activity?> getActivity(String id) async {
    final localActivity = await isar.localActivitys.get(int.parse(id));
    return localActivity != null ? _toDomain(localActivity) : null;
  }

  @override
  Future<void> saveActivity(Activity activity) async {
    final localActivity = _toLocal(activity);
    await isar.writeTxn(() async {
      await isar.localActivitys.put(localActivity);
    });
  }

  @override
  Future<void> deleteActivity(String id) async {
    await isar.writeTxn(() async {
      await isar.localActivitys.delete(int.parse(id));
    });
  }

  @override
  Future<List<Activity>> getUnsyncedActivities() async {
    final localActivities = await isar.localActivitys
        .filter()
        .isSyncedEqualTo(false)
        .findAll();
    return localActivities.map(_toDomain).toList();
  }

  @override
  Future<void> markAsSynced(String id, String serverId) async {
    final localActivity = await isar.localActivitys.get(int.parse(id));
    if (localActivity != null) {
      localActivity.serverId = serverId;
      localActivity.isSynced = true;
      await isar.writeTxn(() async {
        await isar.localActivitys.put(localActivity);
      });
    }
  }

  Activity _toDomain(LocalActivity local) {
    return Activity(
      id: local.id.toString(),
      serverId: local.serverId,
      title: local.title ?? '',
      dueAt: local.dueAt,
      isSynced: local.isSynced,
      lastUpdatedAt: local.updatedAt,
      metadata: local.metadataJson != null
          ? jsonDecode(local.metadataJson!)
          : null,
    );
  }

  LocalActivity _toLocal(Activity domain) {
    final local = LocalActivity()
      ..id = int.tryParse(domain.id) ?? Isar.autoIncrement
      ..serverId = domain.serverId
      ..title = domain.title
      ..dueAt = domain.dueAt
      ..isSynced = domain.isSynced
      ..updatedAt = domain.lastUpdatedAt ?? DateTime.now()
      ..metadataJson = domain.metadata != null
          ? jsonEncode(domain.metadata)
          : null;
    return local;
  }
}
