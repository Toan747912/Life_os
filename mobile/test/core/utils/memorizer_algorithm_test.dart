import 'package:flutter_test/flutter_test.dart';
import 'package:study_os_app/core/utils/memorizer_algorithm.dart';

void main() {
  group('MemorizerAlgorithm', () {
    test('toFirstLetter handles basic sentence', () {
      const input = "The quick brown fox.";
      const expected = "T q b f.";
      expect(MemorizerAlgorithm.toFirstLetter(input), expected);
    });

    test('toFirstLetter handles complex punctuation', () {
      const input = "Hello, world! It's a-me.";
      // It's -> I (apostrophe is part of word chars in regex \w Usually not, wait. \w doesn't include '.
      // My regex was ([\w']+) so "It's" is matched as one word?
      // Let's verify standard regex behavior. \w usually [a-zA-Z0-9_]. ' is not included.
      // So "It's" might be split.
      // Let's adjust expectation based on implementation or refine regex.
      // If regex is ([\w']+), "It's" is one word. First letter "I". punctuation "." remains.
      const expected = "H, w! I a-m.";
      expect(MemorizerAlgorithm.toFirstLetter(input), expected);
    });

    test('toFirstLetter handles newlines', () {
      const input = "Line one.\nLine two.";
      const expected = "L o.\nL t.";
      expect(MemorizerAlgorithm.toFirstLetter(input), expected);
    });

    test('toCloze hides words based on difficulty', () {
      const input = "one two three four five";
      // Difficulty 1.0 -> All hidden
      final allHidden = MemorizerAlgorithm.toCloze(input, 1.0);
      expect(allHidden, "___ ___ _____ ____ ____");

      // Difficulty 0.0 -> None hidden
      final noneHidden = MemorizerAlgorithm.toCloze(input, 0.0);
      expect(noneHidden, input);
    });
  });
}
