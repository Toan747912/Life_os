import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/learning_engine/learning_engine.dart';
import '../../../../core/services/learning_engine/quiz_generator.dart';
import '../../../../core/services/learning_engine/cloze_generator.dart';
import '../../blocs/learning_session/learning_session_bloc.dart';

class GameScreen extends StatelessWidget {
  final String content;
  final String mode;

  const GameScreen({super.key, required this.content, required this.mode});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) =>
          LearningSessionBloc(LearningEngine())
            ..add(StartSession(content: content, mode: mode)),
      child: Scaffold(
        appBar: AppBar(
          title: Text('Review: $mode'),
          actions: [
            BlocBuilder<LearningSessionBloc, LearningSessionState>(
              builder: (context, state) {
                if (state is SessionInProgress) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.only(right: 16.0),
                      child: Text(
                        '${state.currentIndex + 1}/${state.totalQuestions}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ],
        ),
        body: BlocConsumer<LearningSessionBloc, LearningSessionState>(
          listener: (context, state) {
            if (state is SessionCompleted) {
              context.go(
                '/learning/result',
                extra: {'score': state.score, 'total': state.totalQuestions},
              );
            }
          },
          builder: (context, state) {
            if (state is SessionLoading) {
              return const Center(child: CircularProgressIndicator());
            } else if (state is SessionInProgress) {
              return _buildGameArea(context, state);
            } else if (state is SessionFeedback) {
              return _buildFeedbackOverlay(context, state);
            }
            return const Center(child: Text('Preparing Session...'));
          },
        ),
      ),
    );
  }

  Widget _buildGameArea(BuildContext context, SessionInProgress state) {
    final question = state.currentQuestion;

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LinearProgressIndicator(
            value: (state.currentIndex) / state.totalQuestions,
            minHeight: 8,
            borderRadius: BorderRadius.circular(4),
          ),
          const SizedBox(height: 32),
          if (question is QuizQuestion)
            _buildQuizView(context, question)
          else if (question is ClozeToken)
            _buildClozeView(context, question),
        ],
      ),
    );
  }

  Widget _buildQuizView(BuildContext context, QuizQuestion question) {
    return Column(
      children: [
        Text(
          question.questionText,
          style: const TextStyle(fontSize: 20, height: 1.5),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
        ...question.options.map(
          (option) => Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: SizedBox(
              width: double.infinity,
              height: 56, // Large touch target
              child: ElevatedButton(
                onPressed: () {
                  context.read<LearningSessionBloc>().add(SubmitAnswer(option));
                },
                child: Text(option, style: const TextStyle(fontSize: 18)),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildClozeView(BuildContext context, ClozeToken token) {
    final TextEditingController _controller = TextEditingController();

    return Column(
      children: [
        const Text(
          "Fill in the blank:",
          style: TextStyle(fontSize: 18, color: Colors.grey),
        ),
        const SizedBox(height: 16),
        Text(
          "Token: ${token.text.replaceAll(RegExp(r'.'), '_')}", // Mask the word completely or partially
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            letterSpacing: 2,
          ),
        ),
        const SizedBox(height: 32),
        TextField(
          controller: _controller,
          autofocus: true,
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
            labelText: 'Type the word',
          ),
          onSubmitted: (value) {
            context.read<LearningSessionBloc>().add(SubmitAnswer(value));
          },
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: () {
            context.read<LearningSessionBloc>().add(
              SubmitAnswer(_controller.text),
            );
          },
          child: const Text("Submit"),
        ),
      ],
    );
  }

  Widget _buildFeedbackOverlay(BuildContext context, SessionFeedback state) {
    final color = state.isCorrect ? Colors.green : Colors.red;
    final icon = state.isCorrect ? Icons.check_circle : Icons.error;
    final message = state.isCorrect ? "Correct!" : "Wrong!";

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 80, color: color),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(
              fontSize: 32,
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          if (!state.isCorrect && state.correctAnswer != null)
            Text(
              "Answer: ${state.correctAnswer}",
              style: const TextStyle(fontSize: 20),
            ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () {
              context.read<LearningSessionBloc>().add(NextQuestion());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: color,
              foregroundColor: Colors.white,
            ),
            child: const Text("Next Question"),
          ),
        ],
      ),
    );
  }
}
