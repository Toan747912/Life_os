import 'package:isar/isar.dart';

part 'local_activity.g.dart';

@collection
class LocalActivity {
  Id id = Isar.autoIncrement;

  @Index()
  String? serverId;

  String? title;
  DateTime? dueAt;

  // Polymorphic metadata stored as JSON string
  String? metadataJson;

  bool isSynced = false;
  DateTime? updatedAt;
  DateTime? createdAt;
}
