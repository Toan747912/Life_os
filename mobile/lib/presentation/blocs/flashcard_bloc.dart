import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:study_os_app/core/utils/sm2_algorithm.dart';
import '../../domain/entities/flashcard.dart';
import '../../domain/repositories/flashcard_repository.dart';

// Events
abstract class FlashcardEvent extends Equatable {
  const FlashcardEvent();
  @override
  List<Object> get props => [];
}

class LoadFlashcards extends FlashcardEvent {}

class LoadDueFlashcards extends FlashcardEvent {}

class AddFlashcard extends FlashcardEvent {
  final Flashcard flashcard;
  const AddFlashcard(this.flashcard);
  @override
  List<Object> get props => [flashcard];
}

class ReviewFlashcard extends FlashcardEvent {
  final Flashcard flashcard;
  final int quality; // 0-5
  const ReviewFlashcard(this.flashcard, this.quality);
  @override
  List<Object> get props => [flashcard, quality];
}

class DeleteFlashcard extends FlashcardEvent {
  final String id;
  const DeleteFlashcard(this.id);
  @override
  List<Object> get props => [id];
}

// State
abstract class FlashcardState extends Equatable {
  const FlashcardState();
  @override
  List<Object> get props => [];
}

class FlashcardInitial extends FlashcardState {}

class FlashcardLoading extends FlashcardState {}

class FlashcardLoaded extends FlashcardState {
  final List<Flashcard> allFlashcards;
  final List<Flashcard> dueFlashcards;

  const FlashcardLoaded({
    this.allFlashcards = const [],
    this.dueFlashcards = const [],
  });

  @override
  List<Object> get props => [allFlashcards, dueFlashcards];
}

class FlashcardError extends FlashcardState {
  final String message;
  const FlashcardError(this.message);
  @override
  List<Object> get props => [message];
}

// BLoC
class FlashcardBloc extends Bloc<FlashcardEvent, FlashcardState> {
  final FlashcardRepository repository;

  FlashcardBloc({required this.repository}) : super(FlashcardInitial()) {
    on<LoadFlashcards>(_onLoadFlashcards);
    on<LoadDueFlashcards>(_onLoadDueFlashcards);
    on<AddFlashcard>(_onAddFlashcard);
    on<ReviewFlashcard>(_onReviewFlashcard);
    on<DeleteFlashcard>(_onDeleteFlashcard);
  }

  Future<void> _onLoadFlashcards(
    LoadFlashcards event,
    Emitter<FlashcardState> emit,
  ) async {
    emit(FlashcardLoading());
    try {
      final all = await repository.getFlashcards();
      final due = await repository.getDueFlashcards();
      emit(FlashcardLoaded(allFlashcards: all, dueFlashcards: due));
    } catch (e) {
      emit(FlashcardError(e.toString()));
    }
  }

  Future<void> _onLoadDueFlashcards(
    LoadDueFlashcards event,
    Emitter<FlashcardState> emit,
  ) async {
    // Usually handled by LoadFlashcards, but kept for explicit reload
    add(LoadFlashcards());
  }

  Future<void> _onAddFlashcard(
    AddFlashcard event,
    Emitter<FlashcardState> emit,
  ) async {
    try {
      await repository.addFlashcard(event.flashcard);
      add(LoadFlashcards());
    } catch (e) {
      emit(FlashcardError(e.toString()));
    }
  }

  Future<void> _onReviewFlashcard(
    ReviewFlashcard event,
    Emitter<FlashcardState> emit,
  ) async {
    try {
      final updatedCard = Sm2Algorithm.calculateNextReview(
        event.flashcard,
        event.quality,
      );
      await repository.updateFlashcard(updatedCard);
      add(LoadFlashcards());
    } catch (e) {
      emit(FlashcardError(e.toString()));
    }
  }

  Future<void> _onDeleteFlashcard(
    DeleteFlashcard event,
    Emitter<FlashcardState> emit,
  ) async {
    try {
      await repository.deleteFlashcard(event.id);
      add(LoadFlashcards());
    } catch (e) {
      emit(FlashcardError(e.toString()));
    }
  }
}
