export const MemorizerAlgorithm = {
    toFirstLetter: (text: string): string => {
        if (!text) return "";
        // Regex matches words (alphanumeric+apostrophe) OR non-whitespace non-word chars (punctuation)
        // Note: JS regex \w includes [a-zA-Z0-9_]. Apostrophe is not in \w.
        // We want to match "word" or "punctuation".
        // Dart regex was: ([\w']+) | ([^\w\s]+)

        return text.replace(/([\w']+)|([^\w\s]+)/g, (match, word, punctuation) => {
            if (word) {
                return word.charAt(0);
            }
            return punctuation || match;
        });
    },

    /**
     * Returns text where some words are replaced by underscores.
     * Note: For interactive UI, we probably want to split into tokens first, 
     * but this function mimics the Dart one returning a string. 
     * For the Web UI, I'll likely implement tokenization in the Component itself 
     * to allow "click to reveal", similar to the Flutter implementation.
     * 
     * This function returns the "static string" version.
     */
    toCloze: (text: string, difficulty: number): string => {
        if (!text) return "";

        return text.replace(/([\w']+)|([^\w\s]+)/g, (match, word, punctuation) => {
            if (word) {
                if (Math.random() < difficulty) {
                    return "_".repeat(word.length);
                }
                return word;
            }
            return punctuation || match;
        });
    }
};
