part of 'learning_session_bloc.dart';

abstract class LearningSessionState {}

class SessionInitial extends LearningSessionState {}

class SessionLoading extends LearningSessionState {}

class SessionInProgress extends LearningSessionState {
  final int currentIndex;
  final int totalQuestions;
  final int score;
  final dynamic
  currentQuestion; // QuizQuestion or ClozeToken (if doing sentence-by-sentence)

  // For Cloze Mode, we might show the whole text with tokens
  final List<dynamic>? allTokens;

  SessionInProgress({
    required this.currentIndex,
    required this.totalQuestions,
    required this.score,
    required this.currentQuestion,
    this.allTokens,
  });
}

class SessionFeedback extends LearningSessionState {
  final bool isCorrect;
  final String? correctAnswer;
  final String? explanation;
  final int score;
  final MatchResult? matchResult; // Detailed result (Correct, Typo, Wrong)

  SessionFeedback({
    required this.isCorrect,
    this.correctAnswer,
    this.explanation,
    required this.score,
    this.matchResult,
  });
}

class SessionCompleted extends LearningSessionState {
  final int score;
  final int totalQuestions;
  final List<String> mistakes; // Simple list for now

  SessionCompleted({
    required this.score,
    required this.totalQuestions,
    required this.mistakes,
  });
}
