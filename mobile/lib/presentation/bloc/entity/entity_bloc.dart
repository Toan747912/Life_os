import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/repositories/entity_repository.dart';
import 'entity_event.dart';
import 'entity_state.dart';

class EntityBloc extends Bloc<EntityEvent, EntityState> {
  final EntityRepository repository;

  EntityBloc({required this.repository}) : super(EntityInitial()) {
    on<LoadEntities>(_onLoadEntities);
    on<CreateEntity>(_onCreateEntity);
  }

  Future<void> _onLoadEntities(
    LoadEntities event,
    Emitter<EntityState> emit,
  ) async {
    emit(EntityLoading());
    try {
      final entities = await repository.getEntities(event.workspaceId);
      emit(EntityLoaded(entities));
    } catch (e) {
      emit(EntityError(e.toString()));
    }
  }

  Future<void> _onCreateEntity(
    CreateEntity event,
    Emitter<EntityState> emit,
  ) async {
    try {
      await repository.createEntity(event.workspaceId, event.type, event.data);
      // Reload entities after creation
      add(LoadEntities(event.workspaceId));
    } catch (e) {
      emit(EntityError(e.toString()));
    }
  }
}
