import 'dart:math';

class ClozeToken {
  final String text;
  final bool isHidden;
  final List<String>? hints;

  ClozeToken({required this.text, required this.isHidden, this.hints});
}

class ClozeGenerator {
  // Common English stop words to avoid masking (unless we want a 'Grammar Mode')
  static final Set<String> stopWords = {
    'a',
    'an',
    'the',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'and',
    'but',
    'or',
    'so',
    'because',
    'as',
    'if',
    'this',
    'that',
    'these',
    'those',
    'i',
    'you',
    'he',
    'she',
    'it',
    'we',
    'they',
    'my',
    'your',
    'his',
    'her',
    'its',
    'their',
  };

  /// Generates a list of tokens with some words hidden based on [difficulty] (0.0 to 1.0).
  /// [difficulty] 0.1 means ~10% of valid words are hidden.
  List<ClozeToken> generateCloze(String text, {double difficulty = 0.2}) {
    // Split by words, keeping delimiters (punctuation/spaces) if possible or handling them.
    // Simpler approach for "Smart" cloze:
    // 1. Identify "Maskable" words (not stop words, length > 2).
    // 2. Randomly select valid indices.

    final List<ClozeToken> tokens = [];
    final RegExp wordWithPunctuation = RegExp(r"([\w']+)|([^\w\s]+)|(\s+)");

    final matches = wordWithPunctuation.allMatches(text);
    final random = Random();

    for (final match in matches) {
      final String tokenText = match.group(0)!;

      // Check if it is a word (alphanumeric)
      final bool isWord = RegExp(r"^[\w']+$").hasMatch(tokenText);

      bool shouldHide = false;
      if (isWord) {
        final lowerText = tokenText.toLowerCase();
        // Skip stop words and very short words
        if (!stopWords.contains(lowerText) && tokenText.length > 2) {
          // Basic random chance based on difficulty
          // Enhancements: Boost chance for Capitalized words (Proper Nouns)
          double chance = difficulty;
          if (tokenText[0] == tokenText[0].toUpperCase() &&
              tokenText != lowerText) {
            chance += 0.2; // Increase chance for Proper Nouns
          }

          if (random.nextDouble() < chance) {
            shouldHide = true;
          }
        }
      }

      tokens.add(
        ClozeToken(
          text: tokenText,
          isHidden: shouldHide,
          hints: shouldHide ? _generateHints(tokenText) : null,
        ),
      );
    }

    return tokens;
  }

  List<String> _generateHints(String word) {
    // Hint strategy 1: First letter
    if (word.isNotEmpty) {
      return ["Starts with ${word[0]}..."];
    }
    return [];
  }
}
