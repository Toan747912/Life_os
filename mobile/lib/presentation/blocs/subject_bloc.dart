import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import '../../domain/entities/subject.dart';
import '../../domain/repositories/subject_repository.dart';

// Events
abstract class SubjectEvent extends Equatable {
  const SubjectEvent();
  @override
  List<Object> get props => [];
}

class LoadSubjects extends SubjectEvent {}

class AddSubject extends SubjectEvent {
  final Subject subject;
  const AddSubject(this.subject);
  @override
  List<Object> get props => [subject];
}

class UpdateSubject extends SubjectEvent {
  final Subject subject;
  const UpdateSubject(this.subject);
  @override
  List<Object> get props => [subject];
}

class DeleteSubject extends SubjectEvent {
  final String id;
  const DeleteSubject(this.id);
  @override
  List<Object> get props => [id];
}

// State
abstract class SubjectState extends Equatable {
  const SubjectState();
  @override
  List<Object> get props => [];
}

class SubjectInitial extends SubjectState {}

class SubjectLoading extends SubjectState {}

class SubjectLoaded extends SubjectState {
  final List<Subject> subjects;
  const SubjectLoaded(this.subjects);
  @override
  List<Object> get props => [subjects];
}

class SubjectError extends SubjectState {
  final String message;
  const SubjectError(this.message);
  @override
  List<Object> get props => [message];
}

// BLoC
class SubjectBloc extends Bloc<SubjectEvent, SubjectState> {
  final SubjectRepository repository;

  SubjectBloc({required this.repository}) : super(SubjectInitial()) {
    on<LoadSubjects>(_onLoadSubjects);
    on<AddSubject>(_onAddSubject);
    on<UpdateSubject>(_onUpdateSubject);
    on<DeleteSubject>(_onDeleteSubject);
  }

  Future<void> _onLoadSubjects(
    LoadSubjects event,
    Emitter<SubjectState> emit,
  ) async {
    emit(SubjectLoading());
    try {
      final subjects = await repository.getSubjects();
      emit(SubjectLoaded(subjects));
    } catch (e) {
      emit(SubjectError(e.toString()));
    }
  }

  Future<void> _onAddSubject(
    AddSubject event,
    Emitter<SubjectState> emit,
  ) async {
    try {
      await repository.addSubject(event.subject);
      add(LoadSubjects());
    } catch (e) {
      emit(SubjectError(e.toString()));
    }
  }

  Future<void> _onUpdateSubject(
    UpdateSubject event,
    Emitter<SubjectState> emit,
  ) async {
    try {
      await repository.updateSubject(event.subject);
      add(LoadSubjects());
    } catch (e) {
      emit(SubjectError(e.toString()));
    }
  }

  Future<void> _onDeleteSubject(
    DeleteSubject event,
    Emitter<SubjectState> emit,
  ) async {
    try {
      await repository.deleteSubject(event.id);
      add(LoadSubjects());
    } catch (e) {
      emit(SubjectError(e.toString()));
    }
  }
}
