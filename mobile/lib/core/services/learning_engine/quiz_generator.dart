import 'dart:math';

import 'cloze_generator.dart';

class QuizQuestion {
  final String questionText; // The sentence with the blank
  final String correctAnswer;
  final List<String> options; // 1 correct + 3 distractors
  final String? explanation;

  QuizQuestion({
    required this.questionText,
    required this.correctAnswer,
    required this.options,
    this.explanation,
  });
}

class QuizGenerator {
  final Random _random = Random();

  /// Generates a list of Quiz Questions from the text.
  /// [text] is the full content.
  List<QuizQuestion> generateQuiz(String text, {int maxQuestions = 5}) {
    // 1. Tokenize sentences
    // Simplified sentence splitting.
    final sentences = text
        .split(RegExp(r'(?<=[.!?])\s+'))
        .where((s) => s.length > 20)
        .toList();

    // 2. Identify tokens
    // We'll reuse logic similar to Cloze to find valid words.
    final List<String> allWords = _extractAllWords(text);

    final List<QuizQuestion> questions = [];

    // Shuffle sentences to pick random ones
    sentences.shuffle(_random);

    for (final sentence in sentences) {
      if (questions.length >= maxQuestions) break;

      final words = _extractAllWords(sentence);
      if (words.isEmpty) continue;

      // Pick a random word to hide
      String targetWord = words[_random.nextInt(words.length)];

      // Ensure target word is long enough
      if (targetWord.length < 4) continue;

      // Generate distractors
      final distractors = _generateDistractors(targetWord, allWords);

      if (distractors.length < 3) continue;

      // Create Question Text (Replace word with ____)
      final questionText = sentence.replaceAll(targetWord, '____');

      final options = [targetWord, ...distractors]..shuffle(_random);

      questions.add(
        QuizQuestion(
          questionText: questionText,
          correctAnswer: targetWord,
          options: options,
        ),
      );
    }

    return questions;
  }

  List<String> _extractAllWords(String text) {
    // Naive extraction: splits by non-word chars, filters stops/short words
    final RegExp wordRegex = RegExp(r"\b[a-zA-Z]{3,}\b");
    return wordRegex
        .allMatches(text)
        .map((m) => m.group(0)!)
        .where((w) => !ClozeGenerator.stopWords.contains(w.toLowerCase()))
        .toList();
  }

  List<String> _generateDistractors(String correct, List<String> allWords) {
    // Strategy:
    // 1. Pick words of similar length (+/- 2 letters)
    // 2. Different from correct word
    // 3. Unique

    final Set<String> distractors = {};
    final candidates = allWords
        .where(
          (w) =>
              w.toLowerCase() != correct.toLowerCase() &&
              (w.length - correct.length).abs() <= 2,
        )
        .toList();

    candidates.shuffle(_random);

    for (final word in candidates) {
      distractors.add(word);
      if (distractors.length >= 3) break;
    }

    // Only return if we found enough
    if (distractors.length == 3) {
      return distractors.toList();
    }

    return [];
  }
}
