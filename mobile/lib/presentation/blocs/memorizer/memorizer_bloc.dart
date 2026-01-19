import 'dart:math';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'memorizer_event.dart';
import 'memorizer_state.dart';

class MemorizerBloc extends Bloc<MemorizerEvent, MemorizerState> {
  MemorizerBloc() : super(const MemorizerState()) {
    on<UpdateText>(_onUpdateText);
    on<ChangeMode>(_onChangeMode);
    on<ToggleReveal>(_onToggleReveal);
    on<SelectScrambleToken>(_onSelectScrambleToken);
    on<DeselectScrambleToken>(_onDeselectScrambleToken);
    on<CheckScrambleAnswer>(_onCheckScrambleAnswer);
    on<NextScrambleSentence>(_onNextScrambleSentence);
    on<ResetScrambleSentence>(_onResetScrambleSentence);
    on<JumpToScrambleSentence>(_onJumpToScrambleSentence);
    on<RestoreScrambleState>(_onRestoreScrambleState);
  }

  void _onUpdateText(UpdateText event, Emitter<MemorizerState> emit) {
    final regex = RegExp(r"([\w']+)|([^\w\s]+)", multiLine: true);
    final tokens = <MemorizerToken>[];

    event.text.splitMapJoin(
      regex,
      onMatch: (m) {
        final word = m.group(1);
        final punctuation = m.group(2);
        if (word != null) {
          tokens.add(MemorizerToken(text: word, isPunctuation: false));
        } else if (punctuation != null) {
          tokens.add(MemorizerToken(text: punctuation, isPunctuation: true));
        }
        return '';
      },
      onNonMatch: (n) {
        if (n.isNotEmpty) {
          tokens.add(MemorizerToken(text: n, isPunctuation: true));
        }
        return n;
      },
    );

    emit(
      state.copyWith(
        originalText: event.text,
        tokens: tokens,
        mode: MemorizerMode.read,
      ),
    );
  }

  void _onChangeMode(ChangeMode event, Emitter<MemorizerState> emit) {
    if (event.mode == MemorizerMode.scramble) {
      final sentences = state.originalText
          .split(RegExp(r'(?<=[.!?])\s+'))
          .where((s) => s.trim().isNotEmpty)
          .toList();

      if (sentences.isEmpty) {
        if (state.originalText.isNotEmpty) {
          sentences.add(state.originalText);
        } else {
          emit(
            state.copyWith(
              mode: event.mode,
              scrambleSentences: [],
              shuffledTokens: [],
            ),
          );
          return;
        }
      }

      int startIndex = event.initialScrambleIndex ?? 0;
      if (startIndex < 0 || startIndex >= sentences.length) startIndex = 0;

      // Check for saved state (handled in UI via RestoreScrambleState usually, but check here too?)
      // We assume ChangeMode is initial. If UI restores, it calls RestoreScrambleState.
      // But we can check internal savedStates if we had any (unlikely on fresh start).

      final startSentence = sentences[startIndex];
      final tokens = _generateScrambleTokens(startSentence);

      emit(
        state.copyWith(
          mode: event.mode,
          scrambleSentences: sentences,
          currentScrambleIndex: startIndex,
          shuffledTokens: tokens,
          userAnswer: [],
          scrambleStatus: ScrambleStatus.playing,
        ),
      );
      return;
    }

    if (event.mode == MemorizerMode.read) {
      final newTokens = state.tokens
          .map((t) => t.copyWith(isVisible: true))
          .toList();
      emit(state.copyWith(mode: event.mode, tokens: newTokens));
      return;
    }

    final random = Random();
    final newTokens = state.tokens.map((t) {
      if (t.isPunctuation) return t.copyWith(isVisible: true);
      if (event.mode == MemorizerMode.cloze) {
        final shouldHide = random.nextDouble() < state.difficultLevel;
        return t.copyWith(isVisible: !shouldHide);
      }
      if (event.mode == MemorizerMode.firstLetter) {
        return t.copyWith(isVisible: false);
      }
      return t;
    }).toList();

    emit(state.copyWith(mode: event.mode, tokens: newTokens));
  }

