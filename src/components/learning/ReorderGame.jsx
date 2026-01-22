import React, { useState, useEffect } from 'react';

// Shared Speech Function (duplicated for now or exported from utility if available)
// Ideally this should be a hook or context, but keeping it simple as per existing codebase patterns.
const speak = (text, rate = 1.0) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US") || v.name.includes("Samantha"));
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
};

export const ReorderGame = ({ sentence, onSuccess, onWrong }) => {
    const [pool, setPool] = useState([]);
    const [chosen, setChosen] = useState([]);
    const [status, setStatus] = useState('PENDING'); // PENDING, CORRECT, WRONG

    // Initialize standard shuffle
    useEffect(() => {
        if (!sentence) return;

        // Split and shuffle
        const words = sentence.content.split(/\s+/).filter(w => w.trim().length > 0);

        // Simple shuffle algorithm
        const shuffled = [...words].sort(() => Math.random() - 0.5);

        setPool(shuffled);
        setChosen([]);
        setStatus('PENDING');
    }, [sentence]);

    const handleWordClick = (word, index, fromPool) => {
        if (status === 'CORRECT') return; // Lock if correct

        // Speak word on click (optional visual/audio feedback)
        speak(word);

        if (fromPool) {
            // Move from pool to chosen
            const newPool = [...pool];
            newPool.splice(index, 1);
            setPool(newPool);
            setChosen([...chosen, word]);
        } else {
            // Move from chosen back to pool
            const newChosen = [...chosen];
            newChosen.splice(index, 1);
            setChosen(newChosen);
            setPool([...pool, word]);
        }

        // Reset status to pending if they are editing
        if (status === 'WRONG') setStatus('PENDING');
    };

    const checkAnswer = () => {
        const submission = chosen.join(" ");
        // Flexible check: ignore punctuation? User said "Tái cấu trúc", usually exact match is expected but punctuation might be tricky.
        // Let's normalize slightly (remove strict punctuation checking if desired, but for now exact match)
        // Actually, user data usually has punctuation attached to words like "Hello,".
        // So exact string match is safest for "Reorder".

        if (submission === sentence.content) {
            setStatus('CORRECT');
            speak("Correct!");
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1000);
        } else {
            setStatus('WRONG');
            speak("Try again");
            if (onWrong) onWrong();
        }
    };

    return (
        <div className="w-full flex flex-col items-center">
            {/* Drop Zone */}
            <div className={`w-full min-h-[120px] p-6 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-wrap gap-2 content-start items-start justify-center shadow-inner mb-6
                 ${status === 'CORRECT' ? 'bg-green-50 border-green-300' : status === 'WRONG' ? 'bg-red-50 border-red-300' : 'bg-white/60 border-indigo-200/60'}
             `}>
                {chosen.length === 0 && (
                    <div className="text-slate-300 font-bold text-lg flex flex-col items-center justify-center h-16 w-full">
                        <span>Sắp xếp câu vào đây</span>
                    </div>
                )}
                {chosen.map((w, i) => (
                    <button key={i} onClick={() => handleWordClick(w, i, false)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm md:text-base animate-fade-in">
                        {w}
                    </button>
                ))}
            </div>

            {/* Pool */}
            <div className="w-full flex flex-wrap gap-2 justify-center content-center min-h-[80px] mb-8">
                {pool.map((w, i) => (
                    <button key={i} onClick={() => handleWordClick(w, i, true)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium shadow-sm hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all text-sm md:text-base">
                        {w}
                    </button>
                ))}
            </div>

            {/* Action */}
            {status !== 'CORRECT' && (
                <button onClick={checkAnswer} className="px-10 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95">
                    Kiểm tra
                </button>
            )}
            {status === 'CORRECT' && (
                <div className="text-green-600 font-bold text-lg animate-bounce">
                    Chính xác! 🎉
                </div>
            )}
        </div>
    );
};
