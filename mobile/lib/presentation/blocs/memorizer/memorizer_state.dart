import 'package:equatable/equatable.dart';
import 'memorizer_event.dart';

class MemorizerToken extends Equatable {
  final String text;
  final bool isVisible;
  final bool isPunctuation;

  const MemorizerToken({
    required this.text,
    this.isVisible = true,
    this.isPunctuation = false,
  });

  MemorizerToken copyWith({
    String? text,
    bool? isVisible,
    bool? isPunctuation,
  }) {
    return MemorizerToken(
      text: text ?? this.text,
      isVisible: isVisible ?? this.isVisible,
      isPunctuation: isPunctuation ?? this.isPunctuation,
    );
  }

  @override
  List<Object> get props => [text, isVisible, isPunctuation];
}

enum ScrambleStatus { playing, correct, wrong }

class MemorizerState extends Equatable {
  final String originalText;
  final MemorizerMode mode;
  final List<MemorizerToken> tokens;
  final double difficultLevel; // For Cloze mode (0.0 - 1.0)

  // Scramble Mode Fields
  final List<String> scrambleSentences;
  final int currentScrambleIndex;
  final List<String> shuffledTokens;
  final List<String> userAnswer;
  final ScrambleStatus scrambleStatus;

  // Persistence map: <Index, {userAnswer: [], shuffledTokens: []}>
  final Map<int, Map<String, dynamic>> savedStates;

  const MemorizerState({
    this.originalText = '',
    this.mode = MemorizerMode.read,
    this.tokens = const [],
    this.difficultLevel = 0.2,
    this.scrambleSentences = const [],
    this.currentScrambleIndex = 0,
    this.shuffledTokens = const [],
    this.userAnswer = const [],
    this.scrambleStatus = ScrambleStatus.playing,
    this.savedStates = const {},
  });

  MemorizerState copyWith({
    String? originalText,
    MemorizerMode? mode,
    List<MemorizerToken>? tokens,
    double? difficultLevel,
    List<String>? scrambleSentences,
    int? currentScrambleIndex,
    List<String>? shuffledTokens,
    List<String>? userAnswer,
    ScrambleStatus? scrambleStatus,
    Map<int, Map<String, dynamic>>? savedStates,
  }) {
    return MemorizerState(
      originalText: originalText ?? this.originalText,
      mode: mode ?? this.mode,
      tokens: tokens ?? this.tokens,
      difficultLevel: difficultLevel ?? this.difficultLevel,
      scrambleSentences: scrambleSentences ?? this.scrambleSentences,
      currentScrambleIndex: currentScrambleIndex ?? this.currentScrambleIndex,
      shuffledTokens: shuffledTokens ?? this.shuffledTokens,
      userAnswer: userAnswer ?? this.userAnswer,
      scrambleStatus: scrambleStatus ?? this.scrambleStatus,
      savedStates: savedStates ?? this.savedStates,
    );
  }

  @override
  List<Object> get props => [
    originalText,
    mode,
    tokens,
    difficultLevel,
    scrambleSentences,
    currentScrambleIndex,
    shuffledTokens,
    userAnswer,
    scrambleStatus,
    savedStates,
  ];
}