  void _onToggleReveal(ToggleReveal event, Emitter<MemorizerState> emit) {
    final tokens = List<MemorizerToken>.from(state.tokens);
    final current = tokens[event.tokenIndex];
    tokens[event.tokenIndex] = current.copyWith(isVisible: !current.isVisible);
    emit(state.copyWith(tokens: tokens));
  }

  List<String> _generateScrambleTokens(String sentence) {
    final words = sentence.trim().split(RegExp(r'\s+'));
    final shuffled = List<String>.from(words)..shuffle();
    return shuffled;
  }

  // Helper to save current state into savedStates map
  Map<int, Map<String, dynamic>> _saveCurrentProgress() {
    final newMap = Map<int, Map<String, dynamic>>.from(state.savedStates);
    newMap[state.currentScrambleIndex] = {
      'userAnswer': state.userAnswer,
      'shuffledTokens': state.shuffledTokens,
      'status': state.scrambleStatus
          .toString()
          .split('.')
          .last, // 'playing', 'correct', 'wrong'
    };
    return newMap;
  }

  void _onSelectScrambleToken(
    SelectScrambleToken event,
    Emitter<MemorizerState> emit,
  ) {
    if (state.scrambleStatus != ScrambleStatus.playing) return;
    final newShuffled = List<String>.from(state.shuffledTokens);
    if (!newShuffled.remove(event.token)) return;
    final newUserAnswer = List<String>.from(state.userAnswer)..add(event.token);

    // Save state on every move? Or just keep in memory until sentence switch?
    // User wants partial persistence. Just keeping in memory is fine for "switch sentence".
    // For "exit app", UI needs to fetch state.
    emit(
      state.copyWith(shuffledTokens: newShuffled, userAnswer: newUserAnswer),
    );
  }

  void _onDeselectScrambleToken(
    DeselectScrambleToken event,
    Emitter<MemorizerState> emit,
  ) {
    if (state.scrambleStatus != ScrambleStatus.playing) return;
    final newUserAnswer = List<String>.from(state.userAnswer);
    if (!newUserAnswer.remove(event.token)) return;
    final newShuffled = List<String>.from(state.shuffledTokens)
      ..add(event.token);
    emit(
      state.copyWith(shuffledTokens: newShuffled, userAnswer: newUserAnswer),
    );
  }

  void _onCheckScrambleAnswer(
    CheckScrambleAnswer event,
    Emitter<MemorizerState> emit,
  ) {
    final currentSentence = state.scrambleSentences[state.currentScrambleIndex];
    final originalWords = currentSentence.trim().split(RegExp(r'\s+'));
    bool isCorrect = true;
    if (state.userAnswer.length != originalWords.length) {
      isCorrect = false;
    } else {
      for (int i = 0; i < originalWords.length; i++) {
        if (state.userAnswer[i] != originalWords[i]) {
          isCorrect = false;
          break;
        }
      }
    }
    // Sync status to saved map immediately
    final newStatus = isCorrect ? ScrambleStatus.correct : ScrambleStatus.wrong;
    final newMap = Map<int, Map<String, dynamic>>.from(state.savedStates);
    if (newMap.containsKey(state.currentScrambleIndex)) {
      newMap[state.currentScrambleIndex]!['status'] = newStatus
          .toString()
          .split('.')
          .last;
    } else {
      newMap[state.currentScrambleIndex] = {
        'userAnswer': state.userAnswer,
        'shuffledTokens': state.shuffledTokens,
        'status': newStatus.toString().split('.').last,
      };
    }

    emit(state.copyWith(scrambleStatus: newStatus, savedStates: newMap));
  }

  void _onNextScrambleSentence(
    NextScrambleSentence event,
    Emitter<MemorizerState> emit,
  ) {
    if (state.currentScrambleIndex >= state.scrambleSentences.length - 1)
      return;

    // Save current before moving
    final updatedSavedStates = _saveCurrentProgress();

    final nextIndex = state.currentScrambleIndex + 1;

    // Check if we have saved state for next index
    List<String> tokens;
    List<String> answer = [];
    ScrambleStatus status = ScrambleStatus.playing;

    if (updatedSavedStates.containsKey(nextIndex)) {
      tokens = List<String>.from(
        updatedSavedStates[nextIndex]!['shuffledTokens'],
      );
      answer = List<String>.from(updatedSavedStates[nextIndex]!['userAnswer']);

      final statusStr = updatedSavedStates[nextIndex]!['status'] as String?;
      if (statusStr != null) {
        status = ScrambleStatus.values.firstWhere(
          (e) => e.toString().split('.').last == statusStr,
          orElse: () => ScrambleStatus.playing,
        );
      }
    } else {
      final nextSentence = state.scrambleSentences[nextIndex];
      tokens = _generateScrambleTokens(nextSentence);
    }

    emit(
      state.copyWith(
        currentScrambleIndex: nextIndex,
        shuffledTokens: tokens,
        userAnswer: answer,
        scrambleStatus: status,
        savedStates: updatedSavedStates,
      ),
    );
  }

