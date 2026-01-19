"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { learningEngine } from '@/lib/learning-engine/learning-engine';
import { MatchResult } from '@/lib/learning-engine/fuzzy-matcher';
import { QuizQuestion } from '@/lib/learning-engine/quiz-generator';
import { ClozeToken } from '@/lib/learning-engine/cloze-generator';

// Separate component to use useSearchParams
function GameContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const content = searchParams.get('content') || '';
    const mode = searchParams.get('mode') || 'QUIZ';

    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState<{
        show: boolean;
        isCorrect: boolean;
        correctAnswer?: string;
    } | null>(null);

    useEffect(() => {
        if (!content) return;

        // Simulate async gen
        setTimeout(() => {
            let q: any[] = [];
            if (mode === 'QUIZ') {
                q = learningEngine.generateQuizSession(content);
            } else {
                const tokens = learningEngine.generateClozeSession(content);
                // For simplicity in web Cloze, let's treat HIDDEN tokens as "questions" in a sequence for now
                // Or we could render the whole paragraph.
                // Let's stick to "One token at a time" for consistency with the Game Loop logic I planned,
                // which matches the Mobile "Basic Game Loop" structure simplified.
                // Actually, Mobile implementation for Cloze was "Fill in the blank" text field. 
                // Let's filter hidden tokens.
                q = tokens.filter(t => t.isHidden);
            }
            setQuestions(q);
            setLoading(false);
        }, 100);
    }, [content, mode]);

    const handleSubmit = (answer: string) => {
        const currentQ = questions[currentIndex];
        let isCorrect = false;
        let correctTxt = "";

        if (mode === 'QUIZ') {
            const q = currentQ as QuizQuestion;
            isCorrect = answer === q.correctAnswer;
            correctTxt = q.correctAnswer;
        } else {
            const t = currentQ as ClozeToken;
            const result = learningEngine.checkAnswer(t.text, answer);
            isCorrect = result === MatchResult.correct || result === MatchResult.typo;
            correctTxt = t.text;
        }

        if (isCorrect) setScore(s => s + 1);

        setFeedback({
            show: true,
            isCorrect,
            correctAnswer: correctTxt
        });
    };

    const handleNext = () => {
        setFeedback(null);
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(c => c + 1);
        } else {
            // Finish
            router.push(`/learning/result?score=${score}&total=${questions.length}`);
        }
    };

    if (loading) return <div className="p-10 text-center">Generating Session...</div>;
    if (questions.length === 0) return <div className="p-10 text-center">Could not generate questions from text. Try longer text.</div>;

    const currentQ = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-slate-800">{mode} Mode</h1>
                <span className="text-slate-500 font-mono">{currentIndex + 1} / {questions.length}</span>
            </div>

            {/* Progress */}
            <div className="w-full bg-slate-200 h-2 rounded-full mb-10 overflow-hidden">
                <div
                    className="bg-indigo-600 h-2 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Game Area */}
            {!feedback?.show ? (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[300px] flex flex-col justify-center">
                    {mode === 'QUIZ' ? (
                        <QuizView question={currentQ} onSubmit={handleSubmit} />
                    ) : (
                        <ClozeView token={currentQ} onSubmit={handleSubmit} />
                    )}
                </div>
            ) : (
                <FeedbackView
                    isCorrect={feedback.isCorrect}
                    correctAnswer={feedback.correctAnswer}
                    onNext={handleNext}
                />
            )}
        </div>
    );
}

function QuizView({ question, onSubmit }: { question: QuizQuestion, onSubmit: (ans: string) => void }) {
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-serif text-center text-slate-800 leading-relaxed">
                {question.questionText}
            </h2>
            <div className="grid gap-3">
                {question.options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => onSubmit(opt)}
                        className="w-full p-4 text-lg font-medium text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-transparent rounded-xl transition-all text-left"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

function ClozeView({ token, onSubmit }: { token: ClozeToken, onSubmit: (ans: string) => void }) {
    const [input, setInput] = useState('');

    return (
        <div className="space-y-8 text-center">
            <div className="space-y-2">
                <p className="text-slate-400 uppercase tracking-wider text-sm font-bold">Word to guess</p>
                <h2 className="text-4xl font-mono text-slate-800 tracking-widest">
                    {token.text.replace(/./g, '_')}
                </h2>
            </div>

            <form
                onSubmit={(e) => { e.preventDefault(); onSubmit(input); }}
                className="flex flex-col items-center gap-4"
            >
                <input
                    autoFocus
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full max-w-md p-4 text-center text-xl border-b-2 border-slate-300 focus:border-indigo-600 outline-none transition-colors bg-transparent placeholder-slate-300"
                    placeholder="Type the word..."
                />
                <button
                    type="submit"
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                >
                    Check Answer
                </button>
            </form>
        </div>
    );
}

function FeedbackView({ isCorrect, correctAnswer, onNext }: { isCorrect: boolean, correctAnswer?: string, onNext: () => void }) {
    // Add auto-focus to next button or handle Enter key for better UX
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') onNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNext]);

    return (
        <div className={`p-8 rounded-2xl shadow-sm border min-h-[300px] flex flex-col justify-center items-center text-center animate-in fade-in zoom-in duration-300 ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <div className={`text-6xl mb-4 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {isCorrect ? '✓' : '✕'}
            </div>
            <h2 className={`text-3xl font-bold mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
            </h2>
            {!isCorrect && (
                <p className="text-lg text-slate-600 mt-2">
                    Answer: <span className="font-bold">{correctAnswer}</span>
                </p>
            )}
            <button
                onClick={onNext}
                className={`mt-8 px-8 py-3 rounded-lg font-bold text-white transition-transform active:scale-95 ${isCorrect ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
                Next Question ↵
            </button>
        </div>
    );
}

export default function GamePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GameContent />
        </Suspense>
    );
}
