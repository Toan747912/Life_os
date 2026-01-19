import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/services/learning_engine/learning_engine.dart';
import '../../../../core/services/learning_engine/cloze_generator.dart';
import '../../../../core/services/learning_engine/quiz_generator.dart';
import '../../../../core/services/learning_engine/fuzzy_matcher.dart';

part 'learning_session_event.dart';
part 'learning_session_state.dart';

class LearningSessionBloc
    extends Bloc<LearningSessionEvent, LearningSessionState> {
  final LearningEngine learningEngine;

  List<dynamic> _questions = [];
  int _currentIndex = 0;
  int _score = 0;
  List<String> _mistakes = [];

  LearningSessionBloc(this.learningEngine) : super(SessionInitial()) {
    on<StartSession>(_onStartSession);
    on<SubmitAnswer>(_onSubmitAnswer);
    on<NextQuestion>(_onNextQuestion);
    on<FinishSession>(_onFinishSession);
  }

  Future<void> _onStartSession(
    StartSession event,
    Emitter<LearningSessionState> emit,
  ) async {
    emit(SessionLoading());
    _score = 0;
    _currentIndex = 0;
    _mistakes = [];

    // Simulate async processing (e.g. heavy generation)
    await Future.delayed(const Duration(milliseconds: 100));

    if (event.mode == 'QUIZ') {
      _questions = learningEngine.generateQuizSession(event.content);
    } else if (event.mode == 'CLOZE') {
      // For Cloze, we can treat each "Blank" as a question if we want strict step-by-step
      // OR we can make the whole text one "question".
      // Let's do simple: Generate ClozeTokens. Filter ONLY tokens that are hidden.
      // Those are our "questions".

      final tokens = learningEngine.generateClozeSession(event.content);
      _questions = tokens.where((t) => t.isHidden).toList();
    }

    if (_questions.isEmpty) {
      emit(SessionCompleted(score: 0, totalQuestions: 0, mistakes: []));
      return;
    }

    emit(
      SessionInProgress(
        currentIndex: 0,
        totalQuestions: _questions.length,
        score: 0,
        currentQuestion: _questions[0],
      ),
    );
  }

  void _onSubmitAnswer(SubmitAnswer event, Emitter<LearningSessionState> emit) {
    if (_currentIndex >= _questions.length) return;

    final currentQ = _questions[_currentIndex];
    bool isCorrect = false;
    String? correctAnswer;
    MatchResult? matchResult;

    // Check Answer Logic
    if (currentQ is QuizQuestion) {
      correctAnswer = currentQ.correctAnswer;
      // Exact match for multiple choice
      isCorrect = event.answer == correctAnswer;
    } else if (currentQ is ClozeToken) {
      correctAnswer = currentQ.text;
      // Fuzzy Match for typing
      matchResult = learningEngine.checkAnswer(correctAnswer, event.answer);
      isCorrect =
          matchResult == MatchResult.correct || matchResult == MatchResult.typo;
    }

    if (isCorrect) {
      _score++;
    } else {
      _mistakes.add(
        "Q${_currentIndex + 1}",
      ); // Ideally store the actual question/answer pair
    }

    emit(
      SessionFeedback(
        isCorrect: isCorrect,
        correctAnswer: correctAnswer,
        score: _score,
        matchResult: matchResult,
      ),
    );
  }

  void _onNextQuestion(NextQuestion event, Emitter<LearningSessionState> emit) {
    if (_currentIndex < _questions.length - 1) {
      _currentIndex++;
      emit(
        SessionInProgress(
          currentIndex: _currentIndex,
          totalQuestions: _questions.length,
          score: _score,
          currentQuestion: _questions[_currentIndex],
        ),
      );
    } else {
      add(FinishSession());
    }
  }

  void _onFinishSession(
    FinishSession event,
    Emitter<LearningSessionState> emit,
  ) {
    emit(
      SessionCompleted(
        score: _score,
        totalQuestions: _questions.length,
        mistakes: _mistakes,
      ),
    );
  }
}
