import React, { useState, useEffect } from 'react';

// Reusing speak function or creating a local one
const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    // Use global speech rate from localStorage
    const globalRate = localStorage.getItem('speechRate');
    utterance.rate = globalRate ? parseFloat(globalRate) : 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US") || v.name.includes("Samantha"));
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
};

export const TransformationGame = ({ sentence, onSuccess, onWrong }) => {
    const [pool, setPool] = useState([]);
    const [chosen, setChosen] = useState([]);
    const [status, setStatus] = useState('PENDING'); // PENDING, CORRECT, WRONG

    useEffect(() => {
        if (!sentence) return;

        let words = [];

        // 1. Prefer API-provided shuffled words
        if (sentence.shuffled_words && Array.isArray(sentence.shuffled_words)) {
            words = sentence.shuffled_words;
        } else {
            // 2. Fallback: Generate client-side (Critical Fix)
            const contentWords = sentence.content ? sentence.content.trim().split(/\s+/) : [];
            let distractors = [];

            if (sentence.distractors) {
                if (Array.isArray(sentence.distractors)) {
                    distractors = sentence.distractors;
                } else if (typeof sentence.distractors === 'string') {
                    try {
                        // Try JSON parse first (e.g. "["bad", "wrong"]")
                        const parsed = JSON.parse(sentence.distractors);
                        if (Array.isArray(parsed)) distractors = parsed;
                    } catch (e) {
                        // Fallback to comma-separated if simple string
                        distractors = sentence.distractors.split(',').map(s => s.trim());
                    }
                }
            }

            // Combine and Shuffle
            words = [...contentWords, ...distractors].sort(() => Math.random() - 0.5);
        }

        setPool(words);
        setChosen([]);
        setStatus('PENDING');
    }, [sentence]);

    const handlePoolClick = (word) => {
        if (status === 'CORRECT') return;

        // Speak
        speak(word);

        // Add to chosen
        setChosen([...chosen, word]);

        // DO NOT REMOVE from pool (as requested: "tự đã chọn không bị mất")

        if (status === 'WRONG') setStatus('PENDING');
    };

    const handleChosenClick = (index) => {
        if (status === 'CORRECT') return;

        const newChosen = [...chosen];
        newChosen.splice(index, 1);
        setChosen(newChosen);

        if (status === 'WRONG') setStatus('PENDING');
    };

    const checkAnswer = () => {
        // Construct sentence
        // Note: sentence.content is the target.
        // We need to match it.
        // Normalize punctuation?
        // Let's assume strict match first, maybe relaxed later.

        const submission = chosen.join(" ");
        // Remove trailing punctuation from comparison if desired, but user might want to construct WITH punctuation if available.
        // However, usually "shuffled_words" in ReorderGame splits punctuation attached to words.

        if (submission === sentence.content || submission === sentence.content.trim()) {
            setStatus('CORRECT');
            speak("Excellent!");
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1000);
        } else {
            setStatus('WRONG');
            speak("Not quite.");
            if (onWrong) onWrong();
        }
    };

    return (
        <div className="w-full flex flex-col items-center animate-fade-in">
            {/* PROMPT / QUESTION AREA */}
            {/* PROMPT / QUESTION AREA */}
            <div className="bg-white/90 p-8 rounded-[2.5rem] shadow-xl mb-10 w-full max-w-4xl text-center border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all">
                {/* Decorative top bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-pink-400 to-indigo-500"></div>

                {/* Context Sentence (Original) */}
                {sentence.context && (
                    <div className="mb-6">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Original Sentence</span>
                        <h3 className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed font-serif">
                            {sentence.context}
                        </h3>
                    </div>
                )}

                {/* Keyword Prompt */}
                {sentence.prompt && (
                    <div className="mb-2">
                        <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mb-1 block">Keyword</span>
                        <div className="inline-block px-6 py-2 bg-pink-50 text-pink-600 border border-pink-100 rounded-2xl text-lg md:text-xl font-bold tracking-wide shadow-sm transform group-hover:scale-105 transition-transform">
                            {sentence.prompt}
                        </div>
                    </div>
                )}

                {/* Fallback if no context/prompt */}
                {!sentence.context && !sentence.prompt && (
                    <h2 className="text-2xl font-medium text-slate-800">{sentence.content}</h2>
                )}
            </div>

            {/* ANSWER AREA (Chosen Words) */}
            <div className={`w-full max-w-4xl min-h-[100px] p-6 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-wrap gap-2 content-start items-start justify-center shadow-inner mb-8
                 ${status === 'CORRECT' ? 'bg-green-50 border-green-300' : status === 'WRONG' ? 'bg-red-50 border-red-300' : 'bg-white/60 border-indigo-200/60'}
             `}>
                {chosen.length === 0 && (
                    <div className="text-slate-400 text-lg flex items-center justify-center h-full w-full italic opacity-60">
                        Tap words below to build the answer...
                    </div>
                )}
                {chosen.map((w, i) => (
                    <button key={i} onClick={() => handleChosenClick(i)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-lg animate-pop-in">
                        {w}
                    </button>
                ))}
            </div>

            {/* POOL AREA (Persistent) */}
            <div className="w-full max-w-4xl flex flex-wrap gap-3 justify-center content-center mb-10">
                {pool.map((w, i) => (
                    <button key={i} onClick={() => handlePoolClick(w)}
                        className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium shadow-sm hover:border-indigo-400 hover:text-indigo-600 hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all text-lg">
                        {w}
                    </button>
                ))}
            </div>

            {/* CONTROLS */}
            {status !== 'CORRECT' && (
                <div className="flex gap-4">
                    <button onClick={() => setChosen([])}
                        className="px-6 py-3 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl transition-colors">
                        Clear
                    </button>
                    <button onClick={checkAnswer}
                        className="px-12 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 hover:shadow-2xl ring-4 ring-transparent hover:ring-indigo-200">
                        Check Answer
                    </button>
                </div>
            )}

            {status === 'CORRECT' && (
                <div className="text-green-600 font-bold text-2xl animate-bounce">
                    ✓ Correct!
                </div>
            )}
        </div>
    );
};
