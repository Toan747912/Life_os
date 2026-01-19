import 'package:equatable/equatable.dart';

abstract class MemorizerEvent extends Equatable {
  const MemorizerEvent();

  @override
  List<Object> get props => [];
}

class UpdateText extends MemorizerEvent {
  final String text;
  const UpdateText(this.text);

  @override
  List<Object> get props => [text];
}

enum MemorizerMode { read, firstLetter, cloze, scramble }

class ChangeMode extends MemorizerEvent {
  final MemorizerMode mode;
  final int? initialScrambleIndex;

  const ChangeMode(this.mode, {this.initialScrambleIndex});

  @override
  List<Object> get props => [mode, initialScrambleIndex ?? 0];
}

class ToggleReveal extends MemorizerEvent {
  final int tokenIndex;
  const ToggleReveal(this.tokenIndex);

  @override
  List<Object> get props => [tokenIndex];
}

// Scramble Events
class SelectScrambleToken extends MemorizerEvent {
  final String token;
  const SelectScrambleToken(this.token);

  @override
  List<Object> get props => [token];
}

class DeselectScrambleToken extends MemorizerEvent {
  final String token;
  const DeselectScrambleToken(this.token);

  @override
  List<Object> get props => [token];
}

class CheckScrambleAnswer extends MemorizerEvent {}

class NextScrambleSentence extends MemorizerEvent {}

class ResetScrambleSentence extends MemorizerEvent {}

class JumpToScrambleSentence extends MemorizerEvent {
  final int index;
  const JumpToScrambleSentence(this.index);

  @override
  List<Object> get props => [index];
}

class RestoreScrambleState extends MemorizerEvent {
  final int index;
  final List<String> shuffledTokens;
  final List<String> userAnswer;
  final Map<int, Map<String, dynamic>>? fullHistory;

  const RestoreScrambleState(
    this.index,
    this.shuffledTokens,
    this.userAnswer, {
    this.fullHistory,
  });

  @override
  List<Object> get props => [
    index,
    shuffledTokens,
    userAnswer,
    fullHistory ?? {},
  ];
}
