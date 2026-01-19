import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../core/utils/memorizer_algorithm.dart';
import '../blocs/memorizer/memorizer_bloc.dart';
import '../blocs/memorizer/memorizer_event.dart';
import '../blocs/memorizer/memorizer_state.dart';
import '../blocs/activity/activity_bloc.dart';
import '../blocs/activity/activity_event.dart';
import '../widgets/mini_timer_widget.dart';

class MemorizerScreen extends StatelessWidget {
  final Map<String, dynamic>? extra;
  const MemorizerScreen({super.key, this.extra});

  void _saveScrambleProgress(BuildContext context, MemorizerState state) {
    if (extra == null || extra!['activityId'] == null) return;
    final activityId = extra!['activityId'];
    final activityBloc = context.read<ActivityBloc>();

    try {
      final activity = activityBloc.state.activities.firstWhere(
        (a) => a.id == activityId,
      );

      final newMetadata = Map<String, dynamic>.from(activity.metadata ?? {});

      final serializedStates = <String, dynamic>{};
      state.savedStates.forEach((k, v) {
        serializedStates[k.toString()] = v;
      });

      newMetadata['scrambleProgress'] = {
        'currentIndex': state.currentScrambleIndex,
        'states': serializedStates,
        // Legacy support
        'userAnswer': state.userAnswer,
        'shuffledTokens': state.shuffledTokens,
      };

      activityBloc.add(
        UpdateActivity(activity.copyWith(metadata: newMetadata)),
      );
    } catch (e) {
      // Ignore
    }
  }

  void _showSentenceList(BuildContext context, MemorizerState state) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.grey[900],
      isScrollControlled: true,
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            return Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Select Sentence',
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge?.copyWith(color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  // Legend
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Wrap(
                      spacing: 12,
                      runSpacing: 8,
                      alignment: WrapAlignment.center,
                      children: [
                        _buildLegendItem(Colors.grey[700]!, 'Not Started'),
                        _buildLegendItem(Colors.blue[700]!, 'In Progress'),
                        _buildLegendItem(Colors.green[700]!, 'Correct'),
                        _buildLegendItem(Colors.red[700]!, 'Wrong'),
                      ],
                    ),
                  ),

