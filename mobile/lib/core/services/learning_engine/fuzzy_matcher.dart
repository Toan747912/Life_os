import 'dart:math';

enum MatchResult { correct, typo, wrong }

class FuzzyMatcher {
  /// Checks the user input against the target word.
  /// Returns [MatchResult.correct] if exact match (case insensitive).
  /// Returns [MatchResult.typo] if Levenshtein distance is small.
  /// Returns [MatchResult.wrong] otherwise.
  static MatchResult check(String target, String input) {
    final t = target.trim().toLowerCase();
    final i = input.trim().toLowerCase();

    if (t == i) return MatchResult.correct;

    final distance = levenshtein(t, i);

    // Logic for "Typo":
    // If word is short (<= 3 chars), must be exact.
    // If word is medium (4-5 chars), allow 1 error.
    // If word is long (> 5 chars), allow 2 errors.

    if (t.length <= 3) return MatchResult.wrong;

    int allowedErrors = (t.length > 5) ? 2 : 1;

    if (distance <= allowedErrors) {
      return MatchResult.typo;
    }

    return MatchResult.wrong;
  }

  static int levenshtein(String a, String b) {
    // Standard Levenshtein implementation
    if (a == b) return 0;
    if (a.isEmpty) return b.length;
    if (b.isEmpty) return a.length;

    List<int> previousRow = List<int>.generate(b.length + 1, (i) => i);
    List<int> currentRow = List<int>.filled(b.length + 1, 0);

    for (int i = 0; i < a.length; i++) {
      currentRow[0] = i + 1;
      for (int j = 0; j < b.length; j++) {
        int cost = (a[i] == b[j]) ? 0 : 1;
        currentRow[j + 1] = min(
          currentRow[j] + 1, // Insertion
          min(
            previousRow[j + 1] + 1, // Deletion
            previousRow[j] + cost, // Substitution
          ),
        );
      }
      // Swap rows
      final temp = previousRow;
      previousRow = currentRow;
      currentRow = temp;
    }

    return previousRow[b.length];
  }
}
