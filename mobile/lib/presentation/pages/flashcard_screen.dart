import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:study_os_app/domain/entities/flashcard.dart';
import 'package:study_os_app/presentation/blocs/flashcard_bloc.dart';
import 'package:study_os_app/presentation/pages/flashcard_review_screen.dart';
import 'package:uuid/uuid.dart';

class FlashcardScreen extends StatelessWidget {
  const FlashcardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Flashcards')),
      body: BlocBuilder<FlashcardBloc, FlashcardState>(
        builder: (context, state) {
          if (state is FlashcardLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is FlashcardLoaded) {
            final dueCount = state.dueFlashcards.length;

            return Column(
              children: [
                // Dashboard
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Card(
                    color: Colors.blue.withValues(alpha: 0.2),
                    child: ListTile(
                      title: const Text(
                        "Ready to Review",
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text("$dueCount cards waiting"),
                      trailing: ElevatedButton(
                        onPressed: dueCount > 0
                            ? () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => FlashcardReviewScreen(
                                      dueCards: state.dueFlashcards,
                                    ),
                                  ),
                                );
                              }
                            : null,
                        child: const Text("Start"),
                      ),
                    ),
                  ),
                ),
                const Divider(),
                // All Cards List
                Expanded(
                  child: ListView.builder(
                    itemCount: state.allFlashcards.length,
                    itemBuilder: (context, index) {
                      final card = state.allFlashcards[index];
                      return ListTile(
                        title: Text(card.frontContent),
                        subtitle: Text(
                          "Next: ${card.nextReviewDate.toString().split(' ')[0]}",
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.grey),
                          onPressed: () {
                            context.read<FlashcardBloc>().add(
                              DeleteFlashcard(card.id),
                            );
                          },
                        ),
                      );
                    },
                  ),
                ),
              ],
            );
          } else if (state is FlashcardError) {
            return Center(child: Text('Error: ${state.message}'));
          }
          return Container();
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddCardDialog(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showAddCardDialog(BuildContext context) {
    final frontController = TextEditingController();
    final backController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("New Flashcard"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: frontController,
              decoration: const InputDecoration(labelText: "Front (Question)"),
              autofocus: true,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: backController,
              decoration: const InputDecoration(labelText: "Back (Answer)"),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () {
              if (frontController.text.isNotEmpty &&
                  backController.text.isNotEmpty) {
                final newCard = Flashcard(
                  id: const Uuid().v4(),
                  frontContent: frontController.text,
                  backContent: backController.text,
                  nextReviewDate: DateTime.now(), // Due immediately
                  createdAt: DateTime.now(),
                );
                context.read<FlashcardBloc>().add(AddFlashcard(newCard));
                Navigator.pop(ctx);
              }
            },
            child: const Text("Add"),
          ),
        ],
      ),
    );
  }
}