                  Expanded(
                    child: GridView.builder(
                      controller: scrollController,
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 5,
                            crossAxisSpacing: 8,
                            mainAxisSpacing: 8,
                          ),
                      itemCount: state.scrambleSentences.length,
                      itemBuilder: (ctx, index) {
                        final isCurrent = index == state.currentScrambleIndex;

                        // Determine status color
                        Color bgColor = Colors.grey[800]!;
                        Color textColor = Colors.grey[300]!;

                        if (state.savedStates.containsKey(index)) {
                          final saved = state.savedStates[index]!;
                          final status = saved['status'] as String?;
                          final userAnswer = saved['userAnswer'] as List?;

                          if (status == 'correct') {
                            bgColor = Colors.green[700]!;
                            textColor = Colors.white;
                          } else if (status == 'wrong') {
                            bgColor = Colors.red[700]!;
                            textColor = Colors.white;
                          } else if (userAnswer != null &&
                              userAnswer.isNotEmpty) {
                            bgColor = Colors.blue[700]!; // In Progress
                            textColor = Colors.white;
                          } else if (status == 'playing' &&
                              userAnswer != null &&
                              userAnswer.isNotEmpty) {
                            bgColor = Colors.blue[700]!;
                          }
                        }

                        if (isCurrent) {
                          // Highlight current selection with a border or slightly brighter shade
                          // Usually Blue is standard selection, but if we use Blue for "In Progress",
                          // we need to distinguish "Current" cursor vs "Status".
                          // Let's use a thick white border for Current.
                        }

                        return InkWell(
                          onTap: () {
                            context.read<MemorizerBloc>().add(
                              JumpToScrambleSentence(index),
                            );
                            Navigator.pop(ctx);
                          },
                          child: Container(
                            decoration: BoxDecoration(
                              color: bgColor,
                              borderRadius: BorderRadius.circular(8),
                              border: isCurrent
                                  ? Border.all(color: Colors.white, width: 2)
                                  : null,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              '${index + 1}',
                              style: TextStyle(
                                color: textColor,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 12),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) {
        final bloc = MemorizerBloc();
        if (extra != null && extra!['content'] != null) {
          bloc.add(UpdateText(extra!['content']));
        }
        return bloc;
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Essay Memorizer'),
          actions: [
            const MiniTimerWidget(),
            // Save Content Button
            BlocBuilder<MemorizerBloc, MemorizerState>(
              builder: (context, memState) {
                if (memState.originalText.isNotEmpty &&
                    extra != null &&
                    extra!['activityId'] != null) {
                  return IconButton(
                    icon: const Icon(Icons.save),
                    tooltip: 'Save Content',
                    onPressed: () {
                      final activityId = extra!['activityId'];
                      final activityBloc = context.read<ActivityBloc>();
                      try {
                        final activity = activityBloc.state.activities
                            .firstWhere((a) => a.id == activityId);
                        final newMetadata = Map<String, dynamic>.from(
                          activity.metadata ?? {},
                        );
                        newMetadata['content'] = memState.originalText;
                        activityBloc.add(
                          UpdateActivity(
                            activity.copyWith(metadata: newMetadata),
                          ),
                        );
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Content saved!'),
                            duration: Duration(seconds: 1),
                          ),
                        );
                      } catch (e) {}
                    },
                  );
                }
                return const SizedBox.shrink();
              },
            ),
            BlocBuilder<MemorizerBloc, MemorizerState>(
              builder: (context, state) {
                if (state.mode == MemorizerMode.scramble) {
                  return IconButton(
                    icon: const Icon(Icons.list),
                    tooltip: 'Sentence List',
                    onPressed: () => _showSentenceList(context, state),
                  );
                }

                if (state.originalText.isNotEmpty) {
                  return PopupMenuButton<String>(
                    onSelected: (value) {
                      context.push(
                        '/learning/game',
                        extra: {'content': state.originalText, 'mode': value},
                      );
                    },
                    itemBuilder: (BuildContext context) {
                      return {'QUIZ', 'CLOZE'}.map((String choice) {
                        return PopupMenuItem<String>(
                          value: choice,
                          child: Text('Start $choice'),
                        );
                      }).toList();
                    },
                    icon: const Icon(Icons.school, color: Colors.white),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ],
        ),
        body: BlocListener<MemorizerBloc, MemorizerState>(
          listener: (context, state) {
            if (state.mode == MemorizerMode.scramble) {
              _saveScrambleProgress(context, state);
            }
          },
          listenWhen: (previous, current) {
            if (current.mode != MemorizerMode.scramble) return false;
            // Save whenever meaningful state changes (index, answer, or status)
            return previous.currentScrambleIndex !=
                    current.currentScrambleIndex ||
                previous.userAnswer != current.userAnswer ||
                previous.scrambleStatus != current.scrambleStatus;
          },
          child: Column(
            children: [
              // Controls
              BlocBuilder<MemorizerBloc, MemorizerState>(
                builder: (context, state) {
                  return Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: SegmentedButton<MemorizerMode>(
                      segments: const [
                        ButtonSegment(
                          value: MemorizerMode.read,
                          label: Text('Read'),
                        ),
                        ButtonSegment(
                          value: MemorizerMode.firstLetter,
                          label: Text('1st Letter'),
                        ),
                        ButtonSegment(
                          value: MemorizerMode.cloze,
                          label: Text('Cloze'),
                        ),
                        ButtonSegment(
                          value: MemorizerMode.scramble,
                          label: Text('Scramble'),
                        ),
                      ],
                      selected: {state.mode},
                      onSelectionChanged: (Set<MemorizerMode> newSelection) {
                        final mode = newSelection.first;

                        if (mode == MemorizerMode.scramble &&
                            extra != null &&
                            extra!['activityId'] != null) {
                          try {
                            final activityBloc = context.read<ActivityBloc>();
                            final activity = activityBloc.state.activities
                                .firstWhere(
                                  (a) => a.id == extra!['activityId'],
                                );

                            if (activity.metadata != null &&
                                activity.metadata!['scrambleProgress'] !=
                                    null) {
                              final prog =
                                  activity.metadata!['scrambleProgress'];
                              final idx = prog['currentIndex'] as int? ?? 0;

                              // Deserialize map
                              final Map<int, Map<String, dynamic>>
                              restoredHistory = {};
                              if (prog['states'] != null) {
                                final rawStates =
                                    prog['states'] as Map<String, dynamic>;
                                rawStates.forEach((k, v) {
                                  final intKey = int.tryParse(k);
                                  if (intKey != null) {
                                    restoredHistory[intKey] =
                                        Map<String, dynamic>.from(v);
                                  }
                                });
                              }

                              List<String> shuffled;
                              List<String> answer = [];

                              if (restoredHistory.containsKey(idx)) {
                                shuffled = List<String>.from(
                                  restoredHistory[idx]!['shuffledTokens'],
                                );
                                answer = List<String>.from(
                                  restoredHistory[idx]!['userAnswer'],
                                );
                              } else if (prog['shuffledTokens'] != null) {
                                shuffled = List<String>.from(
                                  prog['shuffledTokens'],
                                );
                                if (prog['userAnswer'] != null) {
                                  answer = List<String>.from(
                                    prog['userAnswer'],
                                  );
                                }
                              } else {
                                // Fallback
                                context.read<MemorizerBloc>().add(
                                  ChangeMode(MemorizerMode.scramble),
                                );
                                if (restoredHistory.isNotEmpty) {
                                  context.read<MemorizerBloc>().add(
                                    RestoreScrambleState(
                                      idx,
                                      [],
                                      [],
                                      fullHistory: restoredHistory,
                                    ),
                                  );
                                }
                                return;
                              }

                              context.read<MemorizerBloc>().add(
                                ChangeMode(MemorizerMode.scramble),
                              );
                              context.read<MemorizerBloc>().add(
                                RestoreScrambleState(
                                  idx,
                                  shuffled,
                                  answer,
                                  fullHistory: restoredHistory,
                                ),
                              );
                              return;
                            }
                          } catch (_) {}
                        }

                        context.read<MemorizerBloc>().add(ChangeMode(mode));
                      },
                    ),
                  );
                },
              ),

              Expanded(
                child: BlocBuilder<MemorizerBloc, MemorizerState>(
                  builder: (context, state) {
                    if (state.originalText.isEmpty) {
                      return Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: TextField(
                          maxLines: null,
                          decoration: const InputDecoration(
                            hintText: 'Paste your essay here...',
                            border: OutlineInputBorder(),
                          ),
                          onSubmitted: (text) {
                            if (text.isNotEmpty)
                              context.read<MemorizerBloc>().add(
                                UpdateText(text),
                              );
                          },
                        ),
                      );
                    }

                    if (state.mode == MemorizerMode.scramble) {
                      return Column(
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Sentence ${state.currentScrambleIndex + 1} / ${state.scrambleSentences.length}',
                                  style: Theme.of(
                                    context,
                                  ).textTheme.titleMedium,
                                ),
                                IconButton(
                                  icon: const Icon(Icons.refresh, size: 20),
                                  onPressed: () {
                                    context.read<MemorizerBloc>().add(
                                      ResetScrambleSentence(),
                                    );
                                  },
                                  tooltip: "Reset Sentence",
                                ),
                              ],
                            ),
                          ),

                          Expanded(
                            flex: 2,
                            child: Container(
                              width: double.infinity,
                              margin: const EdgeInsets.all(8.0),
                              decoration: BoxDecoration(
                                color: Colors.grey[900],
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.blueGrey),
                              ),
                              padding: const EdgeInsets.all(16.0),
                              child: Wrap(
                                spacing: 8.0,
                                runSpacing: 8.0,
                                children: state.userAnswer.map((token) {
                                  return ActionChip(
                                    label: Text(token),
                                    onPressed: () {
                                      context.read<MemorizerBloc>().add(
                                        DeselectScrambleToken(token),
                                      );
                                    },
                                    backgroundColor: Colors.blueAccent,
                                    labelStyle: const TextStyle(
                                      color: Colors.white,
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                          ),

                          if (state.scrambleStatus != ScrambleStatus.playing)
                            Padding(
                              padding: const EdgeInsets.all(8.0),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    state.scrambleStatus ==
                                            ScrambleStatus.correct
                                        ? 'Correct!'
                                        : 'Wrong, try again.',
                                    style: TextStyle(
                                      color:
                                          state.scrambleStatus ==
                                              ScrambleStatus.correct
                                          ? Colors.green
                                          : Colors.red,
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  if (state.scrambleStatus ==
                                      ScrambleStatus.correct)
                                    ElevatedButton(
                                      onPressed: () {
                                        context.read<MemorizerBloc>().add(
                                          NextScrambleSentence(),
                                        );
                                      },
                                      child: const Text('Next Sentence'),
                                    ),
                                ],
                              ),
                            )
                          else
                            ElevatedButton(
                              onPressed: () {
                                context.read<MemorizerBloc>().add(
                                  CheckScrambleAnswer(),
                                );
                              },
                              child: const Text('Check Answer'),
                            ),

                          const Divider(),

                          Expanded(
                            flex: 2,
                            child: Container(
                              padding: const EdgeInsets.all(16.0),
                              child: SingleChildScrollView(
                                child: Wrap(
                                  spacing: 8.0,
                                  runSpacing: 8.0,
                                  children: state.shuffledTokens.map((token) {
                                    return ActionChip(
                                      label: Text(token),
                                      onPressed: () {
                                        context.read<MemorizerBloc>().add(
                                          SelectScrambleToken(token),
                                        );
                                      },
                                    );
                                  }).toList(),
                                ),
                              ),
                            ),
                          ),
                        ],
                      );
                    }

                    return SingleChildScrollView(
                      padding: const EdgeInsets.all(16.0),
                      child: Wrap(
                        spacing: 4,
                        runSpacing: 8,
                        children: List.generate(state.tokens.length, (index) {
                          final token = state.tokens[index];
                          String displayText = token.text;
                          Color? textColor;
                          bool isHidden = !token.isVisible;

                          if (isHidden) {
                            if (state.mode == MemorizerMode.firstLetter) {
                              displayText = MemorizerAlgorithm.toFirstLetter(
                                token.text,
                              );
                              textColor = Colors.lightBlueAccent;
                            } else if (state.mode == MemorizerMode.cloze) {
                              displayText = '_' * token.text.length;
                              textColor = Colors.grey;
                            }
                          }

                          return GestureDetector(
                            onTap: () {
                              if (!token.isPunctuation) {
                                context.read<MemorizerBloc>().add(
                                  ToggleReveal(index),
                                );
                              }
                            },
                            child: Text(
                              displayText,
                              style: TextStyle(
                                fontSize: 18,
                                color: textColor ?? Colors.white,
                                fontWeight: isHidden
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                              ),
                            ),
                          );
                        }),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
