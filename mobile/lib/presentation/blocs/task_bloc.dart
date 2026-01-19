import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import '../../domain/entities/task.dart';
import '../../domain/repositories/task_repository.dart';

// Events
abstract class TaskEvent extends Equatable {
  const TaskEvent();

  @override
  List<Object> get props => [];
}

class LoadTasks extends TaskEvent {}

class AddTask extends TaskEvent {
  final Task task;
  const AddTask(this.task);

  @override
  List<Object> get props => [task];
}

class UpdateTask extends TaskEvent {
  final Task task;
  const UpdateTask(this.task);

  @override
  List<Object> get props => [task];
}

class DeleteTask extends TaskEvent {
  final String id;
  const DeleteTask(this.id);

  @override
  List<Object> get props => [id];
}

// State
abstract class TaskState extends Equatable {
  const TaskState();

  @override
  List<Object> get props => [];
}

class TaskInitial extends TaskState {}

class TaskLoading extends TaskState {}

class TaskLoaded extends TaskState {
  final List<Task> tasks;
  const TaskLoaded(this.tasks);

  @override
  List<Object> get props => [tasks];
}

class TaskError extends TaskState {
  final String message;
  const TaskError(this.message);

  @override
  List<Object> get props => [message];
}

// BLoC
class TaskBloc extends Bloc<TaskEvent, TaskState> {
  final TaskRepository repository;

  TaskBloc({required this.repository}) : super(TaskInitial()) {
    on<LoadTasks>(_onLoadTasks);
    on<AddTask>(_onAddTask);
    on<UpdateTask>(_onUpdateTask);
    on<DeleteTask>(_onDeleteTask);
  }

  Future<void> _onLoadTasks(LoadTasks event, Emitter<TaskState> emit) async {
    emit(TaskLoading());
    try {
      final tasks = await repository.getTasks();
      emit(TaskLoaded(tasks));
    } catch (e) {
      emit(TaskError(e.toString()));
    }
  }

  Future<void> _onAddTask(AddTask event, Emitter<TaskState> emit) async {
    try {
      await repository.addTask(event.task);
      add(LoadTasks());
    } catch (e) {
      emit(TaskError(e.toString()));
    }
  }

  Future<void> _onUpdateTask(UpdateTask event, Emitter<TaskState> emit) async {
    try {
      await repository.updateTask(event.task);
      add(LoadTasks());
    } catch (e) {
      emit(TaskError(e.toString()));
    }
  }

  Future<void> _onDeleteTask(DeleteTask event, Emitter<TaskState> emit) async {
    try {
      await repository.deleteTask(event.id);
      add(LoadTasks());
    } catch (e) {
      emit(TaskError(e.toString()));
    }
  }
}
