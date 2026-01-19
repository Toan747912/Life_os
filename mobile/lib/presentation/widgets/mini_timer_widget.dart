import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../blocs/timer_bloc.dart';

class MiniTimerWidget extends StatelessWidget {
  const MiniTimerWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TimerBloc, TimerState>(
      builder: (context, state) {
        if (state is TimerInitial) {
          return const SizedBox.shrink();
        }

        final duration = state.duration;
        final minutesStr = ((duration / 60) % 60).floor().toString().padLeft(
          2,
          '0',
        );
        final secondsStr = (duration % 60).floor().toString().padLeft(2, '0');

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          margin: const EdgeInsets.only(right: 8),
          decoration: BoxDecoration(
            color: Colors.redAccent.withValues(
              alpha: 0.2,
            ), // Using withValues as per previous context
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.redAccent.withValues(alpha: 0.5)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.timer, size: 16, color: Colors.redAccent),
              const SizedBox(width: 6),
              Text(
                '$minutesStr:$secondsStr',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
