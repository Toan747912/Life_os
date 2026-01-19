import 'package:equatable/equatable.dart';

enum CardType { text, quiz }

class Flashcard extends Equatable {
  final String id;
  final String frontContent;
  final String backContent;
  final CardType cardType;

  // SM-2 Algorithm State
  final int interval;
  final int repetition;
  final double easeFactor;
  final DateTime nextReviewDate;

  final String? noteId;
  final DateTime createdAt;

  const Flashcard({
    required this.id,
    required this.frontContent,
    required this.backContent,
    this.cardType = CardType.text,
    this.interval = 0,
    this.repetition = 0,
    this.easeFactor = 2.5,
    required this.nextReviewDate,
    this.noteId,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
    id,
    frontContent,
    backContent,
    cardType,
    interval,
    repetition,
    easeFactor,
    nextReviewDate,
    noteId,
    createdAt,
  ];

  // CopyWith for updating state
  Flashcard copyWith({
    String? id,
    String? frontContent,
    String? backContent,
    CardType? cardType,
    int? interval,
    int? repetition,
    double? easeFactor,
    DateTime? nextReviewDate,
    String? noteId,
    DateTime? createdAt,
  }) {
    return Flashcard(
      id: id ?? this.id,
      frontContent: frontContent ?? this.frontContent,
      backContent: backContent ?? this.backContent,
      cardType: cardType ?? this.cardType,
      interval: interval ?? this.interval,
      repetition: repetition ?? this.repetition,
      easeFactor: easeFactor ?? this.easeFactor,
      nextReviewDate: nextReviewDate ?? this.nextReviewDate,
      noteId: noteId ?? this.noteId,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
