import React, { useState, useEffect, useRef } from 'react';
import HandwritingPad from './HandwritingPad';

const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
};

export const DictationGame = ({ sentence, onSuccess }) => {
    const [userAnswer, setUserAnswer] = useState("");
    const [status, setStatus] = useState('PENDING'); // PENDING, CORRECT, WRONG

    useEffect(() => {
        setUserAnswer("");
        setStatus('PENDING');
        // Auto play audio when mounting this step
        setTimeout(() => speak(sentence.content), 500);
    }, [sentence]);

    const handleAIResult = (text) => {
        setUserAnswer(text);
        if (status === 'WRONG') setStatus('PENDING');
    };

    const checkDictation = () => {
        const target = sentence.content.trim();
        const userVal = userAnswer.trim();

        if (target === userVal) {
            setStatus('CORRECT');
            speak("Excellent!");
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1000);
        } else {
            // Fallback: Case insensitive check
            if (target.toLowerCase() === userVal.toLowerCase()) {
                setStatus('CORRECT'); // Accept case insensitive
                speak("Good!");
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                }, 1000);
            } else {
                setStatus('WRONG');
                speak("Listen again");
            }
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
            <div className="mb-8">
                <button onClick={() => speak(sentence.content)}
                    className="w-20 h-20 rounded-full bg-linear-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-xl shadow-pink-300 hover:scale-110 active:scale-95 transition-all text-4xl animate-pulse-soft">
                    🔊
                </button>
            </div>
            
            <h3 className="mb-4 font-bold text-gray-700">✍️ Viết lại từ bạn vừa nghe:</h3>

            <HandwritingPad onRecognized={handleAIResult} expectedAnswer={sentence.content} />

            <div className="mt-4 p-4 bg-gray-100 rounded-lg w-full text-center">
                <p className="text-xs text-gray-500">Hệ thống nhận diện là:</p>
                <p className={`text-2xl font-bold min-h-[40px]
                    ${status === 'CORRECT' ? 'text-green-700' :
                    status === 'WRONG' ? 'text-red-700' : 'text-indigo-700'}`}
                >
                    {userAnswer || "..."}
                </p>
            </div>

            {status === 'WRONG' && (
                <p className="text-red-500 text-sm font-bold mt-3 text-center animate-shake">
                    Chưa chính xác. Hãy nghe kỹ lại và viết lại!
                </p>
            )}

            <div className="mt-8">
                <button onClick={checkDictation} className="px-10 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50" disabled={!userAnswer}>
                    Kiểm tra
                </button>
            </div>
        </div>
    );
};
