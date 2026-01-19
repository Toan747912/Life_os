import 'package:study_os_app/domain/entities/flashcard.dart';

class FlashcardModel extends Flashcard {
  const FlashcardModel({
    required super.id,
    required super.frontContent,
    required super.backContent,
    super.cardType,
    super.interval,
    super.repetition,
    super.easeFactor,
    required super.nextReviewDate,
    super.noteId,
    required super.createdAt,
  });

  factory FlashcardModel.fromMap(Map<String, dynamic> map) {
    return FlashcardModel(
      id: map['id'],
      frontContent: map['front_content'],
      backContent: map['back_content'],
      cardType: map['card_type'] == 'QUIZ' ? CardType.quiz : CardType.text,
      interval: map['interval'] ?? 0,
      repetition: map['repetition'] ?? 0,
      easeFactor: map['ease_factor'] ?? 2.5,
      nextReviewDate: DateTime.parse(map['next_review_date']),
      noteId: map['note_id'],
      createdAt: DateTime.parse(map['created_at']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'front_content': frontContent,
      'back_content': backContent,
      'card_type': cardType == CardType.quiz ? 'QUIZ' : 'TEXT',
      'interval': interval,
      'repetition': repetition,
      'ease_factor': easeFactor,
      'next_review_date': nextReviewDate.toIso8601String(),
      'note_id': noteId,
      'created_at': createdAt.toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };
  }
}
