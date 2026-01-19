export class QuizQuestion {
    questionText: string;
    correctAnswer: string;
    options: string[];

    constructor(questionText: string, correctAnswer: string, options: string[]) {
        this.questionText = questionText;
        this.correctAnswer = correctAnswer;
        this.options = options;
    }
}

export class QuizGenerator {
    generate(text: string): QuizQuestion[] {
        // 1. Split into "sentences" or meaningful chunks
        // Simplistic split by period.
        const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
        const questions: QuizQuestion[] = [];

        for (const sentence of sentences) {
            // 2. Pick a keyword to "blank out"
            const words = sentence.split(/\s+/);
            const candidates = words.filter(w => w.length > 4); // Filter short words

            if (candidates.length === 0) continue;

            const targetWord = candidates[Math.floor(Math.random() * candidates.length)];

            // 3. Create question text
            const questionText = sentence.replace(targetWord, "_____");

            // 4. Generate options
            const options = this._generateDistractors(targetWord, candidates);

            questions.push(new QuizQuestion(questionText, targetWord, options));
        }

        return questions;
    }

    private _generateDistractors(correct: string, contextWords: string[]): string[] {
        const options = new Set<string>();
        options.add(correct);

        // Try to pick other words from the same context as distractors
        const pool = contextWords.filter(w => w !== correct);

        while (options.size < 4 && pool.length > 0) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            options.add(pool[randomIndex]);
            pool.splice(randomIndex, 1);
        }

        // If we still need options, filler words (not ideal but works for prototype)
        const fillers = ["something", "anything", "nothing", "everything"];
        let fillerIdx = 0;
        while (options.size < 4) {
            options.add(fillers[fillerIdx++] || "N/A");
        }

        return Array.from(options).sort(() => Math.random() - 0.5);
    }
}
