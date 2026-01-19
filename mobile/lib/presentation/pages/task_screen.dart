import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../data/services/sync_service.dart';
import '../../data/repositories/entity_repository_impl.dart';
import '../../domain/repositories/entity_repository.dart';
import '../../domain/repositories/auth_repository.dart';
import '../bloc/entity/entity_bloc.dart';
import '../bloc/entity/entity_event.dart';
import '../bloc/entity/entity_state.dart';
import '../widgets/dynamic_entity_list.dart';

class TaskScreen extends StatelessWidget {
  const TaskScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Providing Repository and Bloc locally for this screen for now.
    // In production, these should be in main.dart or a global provider.
    return RepositoryProvider<EntityRepository>(
      create: (context) => EntityRepositoryImpl(
        authRepository: context.read<AuthRepository>(),
        syncService: context.read<SyncService>(),
      ),
      child: BlocProvider(
        create: (context) => EntityBloc(
          repository: context.read<EntityRepository>(),
        )..add(const LoadEntities('default-workspace-id')), // Mock workspace ID
        child: const _TaskScreenView(),
      ),
    );
  }
}

class _TaskScreenView extends StatelessWidget {
  const _TaskScreenView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Workspaces'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<EntityBloc>().add(
                const LoadEntities('default-workspace-id'),
              );
            },
          ),
        ],
      ),
      body: BlocBuilder<EntityBloc, EntityState>(
        builder: (context, state) {
          if (state is EntityLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is EntityLoaded) {
            return DynamicEntityList(entities: state.entities);
          } else if (state is EntityError) {
            return Center(child: Text('Error: ${state.message}'));
          }
          return const Center(child: Text('Tap + to create a task'));
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Quick mock creation for testing
          context.read<EntityBloc>().add(
            const CreateEntity(
              workspaceId: 'default-workspace-id',
              type: 'task',
              data: {'title': 'New Dynamic Task', 'status': 'Todo'},
            ),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
