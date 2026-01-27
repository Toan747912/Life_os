import React, { useState } from 'react';
import HandwritingPad from './HandwritingPad';

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

// Simple similarity checker
const getSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    if (s1 === s2) return 1.0;

    let matches = 0;
    const len = Math.min(s1.length, s2.length);
    for (let i = 0; i < len; i++) {
        if (s1[i] === s2[i]) matches++;
    }
    return matches / Math.max(s1.length, s2.length);
};

export const TransformationHandwritingGame = ({ sentence, onSuccess, onWrong }) => {
    const [status, setStatus] = useState('WRITING'); // WRITING, CHECKING, CORRECT, WRONG
    const [recognizedText, setRecognizedText] = useState("");
    const [errorDetails, setErrorDetails] = useState(null);

    const handleRecognized = (text) => {
        if (!text || text.startsWith("Lỗi:")) {
            speak("Recognition failed");
            setErrorDetails({ message: text || "Không nhận diện được chữ.", type: 'error' });
            return;
        }

        setRecognizedText(text.trim());
        setStatus('CHECKING');

        // Compare with target
        const cleanRecognized = text.trim().toLowerCase().replace(/[.,!?;:]/g, "");
        const cleanTarget = sentence.content.trim().toLowerCase().replace(/[.,!?;:]/g, "");

        const similarity = getSimilarity(cleanRecognized, cleanTarget);

        if (cleanRecognized === cleanTarget) {
            setStatus('CORRECT');
            speak("Perfect!");
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1500);
        } else if (similarity > 0.7) {
            setStatus('WRONG');
            speak("Very close, but not quite.");
            setErrorDetails({
                message: `You wrote: "${text}"`,
                expected: `Correct: "${sentence.content}"`,
                type: 'similar'
            });
            if (onWrong) onWrong();
        } else {
            setStatus('WRONG');
            speak("That's not correct.");
            setErrorDetails({
                message: `You wrote: "${text}"`,
                expected: `Correct: "${sentence.content}"`,
                type: 'wrong'
            });
            if (onWrong) onWrong();
        }
    };

    const handleRetry = () => {
        setStatus('WRITING');
        setRecognizedText("");
        setErrorDetails(null);
    };

    return (
        <div className="w-full flex flex-col items-center animate-fade-in relative z-10">
            {/* API LIMIT INFO */}
            <div className="w-full max-w-4xl mb-4 bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div className="flex-1">
                        <h4 className="font-bold text-blue-800 text-sm mb-1">Gemini AI Recognition Limits</h4>
                        <p className="text-blue-600 text-xs">
                            • Free tier: ~60 requests/minute
                            • Write clearly and wait for recognition to complete
                            • Long sentences may take 2-3 seconds
                        </p>
                    </div>
                </div>
            </div>

            {/* PROMPT / QUESTION AREA */}
            <div className="bg-white/90 p-8 rounded-[2.5rem] shadow-xl mb-6 w-full max-w-4xl text-center border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all">
                <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-teal-400 to-emerald-500"></div>

                {sentence.context && (
                    <div className="mb-6">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Original Sentence</span>
                        <h3 className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed font-serif">
                            {sentence.context}
                        </h3>
                    </div>
                )}

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
            {status === 'WRITING' && (
                <div className="w-full max-w-4xl flex flex-col items-center">
                    <div className="w-full p-4 rounded-3xl transition-all border-4 border-teal-200/60 bg-white/80">
                        <HandwritingPad
                            onRecognized={handleRecognized}
                            expectedAnswer={sentence.content}
                        />
                    </div>
                    <p className="text-slate-500 text-sm mt-4 italic">✍️ Write the entire sentence freely, then click "Chấm điểm / Đọc chữ"</p>
                </div>
            )}

            {/* RESULT DISPLAY */}
            {(status === 'CHECKING' || status === 'WRONG') && errorDetails && (
                <div className={`w-full max-w-4xl p-6 rounded-3xl shadow-lg mb-6 ${errorDetails.type === 'similar' ? 'bg-orange-50 border-2 border-orange-300' :
                    errorDetails.type === 'wrong' ? 'bg-red-50 border-2 border-red-300' : 'bg-gray-50'
                    }`}>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">{errorDetails.type === 'similar' ? '🟠' : '🔴'}</span>
                            <div className="flex-1">
                                <p className={`font-bold text-lg ${errorDetails.type === 'similar' ? 'text-orange-700' : 'text-red-700'}`}>
                                    {errorDetails.message}
                                </p>
                                {errorDetails.expected && (
                                    <p className="text-green-700 font-bold text-lg mt-2">
                                        {errorDetails.expected}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex gap-4 mt-4">
                {(status === 'WRONG' || status === 'CHECKING') && (
                    <button
                        onClick={handleRetry}
                        className="px-12 py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
                    >
                        🔄 Try Again
                    </button>
                )}
            </div>

            {status === 'CORRECT' && (
                <div className="flex flex-col items-center gap-4 animate-bounce-in">
                    <div className="text-green-600 font-bold text-4xl">
                        ✓ Perfect!
                    </div>
                    <div className="text-green-700 text-lg font-medium bg-green-50 px-6 py-3 rounded-2xl">
                        You wrote: "{recognizedText}"
                    </div>
                </div>
            )}
        </div>
    );
};
