import 'cloze_generator.dart';
import 'fuzzy_matcher.dart';
import 'quiz_generator.dart';

class LearningEngine {
  final ClozeGenerator _clozeGenerator;
  final QuizGenerator _quizGenerator;

  LearningEngine({ClozeGenerator? clozeGenerator, QuizGenerator? quizGenerator})
    : _clozeGenerator = clozeGenerator ?? ClozeGenerator(),
      _quizGenerator = quizGenerator ?? QuizGenerator();

  // --- Facade Methods ---

  /// Generates a Cloze (Fill-in-the-blank) session data.
  List<ClozeToken> generateClozeSession(
    String text, {
    double difficulty = 0.2,
  }) {
    return _clozeGenerator.generateCloze(text, difficulty: difficulty);
  }

  /// Generates a Quiz (Multiple Choice) session data.
  List<QuizQuestion> generateQuizSession(String text, {int maxQuestions = 5}) {
    return _quizGenerator.generateQuiz(text, maxQuestions: maxQuestions);
  }

  /// Checks an answer.
  MatchResult checkAnswer(String target, String input) {
    return FuzzyMatcher.check(target, input);
  }
}