  void _onResetScrambleSentence(
    ResetScrambleSentence event,
    Emitter<MemorizerState> emit,
  ) {
    final currentSentence = state.scrambleSentences[state.currentScrambleIndex];
    final tokens = _generateScrambleTokens(currentSentence);

    // Clear from saved map
    final newMap = Map<int, Map<String, dynamic>>.from(state.savedStates);
    newMap.remove(state.currentScrambleIndex);

    emit(
      state.copyWith(
        shuffledTokens: tokens,
        userAnswer: [],
        scrambleStatus: ScrambleStatus.playing,
        savedStates: newMap,
      ),
    );
  }

  void _onJumpToScrambleSentence(
    JumpToScrambleSentence event,
    Emitter<MemorizerState> emit,
  ) {
    if (event.index < 0 || event.index >= state.scrambleSentences.length)
      return;

    // Save current before moving
    final updatedSavedStates = _saveCurrentProgress();

    // Check target
    List<String> tokens;
    List<String> answer = [];
    ScrambleStatus status = ScrambleStatus.playing;

    if (updatedSavedStates.containsKey(event.index)) {
      tokens = List<String>.from(
        updatedSavedStates[event.index]!['shuffledTokens'],
      );
      answer = List<String>.from(
        updatedSavedStates[event.index]!['userAnswer'],
      );
      final statusStr = updatedSavedStates[event.index]!['status'] as String?;
      if (statusStr != null) {
        status = ScrambleStatus.values.firstWhere(
          (e) => e.toString().split('.').last == statusStr,
          orElse: () => ScrambleStatus.playing,
        );
      }
    } else {
      final sentence = state.scrambleSentences[event.index];
      tokens = _generateScrambleTokens(sentence);
    }

    emit(
      state.copyWith(
        currentScrambleIndex: event.index,
        shuffledTokens: tokens,
        userAnswer: answer,
        scrambleStatus: status,
        savedStates: updatedSavedStates,
      ),
    );
  }

  void _onRestoreScrambleState(
    RestoreScrambleState event,
    Emitter<MemorizerState> emit,
  ) {
    final newMap = Map<int, Map<String, dynamic>>.from(state.savedStates);

    // Restore full history if provided
    if (event.fullHistory != null) {
      newMap.addAll(event.fullHistory!);
    }

    // Ensure current view is consistent with restored state
    // Also restore status if available in history map or passed?
    // The event passed only tokens/answer. Ideally event updates to pass status too or we derive it?
    // Or we rely on 'fullHistory' to set the map, then re-read map for 'index'.

    ScrambleStatus status = ScrambleStatus.playing;
    // Check if map has status for this index (from fullHistory merge)
    if (newMap.containsKey(event.index)) {
      final statusStr = newMap[event.index]!['status'] as String?;
      if (statusStr != null) {
        status = ScrambleStatus.values.firstWhere(
          (e) => e.toString().split('.').last == statusStr,
          orElse: () => ScrambleStatus.playing,
        );
      }
    }

    // Override map entry with explicit event data (which is arguably fresher or source of truth?)
    // But event data doesn't have status param currently.
    // If we assume event.userAnswer/shuffledTokens matches what's in fullHistory[index], we are good.
    // Update map with active data + calculated/restored status
    newMap[event.index] = {
      'shuffledTokens': event.shuffledTokens,
      'userAnswer': event.userAnswer,
      'status': status.toString().split('.').last,
    };

    emit(
      state.copyWith(
        currentScrambleIndex: event.index,
        shuffledTokens: event.shuffledTokens,
        userAnswer: event.userAnswer,
        scrambleStatus: status,
        savedStates: newMap,
      ),
    );
  }
}
