import 'package:study_os_app/domain/entities/flashcard.dart';

abstract class FlashcardRepository {
  Future<List<Flashcard>> getFlashcards();
  Future<List<Flashcard>> getDueFlashcards();
  Future<void> addFlashcard(Flashcard flashcard);
  Future<void> updateFlashcard(Flashcard flashcard);
  Future<void> deleteFlashcard(String id);
}
