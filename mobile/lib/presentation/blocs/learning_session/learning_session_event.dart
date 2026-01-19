part of 'learning_session_bloc.dart';

abstract class LearningSessionEvent {}

class StartSession extends LearningSessionEvent {
  final String content;
  final String mode; // 'QUIZ' or 'CLOZE'

  StartSession({required this.content, required this.mode});
}

class SubmitAnswer extends LearningSessionEvent {
  final String answer; // For Quiz: selected option. For Cloze: typed text.

  SubmitAnswer(this.answer);
}

class NextQuestion extends LearningSessionEvent {}

class FinishSession extends LearningSessionEvent {}
