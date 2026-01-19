import '../../domain/entities/flashcard.dart';

class Sm2Algorithm {
  // Quality: 0-5 (0 = blackout, 5 = perfect)
  static Flashcard calculateNextReview(Flashcard card, int quality) {
    int nextInterval;
    int nextRepetition;
    double nextEaseFactor;

    if (quality >= 3) {
      if (card.repetition == 0) {
        nextInterval = 1;
      } else if (card.repetition == 1) {
        nextInterval = 6;
      } else {
        nextInterval = (card.interval * card.easeFactor).round();
      }
      nextRepetition = card.repetition + 1;
    } else {
      nextInterval = 1;
      nextRepetition = 0;
    }

    nextEaseFactor =
        card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (nextEaseFactor < 1.3) nextEaseFactor = 1.3;

    return card.copyWith(
      interval: nextInterval,
      repetition: nextRepetition,
      easeFactor: nextEaseFactor,
      nextReviewDate: DateTime.now().add(Duration(days: nextInterval)),
    );
  }
}
