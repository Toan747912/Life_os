import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:study_os_app/domain/entities/flashcard.dart';
import 'package:study_os_app/presentation/blocs/flashcard_bloc.dart';

class FlashcardReviewScreen extends StatefulWidget {
  final List<Flashcard> dueCards;
  const FlashcardReviewScreen({super.key, required this.dueCards});

  @override
  State<FlashcardReviewScreen> createState() => _FlashcardReviewScreenState();
}

class _FlashcardReviewScreenState extends State<FlashcardReviewScreen> {
  int _currentIndex = 0;
  bool _isFlipped = false;

  @override
  Widget build(BuildContext context) {
    if (widget.dueCards.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text("Review Session")),
        body: const Center(child: Text("No cards due for review!")),
      );
    }

    if (_currentIndex >= widget.dueCards.length) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.check_circle, color: Colors.green, size: 64),
              const SizedBox(height: 16),
              const Text("Session Complete!", style: TextStyle(fontSize: 24)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Back to Home"),
              ),
            ],
          ),
        ),
      );
    }

    final currentCard = widget.dueCards[_currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: Text("Reviewing ${_currentIndex + 1}/${widget.dueCards.length}"),
      ),
      body: Column(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _isFlipped = !_isFlipped;
                });
              },
              child: Card(
                margin: const EdgeInsets.all(32),
                color: _isFlipped
                    ? const Color(0xFF2A2A2A)
                    : const Color(0xFF1E1E1E),
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Text(
                      _isFlipped
                          ? currentCard.backContent
                          : currentCard.frontContent,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
            ),
          ),
          if (_isFlipped)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _ratingButton(context, "Again", Colors.red, 0),
                  _ratingButton(context, "Hard", Colors.orange, 3),
                  _ratingButton(context, "Good", Colors.green, 4),
                  _ratingButton(context, "Easy", Colors.blue, 5),
                ],
              ),
            ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _ratingButton(
    BuildContext context,
    String label,
    Color color,
    int quality,
  ) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
      ),
      onPressed: () {
        context.read<FlashcardBloc>().add(
          ReviewFlashcard(widget.dueCards[_currentIndex], quality),
        );
        setState(() {
          _currentIndex++;
          _isFlipped = false;
        });
      },
      child: Text(label),
    );
  }
}
