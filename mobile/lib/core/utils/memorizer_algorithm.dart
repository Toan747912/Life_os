import 'dart:math';

class MemorizerAlgorithm {
  static final _wordRegex = RegExp(r"([\w']+)|([^\w\s]+)", multiLine: true);

  /// Converts text to First-Letter mode.
  /// Preserves punctuation and structure.
  /// Example: "Hello, World!" -> "H, W!"
  static String toFirstLetter(String text) {
    if (text.isEmpty) return '';

    return text.splitMapJoin(
      _wordRegex,
      onMatch: (m) {
        final word = m.group(1);
        final punctuation = m.group(2);

        if (word != null) {
          // It's a word, keep first letter
          if (word.isEmpty) return '';
          return word.substring(0, 1);
        } else if (punctuation != null) {
          // It's punctuation, keep as is
          return punctuation;
        }
        return '';
      },
      onNonMatch: (n) => n, // Keep whitespace/newlines
    );
  }

  /// Converts text to Cloze mode.
  /// [difficulty] is between 0.0 (no blanks) and 1.0 (all blanks).
  /// Returns a list of tokens where some are marked as hidden.
  /// Note: This returns a processed structure, but for raw string representation
  /// usually we might use underscores. Here we return valid text but let UI handle hiding?
  /// Or we return text with underscores?
  /// The requirement usually implies generating a view.
  /// Let's return the text with hidden words replaced by underscores matching length.
  /// Example: "Hello World" -> "_____ World"
  static String toCloze(String text, double difficulty) {
    if (text.isEmpty) return '';
    final random = Random();

    return text.splitMapJoin(
      _wordRegex,
      onMatch: (m) {
        final word = m.group(1);
        final punctuation = m.group(2);

        if (word != null) {
          // It's a word
          if (random.nextDouble() < difficulty) {
            // Hide it
            return '_' * word.length;
          }
          return word;
        } else {
          return punctuation ?? '';
        }
      },
      onNonMatch: (n) => n,
    );
  }
}
