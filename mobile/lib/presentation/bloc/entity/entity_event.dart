import 'package:equatable/equatable.dart';

abstract class EntityEvent extends Equatable {
  const EntityEvent();
  @override
  List<Object> get props => [];
}

class LoadEntities extends EntityEvent {
  final String workspaceId;
  const LoadEntities(this.workspaceId);
  @override
  List<Object> get props => [workspaceId];
}

class CreateEntity extends EntityEvent {
  final String workspaceId;
  final String type;
  final Map<String, dynamic> data;

  const CreateEntity({
    required this.workspaceId,
    required this.type,
    required this.data,
  });
  @override
  List<Object> get props => [workspaceId, type, data];
}
