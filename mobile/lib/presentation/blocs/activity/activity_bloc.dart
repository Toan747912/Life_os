import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:study_os_app/presentation/blocs/activity/activity_state.dart';
import 'package:study_os_app/domain/entities/activity.dart' as domain;
import '../../../domain/repositories/activity_repository.dart';
import '../../../data/services/sync_service.dart';
import 'activity_event.dart';

class ActivityBloc extends Bloc<ActivityEvent, ActivityState> {
  // ...
  final ActivityRepository activityRepository;
  final SyncService syncService;

  ActivityBloc({required this.activityRepository, required this.syncService})
    : super(const ActivityState()) {
    on<LoadActivities>(_onLoadActivities);
    on<AddActivity>(_onAddActivity);
    on<UpdateActivity>(_onUpdateActivity);
    on<DeleteActivity>(_onDeleteActivity);
    on<SyncActivities>(_onSyncActivities);
  }

  Future<void> _onLoadActivities(
    LoadActivities event,
    Emitter<ActivityState> emit,
  ) async {
    emit(state.copyWith(status: ActivityStatus.loading));
    try {
      final activities = await activityRepository.getActivities();
      emit(
        state.copyWith(status: ActivityStatus.success, activities: activities),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: ActivityStatus.failure,
          errorMessage: e.toString(),
        ),
      );
    }
  }

  Future<void> _onAddActivity(
    AddActivity event,
    Emitter<ActivityState> emit,
  ) async {
    try {
      final newActivity = domain.Activity(
        id: DateTime.now().millisecondsSinceEpoch.toString(), // Temp ID gen
        title: event.title,
        createdAt: DateTime.now(), // Ensure local entity has this
        lastUpdatedAt: DateTime.now(),
      );
      await activityRepository.saveActivity(newActivity);
      add(LoadActivities());
      add(SyncActivities());
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  Future<void> _onUpdateActivity(
    UpdateActivity event,
    Emitter<ActivityState> emit,
  ) async {
    try {
      final updated = domain.Activity(
        id: event.activity.id,
        serverId: event.activity.serverId,
        title: event.activity.title,
        status: event.activity.status,
        startAt: event.activity.startAt,
        dueAt: event.activity.dueAt,
        recurrenceRule: event.activity.recurrenceRule,
        metadata: event.activity.metadata,
        lastUpdatedAt: DateTime.now(),
        isSynced: false,
      );

      await activityRepository.saveActivity(updated);
      add(LoadActivities());
      add(SyncActivities());
    } catch (e) {
      // Handle error
    }
  }

  Future<void> _onDeleteActivity(
    DeleteActivity event,
    Emitter<ActivityState> emit,
  ) async {
    try {
      await activityRepository.deleteActivity(event.id);
      add(LoadActivities());
      // TODO: Handle sync delete (needs deletedAt logic)
    } catch (e) {
      // Handle error
    }
  }

  Future<void> _onSyncActivities(
    SyncActivities event,
    Emitter<ActivityState> emit,
  ) async {
    try {
      await syncService.pushChanges();
      await syncService.pullChanges();
      add(LoadActivities());
    } catch (e) {
      // Sync failed, but we persist local state
    }
  }
}
