import 'package:equatable/equatable.dart';
import '../../../data/models/entity_model.dart';

abstract class EntityState extends Equatable {
  const EntityState();
  @override
  List<Object> get props => [];
}

class EntityInitial extends EntityState {}

class EntityLoading extends EntityState {}

class EntityLoaded extends EntityState {
  final List<UnifiedEntity> entities;
  const EntityLoaded(this.entities);
  @override
  List<Object> get props => [entities];
}

class EntityError extends EntityState {
  final String message;
  const EntityError(this.message);
  @override
  List<Object> get props => [message];
}
