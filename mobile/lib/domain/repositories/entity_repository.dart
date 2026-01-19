import '../../data/models/entity_model.dart';

abstract class EntityRepository {
  Future<List<UnifiedEntity>> getEntities(String workspaceId);
  Future<UnifiedEntity> createEntity(
    String workspaceId,
    String type,
    Map<String, dynamic> data,
  );
}
