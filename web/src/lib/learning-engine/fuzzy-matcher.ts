export enum MatchResult {
    correct,
    typo,
    wrong,
}

export class FuzzyMatcher {
    checkAnswer(target: string, input: string): MatchResult {
        const cleanTarget = this._normalize(target);
        const cleanInput = this._normalize(input);

        if (cleanTarget === cleanInput) {
            return MatchResult.correct;
        }

        const distance = this._levenshtein(cleanTarget, cleanInput);

        // Tolerance: 
        // Length <= 3: 0 tolerance
        // Length <= 6: 1 tolerance
        // Length > 6: 2 tolerance
        let tolerance = 0;
        if (cleanTarget.length > 6) {
            tolerance = 2;
        } else if (cleanTarget.length > 3) {
            tolerance = 1;
        }

        if (distance <= tolerance) {
            return MatchResult.typo;
        }

        return MatchResult.wrong;
    }

    private _normalize(text: string): string {
        return text.trim().toLowerCase().replace(/[^\w\s]/g, '');
    }

    private _levenshtein(a: string, b: string): number {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix: number[][] = [];

        // Increment along the first column of each row
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        // Increment each column in the first row
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1  // deletion
                        )
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }
}
