import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:study_os_app/presentation/blocs/timer_bloc.dart';

class FocusScreen extends StatelessWidget {
  const FocusScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Focus Timer')),
      body: Stack(
        children: [
          const Background(),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 100.0),
                child: Center(child: TimerText()),
              ),
              BlocBuilder<TimerBloc, TimerState>(
                builder: (context, state) {
                  return Actions(state: state);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class TimerText extends StatelessWidget {
  const TimerText({super.key});
  @override
  Widget build(BuildContext context) {
    final duration = context.select((TimerBloc bloc) => bloc.state.duration);
    final minutesStr = ((duration / 60) % 60).floor().toString().padLeft(
      2,
      '0',
    );
    final secondsStr = (duration % 60).floor().toString().padLeft(2, '0');

    // Calculate progress (assuming 25 min default for visualization or get max from state if available)
    // For now, simple visual.
    // In a real app, TimerState should hold 'totalDuration' to calculate percentage.
    // Let's assume 25 mins (1500s) for progress 1.0 -> 0.0
    final progress = duration / (25 * 60);

    return Stack(
      alignment: Alignment.center,
      children: [
        SizedBox(
          width: 300,
          height: 300,
          child: CircularProgressIndicator(
            value: progress,
            strokeWidth: 20,
            backgroundColor: Colors.white24,
            valueColor: AlwaysStoppedAnimation<Color>(
              progress < 0.2 ? Colors.red : Colors.blueAccent,
            ),
          ),
        ),
        Text(
          '$minutesStr:$secondsStr',
          style: Theme.of(context).textTheme.displayLarge?.copyWith(
            fontSize: 60,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            fontFeatures: [const FontFeature.tabularFigures()],
          ),
        ),
      ],
    );
  }
}

class Actions extends StatelessWidget {
  final TimerState state;
  const Actions({super.key, required this.state});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        if (state is TimerInitial) ...[
          FloatingActionButton(
            child: const Icon(Icons.play_arrow),
            onPressed: () => context.read<TimerBloc>().add(
              TimerStarted(duration: state.duration),
            ),
          ),
        ],
        if (state is TimerRunInProgress) ...[
          FloatingActionButton(
            child: const Icon(Icons.pause),
            onPressed: () => context.read<TimerBloc>().add(TimerPaused()),
          ),
          FloatingActionButton(
            child: const Icon(Icons.replay),
            onPressed: () => context.read<TimerBloc>().add(TimerReset()),
          ),
        ],
        if (state is TimerRunPause) ...[
          FloatingActionButton(
            child: const Icon(Icons.play_arrow),
            onPressed: () => context.read<TimerBloc>().add(TimerResumed()),
          ),
          FloatingActionButton(
            child: const Icon(Icons.replay),
            onPressed: () => context.read<TimerBloc>().add(TimerReset()),
          ),
        ],
        if (state is TimerRunComplete) ...[
          FloatingActionButton(
            child: const Icon(Icons.replay),
            onPressed: () => context.read<TimerBloc>().add(TimerReset()),
          ),
        ],
      ],
    );
  }
}

class Background extends StatelessWidget {
  const Background({super.key});
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.blue.shade900.withValues(alpha: 0.8), Colors.black],
        ),
      ),
    );
  }
}
