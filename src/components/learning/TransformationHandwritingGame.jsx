import React, { useState } from 'react';
import HandwritingPad from './HandwritingPad';

const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US") || v.name.includes("Samantha"));
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
};

export const TransformationHandwritingGame = ({ sentence, onSuccess, onWrong }) => {
    const [status, setStatus] = useState('PENDING'); // PENDING, CORRECT, WRONG
    const [feedback, setFeedback] = useState("");

    const handleRecognized = (recognizedText) => {
        if (!recognizedText || recognizedText.startsWith("Lỗi:")) {
            setFeedback(recognizedText || "Không nhận diện được chữ.");
            return;
        }

        const cleanRecognized = recognizedText.trim().toLowerCase().replace(/[.,!?;:]/g, "");
        const cleanTarget = sentence.content.trim().toLowerCase().replace(/[.,!?;:]/g, "");

        // Simple strict match for now, could be fuzzy later
        if (cleanRecognized === cleanTarget) {
            setStatus('CORRECT');
            speak("Excellent!");
            setFeedback(`Chính xác! "${recognizedText}"`);
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1500);
        } else {
            setStatus('WRONG');
            speak("Try again.");
            setFeedback(`Sai rồi. AI đọc được: "${recognizedText}"`);
            if (onWrong) onWrong();
        }
    };

    return (
        <div className="w-full flex flex-col items-center animate-fade-in relative z-10">
            {/* PROMPT / QUESTION AREA */}
            <div className="bg-white/90 p-8 rounded-[2.5rem] shadow-xl mb-6 w-full max-w-4xl text-center border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all">
                {/* Decorative top bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-teal-400 to-emerald-500"></div>

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
                        <div className="inline-block px-6 py-2 bg-teal-50 text-teal-600 border border-teal-100 rounded-2xl text-lg md:text-xl font-bold tracking-wide shadow-sm transform group-hover:scale-105 transition-transform">
                            {sentence.prompt}
                        </div>
                    </div>
                )}
            </div>

            {/* HANDWRITING AREA */}
            <div className="w-full max-w-4xl flex flex-col items-center">
                <div className={`w-full p-4 rounded-3xl transition-all border-4 ${status === 'CORRECT' ? 'border-green-400 bg-green-50' : status === 'WRONG' ? 'border-red-400 bg-red-50' : 'border-transparent'}`}>
                    <HandwritingPad
                        onRecognized={handleRecognized}
                        expectedAnswer={sentence.content}
                    />
                </div>

                {/* Feedback Text */}
                {feedback && (
                    <div className={`mt-4 px-6 py-3 rounded-xl font-bold text-lg shadow-sm animate-bounce-in ${status === 'CORRECT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {feedback}
                    </div>
                )}
            </div>

            {status === 'CORRECT' && (
                <div className="text-green-600 font-bold text-3xl animate-bounce mt-6">
                    ✓ Correct!
                </div>
            )}
        </div>
    );
};
