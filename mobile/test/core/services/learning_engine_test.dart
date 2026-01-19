import 'package:flutter_test/flutter_test.dart';
// import 'package:study_os_app/core/services/learning_engine/cloze_generator.dart';
import 'package:study_os_app/core/services/learning_engine/fuzzy_matcher.dart';
import 'package:study_os_app/core/services/learning_engine/learning_engine.dart';
// import 'package:study_os_app/core/services/learning_engine/quiz_generator.dart';

void main() {
  group('LearningEngine Tests', () {
    late LearningEngine engine;

    setUp(() {
      engine = LearningEngine();
    });

    test('ClozeGenerator hides non-stop words', () {
      const text = "The quick brown fox jumps over the lazy dog.";
      final tokens = engine.generateClozeSession(
        text,
        difficulty: 1.0,
      ); // 100% chance to hide valid words

      // "The", "over", "the" are stop words (or short/common).
      // "quick", "brown", "fox", "jumps", "lazy", "dog" should be hidden.

      final hiddenTokens = tokens
          .where((t) => t.isHidden)
          .map((t) => t.text.toLowerCase())
          .toList();

      expect(
        hiddenTokens,
        containsAll(["quick", "brown", "fox", "jumps", "lazy", "dog"]),
      );
      expect(hiddenTokens, isNot(contains("the")));
    });

    test('QuizGenerator generates valid questions', () {
      const text =
          "Flutter is a UI toolkit. Dart is a programming language. Learning is fun.";
      final questions = engine.generateQuizSession(text);

      expect(questions.isNotEmpty, true);

      final q1 = questions.first;
      expect(q1.options.length, 4); // 1 correct + 3 distractors
      expect(q1.options, contains(q1.correctAnswer));
      expect(q1.questionText, contains('____'));
    });

    test('FuzzyMatcher detects typos', () {
      expect(
        engine.checkAnswer("Intelligence", "intelligence"),
        MatchResult.correct,
      );
      expect(
        engine.checkAnswer("Intelligence", "Inteligence"),
        MatchResult.typo,
      ); // 1 missing 'l'
      expect(
        engine.checkAnswer("Intelligence", "Intelllgence"),
        MatchResult.typo,
      ); // 1 wrong char
      expect(
        engine.checkAnswer("Cat", "Car"),
        MatchResult.wrong,
      ); // Short word, must be exact
      expect(engine.checkAnswer("Hello", "He"), MatchResult.wrong);
    });
  });
}
