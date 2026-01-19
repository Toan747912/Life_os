import 'dart:async';
import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:study_os_app/core/utils/ticker.dart';
import 'package:study_os_app/domain/entities/focus_session.dart';
import 'package:study_os_app/domain/repositories/session_repository.dart';
import 'package:uuid/uuid.dart';

// Events
abstract class TimerEvent extends Equatable {
  const TimerEvent();
  @override
  List<Object> get props => [];
}

class TimerStarted extends TimerEvent {
  final int duration;
  const TimerStarted({required this.duration});
}

class TimerPaused extends TimerEvent {}

class TimerResumed extends TimerEvent {}

class TimerReset extends TimerEvent {}

class _TimerTicked extends TimerEvent {
  final int duration;
  const _TimerTicked({required this.duration});
}

// States
abstract class TimerState extends Equatable {
  final int duration;
  const TimerState(this.duration);
  @override
  List<Object> get props => [duration];
}

class TimerInitial extends TimerState {
  const TimerInitial(super.duration);
}

class TimerRunInProgress extends TimerState {
  const TimerRunInProgress(super.duration);
}

class TimerRunPause extends TimerState {
  const TimerRunPause(super.duration);
}

class TimerRunComplete extends TimerState {
  const TimerRunComplete() : super(0);
}

// BLoC
class TimerBloc extends Bloc<TimerEvent, TimerState> {
  final Ticker _ticker;
  final SessionRepository _sessionRepo;
  static const int _defaultDuration = 25 * 60;

  StreamSubscription<int>? _tickerSubscription;
  DateTime? _startTime;

  TimerBloc({required Ticker ticker, required SessionRepository sessionRepo})
    : _ticker = ticker,
      _sessionRepo = sessionRepo,
      super(const TimerInitial(_defaultDuration)) {
    on<TimerStarted>(_onStarted);
    on<_TimerTicked>(_onTicked);
    on<TimerPaused>(_onPaused);
    on<TimerResumed>(_onResumed);
    on<TimerReset>(_onReset);
  }

  @override
  Future<void> close() {
    _tickerSubscription?.cancel();
    return super.close();
  }

  void _onStarted(TimerStarted event, Emitter<TimerState> emit) {
    emit(TimerRunInProgress(event.duration));
    _startTime = DateTime.now();
    _tickerSubscription?.cancel();
    _tickerSubscription = _ticker
        .tick(ticks: event.duration)
        .listen((duration) => add(_TimerTicked(duration: duration)));
  }

  Future<void> _onTicked(_TimerTicked event, Emitter<TimerState> emit) async {
    emit(
      event.duration > 0
          ? TimerRunInProgress(event.duration)
          : const TimerRunComplete(),
    );

    if (event.duration == 0) {
      // Save Session
      final session = FocusSession(
        id: const Uuid().v4(),
        startTime: _startTime ?? DateTime.now(),
        endTime: DateTime.now(),
        durationSeconds: _defaultDuration, // Simplified
        status: SessionStatus.completed,
        sessionTag: "FOCUS",
      );
      await _sessionRepo.saveSession(session);
    }
  }

  void _onPaused(TimerPaused event, Emitter<TimerState> emit) {
    if (state is TimerRunInProgress) {
      _tickerSubscription?.pause();
      emit(TimerRunPause(state.duration));
    }
  }

  void _onResumed(TimerResumed event, Emitter<TimerState> emit) {
    if (state is TimerRunPause) {
      _tickerSubscription?.resume();
      emit(TimerRunInProgress(state.duration));
    }
  }

  void _onReset(TimerReset event, Emitter<TimerState> emit) {
    _tickerSubscription?.cancel();
    emit(const TimerInitial(_defaultDuration));
  }
}
