export class ClozeToken {
    text: string;
    isHidden: boolean;
    isPunctuation: boolean;

    constructor(text: string, isHidden: boolean, isPunctuation: boolean) {
        this.text = text;
        this.isHidden = isHidden;
        this.isPunctuation = isPunctuation;
    }
}

export class ClozeGenerator {
    // Common stop words to avoid hiding
    private _stopWords: Set<string> = new Set([
        "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
        "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
        "this", "but", "his", "by", "from", "they", "we", "say", "her",
        "she", "or", "an", "will", "my", "one", "all", "would", "there",
        "their", "what", "so", "up", "out", "if", "about", "who", "get",
        "which", "go", "me"
    ]);

    generate(text: string): ClozeToken[] {
        const tokens: ClozeToken[] = [];
        const regex = /([\w']+)|([^\w\s]+)|(\s+)/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const word = match[1];
            const punctuation = match[2];
            const whitespace = match[3];

            if (whitespace) {
                // Just append whitespace as visible text if needed, 
                // OR better: treating whitespace as separate from tokens might complicate UI layout.
                // Let's attach whitespace to previous token or treat as separate Non-hiddable token.
                // For simplicity, we ignore whitespace in "Token" logic and rely on UI to gap, 
                // BUT for a "Fill in the blank" paragraph, we need the spaces.
                // Let's make a whitespace token that is never hidden.
                tokens.push(new ClozeToken(whitespace, false, true));
            } else if (punctuation) {
                tokens.push(new ClozeToken(punctuation, false, true));
            } else if (word) {
                const shouldHide = this._shouldHide(word);
                tokens.push(new ClozeToken(word, shouldHide, false));
            }
        }

        return tokens;
    }

    private _shouldHide(word: string): boolean {
        if (this._stopWords.has(word.toLowerCase())) return false;
        // Hide roughly 40% of content words
        return Math.random() < 0.4;
    }
}
