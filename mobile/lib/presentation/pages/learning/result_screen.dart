import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ResultScreen extends StatelessWidget {
  final int score;
  final int total;

  const ResultScreen({super.key, required this.score, required this.total});

  @override
  Widget build(BuildContext context) {
    final percentage = (score / total) * 100;

    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              "Session Complete!",
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 32),
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 200,
                  height: 200,
                  child: CircularProgressIndicator(
                    value: score / total,
                    strokeWidth: 20,
                    backgroundColor: Colors.grey[300],
                    color: percentage >= 80
                        ? Colors.green
                        : (percentage >= 50 ? Colors.orange : Colors.red),
                  ),
                ),
                Column(
                  children: [
                    Text(
                      "$score / $total",
                      style: const TextStyle(
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      "${percentage.toStringAsFixed(0)}%",
                      style: const TextStyle(fontSize: 20, color: Colors.grey),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 48),
            ElevatedButton(
              onPressed: () {
                context.go('/'); // Back to Home
              },
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 48,
                  vertical: 16,
                ),
              ),
              child: const Text("Finish Review"),
            ),
          ],
        ),
      ),
    );
  }
}
