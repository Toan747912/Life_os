import 'package:study_os_app/data/datasources/database_helper.dart';
import 'package:study_os_app/data/models/flashcard_model.dart';
import 'package:study_os_app/domain/entities/flashcard.dart';
import 'package:study_os_app/domain/repositories/flashcard_repository.dart';

class FlashcardRepositoryImpl implements FlashcardRepository {
  final DatabaseHelper databaseHelper;

  FlashcardRepositoryImpl(this.databaseHelper);

  @override
  Future<List<Flashcard>> getFlashcards() async {
    final db = await databaseHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'flashcards',
      orderBy: 'created_at DESC',
    );
    return List.generate(maps.length, (i) {
      return FlashcardModel.fromMap(maps[i]);
    });
  }

  @override
  Future<List<Flashcard>> getDueFlashcards() async {
    final db = await databaseHelper.database;
    final now = DateTime.now().toIso8601String();
    final List<Map<String, dynamic>> maps = await db.query(
      'flashcards',
      where: 'next_review_date <= ?',
      whereArgs: [now],
      orderBy: 'next_review_date ASC',
    );
    return List.generate(maps.length, (i) {
      return FlashcardModel.fromMap(maps[i]);
    });
  }

  @override
  Future<void> addFlashcard(Flashcard flashcard) async {
    final db = await databaseHelper.database;
    final model = FlashcardModel(
      id: flashcard.id,
      frontContent: flashcard.frontContent,
      backContent: flashcard.backContent,
      cardType: flashcard.cardType,
      interval: flashcard.interval,
      repetition: flashcard.repetition,
      easeFactor: flashcard.easeFactor,
      nextReviewDate: flashcard.nextReviewDate,
      noteId: flashcard.noteId,
      createdAt: flashcard.createdAt,
    );
    await db.insert('flashcards', model.toMap());
  }

  @override
  Future<void> updateFlashcard(Flashcard flashcard) async {
    final db = await databaseHelper.database;
    final model = FlashcardModel(
      id: flashcard.id,
      frontContent: flashcard.frontContent,
      backContent: flashcard.backContent,
      cardType: flashcard.cardType,
      interval: flashcard.interval,
      repetition: flashcard.repetition,
      easeFactor: flashcard.easeFactor,
      nextReviewDate: flashcard.nextReviewDate,
      noteId: flashcard.noteId,
      createdAt: flashcard.createdAt,
    );
    await db.update(
      'flashcards',
      model.toMap(),
      where: 'id = ?',
      whereArgs: [flashcard.id],
    );
  }

  @override
  Future<void> deleteFlashcard(String id) async {
    final db = await databaseHelper.database;
    await db.delete('flashcards', where: 'id = ?', whereArgs: [id]);
  }
}
