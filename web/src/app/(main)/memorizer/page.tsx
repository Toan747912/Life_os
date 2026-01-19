"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from "@tanstack/react-query";
import { activityService } from "@/services/activity.service";
import { reviewSessionService } from "@/services/review-session.service";
import { learningEngine } from "@/lib/learning-engine/learning-engine";
import { QuizQuestion } from "@/lib/learning-engine/quiz-generator";
import { UpdateActivityDto } from "@/types/activity";

type Mode = "READ" | "FIRST_LETTER" | "CLOZE" | "QUIZ" | "SCRAMBLE";

interface ScrambleState {
    sentences: string[];
    currentIndex: number;
    shuffledTokens: string[];
    userAnswer: string[];
    status: 'playing' | 'correct' | 'wrong';
}

interface Token {
    text: string;
    isPunctuation: boolean;
    isVisible: boolean;
    index: number;
}

export default function MemorizerPage() {
    const searchParams = useSearchParams();
    const activityId = searchParams.get('id');

    const [text, setText] = useState("");
    const [tokens, setTokens] = useState<Token[]>([]);
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [mode, setMode] = useState<Mode>("READ");
    const [showEditor, setShowEditor] = useState(true);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
    const [quizScore, setQuizScore] = useState(0);

    // Scramble Enhancements
    const [savedScrambleState, setSavedScrambleState] = useState<{
        currentIndex: number;
        states: Record<number, { userAnswer: string[]; shuffledTokens: string[]; status?: 'playing' | 'correct' | 'wrong' }>;
    } | null>(null);
    const [showScrambleList, setShowScrambleList] = useState(false);

    // Scramble State
    const [scrambleState, setScrambleState] = useState<ScrambleState>({
        sentences: [],
        currentIndex: 0,
        shuffledTokens: [],
        userAnswer: [],
        status: 'playing'
    });

    const { data: activities } = useQuery({
        queryKey: ["activities"],
        queryFn: activityService.getAll,
        enabled: !!activityId,
    });

    const processText = (input: string) => {
        // Tokenize for "Text Modes"
        const newTokens: Token[] = [];
        let i = 0;
        // Split keeping delimiters
        const parts = input.split(/([\w']+|[^\w\s]+|\s+)/).filter(Boolean);

        parts.forEach((part) => {
            const isWord = /^[\w']+$/.test(part);
            newTokens.push({
                text: part,
                isPunctuation: !isWord,
                isVisible: true,
                index: i++,
            });
        });
        setTokens(newTokens);

        // Generate Quiz questions
        const questions = learningEngine.generateQuizSession(input);
        setQuizQuestions(questions);

        setShowEditor(false);
        setMode("READ");
        setStartTime(Date.now());
    };

    useEffect(() => {
        if (activityId && activities) {
            const activity = activities.find(a => a.id === activityId);
            if (activity) {
                const content = activity.metadata?.notes || activity.title || "";
                setText(content);

                // Load saved scramble progress
                if (activity.metadata?.scrambleProgress) {
                    setSavedScrambleState(activity.metadata.scrambleProgress);
                }

                if (content) {
                    processText(content);
                }
            }
        }
    }, [activityId, activities]);

    const submitSessionMutation = useMutation({
        mutationFn: reviewSessionService.create,
        onSuccess: () => {
            alert("Session result saved!");
        },
        onError: (err) => {
            console.error("Failed to save session", err);
            alert("Failed to save session results.");
        }
    });

    const updateActivityMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateActivityDto }) => activityService.update(id, data),
        onSuccess: () => {
            // alert("Content saved successfully!"); 
        },
        onError: () => {
            // alert("Failed to save content.");
        }
    });

    const saveScrambleProgress = (state: ScrambleState) => {
        if (!activityId) return;

        try {
            const currentActivity = activities?.find(a => a.id === activityId);
            const meta = currentActivity?.metadata || {};

            // Get existing known states or init fresh
            const existingStates = savedScrambleState?.states || {};
            const newStates = {
                ...existingStates,
                [state.currentIndex]: {
                    userAnswer: state.userAnswer,
                    shuffledTokens: state.shuffledTokens,
                    status: state.status
                }
            };

            // Update local state too so we don't lose it on rapid switches
            setSavedScrambleState({
                currentIndex: state.currentIndex,
                states: newStates
            });

            updateActivityMutation.mutate({
                id: activityId,
                data: {
                    metadata: {
                        ...meta,
                        scrambleProgress: {
                            currentIndex: state.currentIndex,
                            states: newStates
                        }
                    }
                }
            });
        } catch (e) {
            console.error("Save failed", e);
        }
    };

    const changeMode = (newMode: Mode) => {
        setMode(newMode);
        setQuizFeedback(null);
        setCurrentQuizIndex(0);
        setQuizScore(0);

        if (newMode === "QUIZ") return;

        if (newMode === "SCRAMBLE") {
            // Split sentences
            const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
            if (sentences.length === 0 && text.trim().length > 0) sentences.push(text);

            if (sentences.length > 0) {
                // Use saved state if valid
                let initialIndex = 0;
                let initialShuffled: string[] = [];
                let initialAnswer: string[] = [];
                let initialStatus: 'playing' | 'correct' | 'wrong' = 'playing';

                // If we have saved index, use it
                if (savedScrambleState && savedScrambleState.currentIndex < sentences.length) {
                    initialIndex = savedScrambleState.currentIndex;
                }

                // Check if we have history for this index
                if (savedScrambleState?.states && savedScrambleState.states[initialIndex]) {
                    const saved = savedScrambleState.states[initialIndex];
                    initialShuffled = saved.shuffledTokens;
                    initialAnswer = saved.userAnswer;
                    if (saved.status) initialStatus = saved.status;
                } else {
                    const sentence = sentences[initialIndex];
                    initialShuffled = sentence.trim().split(/\s+/).sort(() => Math.random() - 0.5);
                }

                setScrambleState({
                    sentences,
                    currentIndex: initialIndex,
                    shuffledTokens: initialShuffled,
                    userAnswer: initialAnswer,
                    status: initialStatus
                });
            }
            return;
        }

        let newTokens = [...tokens];
        newTokens = newTokens.map(t => {
            if (t.isPunctuation) return { ...t, isVisible: true };
            if (newMode === "READ") return { ...t, isVisible: true };
            if (newMode === "FIRST_LETTER") return { ...t, isVisible: false };
            if (newMode === "CLOZE") return { ...t, isVisible: Math.random() > 0.3 };
            return t;
        });
        setTokens(newTokens);
    };

    // Scramble Helpers
    const handleScrambleSelect = (token: string, index: number) => {
        if (scrambleState.status !== 'playing') return;

        const newShuffled = [...scrambleState.shuffledTokens];
        newShuffled.splice(index, 1);

        const newUserAnswer = [...scrambleState.userAnswer, token];

        const nextState = {
            ...scrambleState,
            shuffledTokens: newShuffled,
            userAnswer: newUserAnswer
        };
        setScrambleState(nextState);
        saveScrambleProgress(nextState);
    };

    const handleScrambleDeselect = (token: string, index: number) => {
        if (scrambleState.status !== 'playing') return;

        const newUserAnswer = [...scrambleState.userAnswer];
        newUserAnswer.splice(index, 1);

        const newShuffled = [...scrambleState.shuffledTokens, token];

        const nextState = {
            ...scrambleState,
            userAnswer: newUserAnswer,
            shuffledTokens: newShuffled
        };
        setScrambleState(nextState);
        saveScrambleProgress(nextState);
    };

    const checkScrambleAnswer = () => {
        const currentSentence = scrambleState.sentences[scrambleState.currentIndex];
        const originalWords = currentSentence.trim().split(/\s+/);

        let isCorrect = true;
        if (scrambleState.userAnswer.length !== originalWords.length) {
            isCorrect = false;
        } else {
            for (let i = 0; i < originalWords.length; i++) {
                if (scrambleState.userAnswer[i] !== originalWords[i]) {
                    isCorrect = false;
                    break;
                }
            }
        }

        const newStatus = isCorrect ? 'correct' : 'wrong';
        const nextState = { ...scrambleState, status: newStatus as 'correct' | 'wrong' };
        setScrambleState(nextState);
        saveScrambleProgress(nextState);
    };

    const loadOrGenerateSentence = (index: number, sentences: string[]) => {
        // Check saved history
        if (savedScrambleState?.states && savedScrambleState.states[index]) {
            const saved = savedScrambleState.states[index];
            return {
                currentIndex: index,
                shuffledTokens: saved.shuffledTokens,
                userAnswer: saved.userAnswer,
                status: saved.status || 'playing',
                sentences: sentences
            };
        }

        // Generate new
        const sentence = sentences[index];
        const shuffled = sentence.trim().split(/\s+/).sort(() => Math.random() - 0.5);
        return {
            currentIndex: index,
            shuffledTokens: shuffled,
            userAnswer: [],
            status: 'playing' as const,
            sentences: sentences
        };
    };

    const nextScrambleSentence = () => {
        if (scrambleState.currentIndex >= scrambleState.sentences.length - 1) return;
        const nextIndex = scrambleState.currentIndex + 1;

        // Save current before leaving (already saved on change, but ensures consistency)
        saveScrambleProgress(scrambleState);

        const newState = loadOrGenerateSentence(nextIndex, scrambleState.sentences);
        setScrambleState(newState);

        // Also update the 'current index' pointer in storage
        saveScrambleProgress(newState);
    };

    const resetScrambleSentence = () => {
        const currentSentence = scrambleState.sentences[scrambleState.currentIndex];
        const shuffled = currentSentence.trim().split(/\s+/).sort(() => Math.random() - 0.5);

        const newState = {
            ...scrambleState,
            shuffledTokens: shuffled,
            userAnswer: [],
            status: 'playing' as const
        };
        setScrambleState(newState);

        // We must also remove this from 'states' or verify 'savedStates' are updated
        // Actually, just overwriting with empty answer logic is fine.
        saveScrambleProgress(newState);
    };

    const jumpToScrambleSentence = (index: number) => {
        if (index < 0 || index >= scrambleState.sentences.length) return;

        saveScrambleProgress(scrambleState); // Save current 

        const newState = loadOrGenerateSentence(index, scrambleState.sentences);
        setScrambleState(newState);
        saveScrambleProgress(newState);

        setShowScrambleList(false);
    };

    const toggleReveal = (index: number) => {
        const newTokens = [...tokens];
        if (!newTokens[index].isPunctuation) {
            newTokens[index].isVisible = !newTokens[index].isVisible;
            setTokens(newTokens);
        }
    };

    const handleQuizAnswer = (option: string) => {
        if (quizFeedback) return;

        const currentQuestion = quizQuestions[currentQuizIndex];
        const isCorrect = option === currentQuestion.correctAnswer;

        if (isCorrect) setQuizScore(s => s + 1);

        setQuizFeedback({
            isCorrect,
            message: isCorrect ? "Correct!" : `Wrong! Answer: ${currentQuestion.correctAnswer} `
        });

        setTimeout(() => {
            if (currentQuizIndex < quizQuestions.length - 1) {
                setCurrentQuizIndex(prev => prev + 1);
                setQuizFeedback(null);
            } else {
                finishSession();
            }
        }, 1500);
    };

    const finishSession = () => {
        if (!activityId || !startTime) return;

        const duration = Math.round((Date.now() - startTime) / 1000);
        let score = 10;

        if (mode === "QUIZ") {
            score = Math.round((quizScore / quizQuestions.length) * 100) || 0;
            alert(`Quiz Complete! Score: ${score}% `);
        } else {
            if (mode === "CLOZE") score = 50;
            if (mode === "FIRST_LETTER") score = 80;
        }

        submitSessionMutation.mutate({
            activityId: activityId,
            mode: mode,
            score: score,
            durationSeconds: duration,
            mistakes: []
        });
    };

    const renderQuiz = () => {
        if (quizQuestions.length === 0) return <div className="text-center text-gray-400">Not enough text to generate questions.</div>;
        const question = quizQuestions[currentQuizIndex];

        return (
            <div className="max-w-2xl mx-auto space-y-8 mt-8">
                <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">Question {currentQuizIndex + 1} of {quizQuestions.length}</p>
                    <h2 className="text-2xl font-bold">{question.questionText}</h2>
                </div>

                <div className="grid gap-4">
                    {question.options.map((option, idx) => {
                        let btnClass = "bg-gray-800 hover:bg-gray-700 p-4 rounded-lg text-lg transition-all";
                        if (quizFeedback) {
                            if (option === question.correctAnswer) btnClass = "bg-green-600 p-4 rounded-lg text-lg";
                            else if (option === quizFeedback.message && !quizFeedback.isCorrect) btnClass = "bg-red-600 p-4 rounded-lg text-lg";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleQuizAnswer(option)}
                                disabled={!!quizFeedback}
                                className={btnClass}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>

                {quizFeedback && (
                    <div className={`text-center text-xl font-bold ${quizFeedback.isCorrect ? "text-green-400" : "text-red-400"} `}>
                        {quizFeedback.message}
                    </div>
                )}
            </div>
        );
    };

    const renderScramble = () => {
        return (
            <div className="max-w-2xl mx-auto space-y-6 mt-4 relative">
                <div className="flex justify-between items-center px-4">
                    <button
                        onClick={() => setShowScrambleList(!showScrambleList)}
                        className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                    >
                        <span>Sentence {scrambleState.currentIndex + 1} / {scrambleState.sentences.length}</span>
                        <span className="text-xs">▼</span>
                    </button>
                    <button
                        onClick={resetScrambleSentence}
                        className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                    >
                        Reset
                    </button>
                </div>

                {showScrambleList && (
                    <>
                        {/* Backdrop to close on click outside */}
                        <div
                            className="fixed inset-0 z-40 bg-black/50"
                            onClick={() => setShowScrambleList(false)}
                        ></div>

                        <div className="absolute top-10 left-4 z-50 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-2xl max-h-96 overflow-y-auto w-80">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-200">Sentence List</h3>
                                <button
                                    onClick={() => {
                                        if (confirm("Reset all persistence for this essay?")) {
                                            // 1. Reset Local State independent of closures
                                            const emptyState = { currentIndex: 0, states: {} };
                                            setSavedScrambleState(emptyState);

                                            // 2. Reset Current View
                                            const firstSentence = scrambleState.sentences[0];
                                            const shuffled = firstSentence.trim().split(/\s+/).sort(() => Math.random() - 0.5);

                                            setScrambleState({
                                                sentences: scrambleState.sentences,
                                                currentIndex: 0,
                                                userAnswer: [],
                                                shuffledTokens: shuffled,
                                                status: 'playing'
                                            });

                                            // 3. Persist Empty Map to DB
                                            if (activityId) {
                                                const currentActivity = activities?.find(a => a.id === activityId);
                                                const meta = currentActivity?.metadata || {};

                                                updateActivityMutation.mutate({
                                                    id: activityId,
                                                    data: {
                                                        metadata: {
                                                            ...meta,
                                                            scrambleProgress: {
                                                                currentIndex: 0,
                                                                states: {}
                                                            }
                                                        }
                                                    }
                                                });
                                                setShowScrambleList(false);
                                            }
                                        }
                                    }}
                                    className="text-xs text-red-400 hover:text-red-300 underline"
                                >
                                    Reset All
                                </button>
                            </div>

                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-700 border border-gray-500"></div> Not Started</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-600"></div> In Progress</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-600"></div> Correct</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600"></div> Wrong</div>
                            </div>

                            <div className="grid grid-cols-5 gap-2">
                                {scrambleState.sentences.map((_, idx) => {
                                    let bgClass = "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"; // Default: Not Started
                                    const isCurrent = idx === scrambleState.currentIndex;

                                    // Check memory for status
                                    if (savedScrambleState?.states && savedScrambleState.states[idx]) {
                                        const st = savedScrambleState.states[idx];
                                        if (st.status === 'correct') bgClass = "bg-green-600 text-white border-green-600";
                                        else if (st.status === 'wrong') bgClass = "bg-red-600 text-white border-red-600";
                                        else if (st.userAnswer && st.userAnswer.length > 0) bgClass = "bg-blue-600 text-white border-blue-600";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => jumpToScrambleSentence(idx)}
                                            className={`p-2 rounded text-center text-sm font-bold relative transition-all ${isCurrent
                                                ? 'ring-2 ring-white z-10 ' + bgClass
                                                : bgClass
                                                }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* Answer Area */}
                <div className="min-h-32 bg-gray-800 rounded-lg p-6 border border-gray-700 flex flex-wrap gap-2 content-start">
                    {scrambleState.userAnswer.map((token, idx) => (
                        <button
                            key={`${token}-${idx}`}
                            onClick={() => handleScrambleDeselect(token, idx)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-full font-medium transition-colors"
                        >
                            {token}
                        </button>
                    ))}
                    {scrambleState.userAnswer.length === 0 && (
                        <span className="text-gray-600 italic">Tap words below to build the sentence...</span>
                    )}
                </div>

                {/* Status/Actions */}
                <div className="flex justify-center items-center gap-4">
                    {scrambleState.status === 'playing' ? (
                        <button
                            onClick={checkScrambleAnswer}
                            className="bg-purple-600 hover:bg-purple-700 px-8 py-2 rounded-lg font-bold transition-all"
                        >
                            Check Answer
                        </button>
                    ) : (
                        <>
                            <span className={`text-xl font-bold ${scrambleState.status === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                                {scrambleState.status === 'correct' ? 'Correct!' : 'Wrong, try again.'}
                            </span>
                            {scrambleState.status === 'correct' && (
                                <button
                                    onClick={nextScrambleSentence}
                                    className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-bold"
                                >
                                    Next Sentence
                                </button>
                            )}
                            {scrambleState.status === 'wrong' && (
                                <button
                                    onClick={() => setScrambleState(prev => ({ ...prev, status: 'playing' }))}
                                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                                >
                                    Retry
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div className="border-t border-gray-700 pt-4"></div>

                {/* Word Bank */}
                <div className="flex flex-wrap gap-3 justify-center">
                    {scrambleState.shuffledTokens.map((token, idx) => (
                        <button
                            key={`${token}-${idx}`}
                            onClick={() => handleScrambleSelect(token, idx)}
                            className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-full font-medium transition-all transform hover:scale-105"
                        >
                            {token}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Essay Memorizer</h1>
                {!showEditor && mode !== 'QUIZ' && (
                    <div className="flex gap-2">
                        {activityId && (
                            <button
                                onClick={finishSession}
                                className="text-sm bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                                disabled={submitSessionMutation.isPending}
                            >
                                {submitSessionMutation.isPending ? "Saving..." : "Finish & Save"}
                            </button>
                        )}
                        <button
                            onClick={() => setShowEditor(true)}
                            className="text-sm bg-gray-700 px-3 py-1 rounded"
                        >
                            Edit Text
                        </button>
                    </div>
                )}
            </div>

            {showEditor ? (
                <div className="space-y-4">
                    <textarea
                        className="w-full h-64 p-4 bg-gray-800 rounded-lg text-white border border-gray-700 focus:outline-none focus:border-blue-500"
                        placeholder="Paste your essay here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => processText(text)}
                            disabled={!text.trim()}
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold"
                        >
                            Start Memorizing
                        </button>
                        {activityId && (
                            <button
                                onClick={() => {
                                    const currentActivity = activities?.find(a => a.id === activityId);
                                    const meta = currentActivity?.metadata || {};

                                    updateActivityMutation.mutate({
                                        id: activityId,
                                        data: {
                                            metadata: { ...meta, notes: text }
                                        }
                                    });
                                }}
                                disabled={updateActivityMutation.isPending || !text.trim()}
                                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-bold flex items-center gap-2"
                            >
                                {updateActivityMutation.isPending ? "Saving..." : "Save Content"}
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    {/* Controls */}
                    <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded-lg inline-flex">
                        {(["READ", "FIRST_LETTER", "CLOZE", "QUIZ", "SCRAMBLE"] as Mode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => changeMode(m)}
                                className={`px-4 py-2 rounded capitalize ${mode === m ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                            >
                                {m.replace('_', ' ').toLowerCase()}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    {mode === 'QUIZ' ? renderQuiz() : mode === 'SCRAMBLE' ? renderScramble() : (
                        <div className="text-xl leading-relaxed">
                            {tokens.map((token, i) => {
                                let display = token.text;
                                let style = "text-white";

                                if (!token.isVisible) {
                                    if (mode === "FIRST_LETTER") {
                                        display = token.text.charAt(0);
                                        style = "text-blue-300 font-bold cursor-pointer";
                                    } else if (mode === "CLOZE") {
                                        display = "_".repeat(token.text.length);
                                        style = "text-gray-500 font-bold cursor-pointer";
                                    }
                                } else {
                                    // Visible
                                    if (mode !== "READ" && !token.isPunctuation) {
                                        style = "text-green-300 cursor-pointer"; // Highlight revealed words
                                    }
                                }

                                return (
                                    <span
                                        key={i}
                                        onClick={() => toggleReveal(i)}
                                        className={style}
                                        style={{ whiteSpace: "pre-wrap" }}
                                    >
                                        {display}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
