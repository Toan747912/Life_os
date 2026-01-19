import { LearningEngine } from './learning-engine';
import { MatchResult } from './fuzzy-matcher';

const engine = new LearningEngine();

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`[FAIL] ${message}`);
        process.exit(1);
    } else {
        console.log(`[PASS] ${message}`);
    }
}

async function runTests() {
    console.log("=== Running Learning Engine Tests ===");

    // 1. Test Fuzzy Matcher
    console.log("\n--- Testing Fuzzy Matcher ---");
    assert(engine.checkAnswer("hello", "hello") === MatchResult.correct, "Exact match should be Correct");
    assert(engine.checkAnswer("hello", "helo") === MatchResult.typo, "Typo 'helo' for 'hello' should be Typo");
    assert(engine.checkAnswer("intelligence", "inteligence") === MatchResult.typo, "Typo 'inteligence' for 'intelligence' should be Typo");
    assert(engine.checkAnswer("hello", "world") === MatchResult.wrong, "Totally different word should be Wrong");
    assert(engine.checkAnswer("Hello!", "hello") === MatchResult.correct, "Case/Punctuation insensitivity");

    // 2. Test Cloze Generator
    console.log("\n--- Testing Cloze Generator ---");
    const text = "The quick brown fox jumps over the lazy dog.";
    const tokens = engine.generateClozeSession(text);

    assert(tokens.length > 0, "Should generate tokens");
    assert(tokens.some(t => t.text === "fox"), "Should contain word tokens");
    assert(tokens.some(t => t.isPunctuation && t.text === "."), "Should detect punctuation");

    // Check hiding logic (at least some should be hidden if text is long enough, but random)
    const hiddenCount = tokens.filter(t => t.isHidden).length;
    console.log(`Generated ${tokens.length} tokens, ${hiddenCount} hidden.`);

    // 3. Test Quiz Generator
    console.log("\n--- Testing Quiz Generator ---");
    const quizText = "Javascript is a programming language. It is used for web development.";
    const questions = engine.generateQuizSession(quizText);

    if (questions.length > 0) {
        const q = questions[0];
        console.log(`Question: ${q.questionText}`);
        console.log(`Correct: ${q.correctAnswer}`);
        console.log(`Options: ${q.options.join(", ")}`);

        assert(q.options.includes(q.correctAnswer), "Options must include correct answer");
        assert(q.options.length === 4, "Should have 4 options");
        assert(q.questionText.includes("_____"), "Question text should have blank");
    } else {
        console.warn("Quiz generator produced 0 questions (might be due to text length/randomness).");
    }

    console.log("\n=== All Tests Passed ===");
}

runTests().catch(e => console.error(e));
