import { ClozeGenerator, ClozeToken } from './cloze-generator';
import { QuizGenerator, QuizQuestion } from './quiz-generator';
import { FuzzyMatcher, MatchResult } from './fuzzy-matcher';

export class LearningEngine {
    private _clozeParams = new ClozeGenerator();
    private _quizParams = new QuizGenerator();
    private _matcher = new FuzzyMatcher();

    generateClozeSession(text: string): ClozeToken[] {
        return this._clozeParams.generate(text);
    }

    generateQuizSession(text: string): QuizQuestion[] {
        return this._quizParams.generate(text);
    }

    checkAnswer(target: string, input: string): MatchResult {
        return this._matcher.checkAnswer(target, input);
    }
}

export const learningEngine = new LearningEngine();
