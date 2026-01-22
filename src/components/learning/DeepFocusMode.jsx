import React, { useState, useEffect } from 'react';
import { ReorderGame } from './ReorderGame';
import { DictationGame } from './DictationGame';

const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
};

export const DeepFocusMode = ({ sentences, onBack }) => {
    const [idx, setIdx] = useState(0);
    const [phase, setPhase] = useState('OBSERVE'); // OBSERVE -> REORDER -> WRITE
    const currentSentence = sentences[idx];

    useEffect(() => {
        // Auto play audio on Observe phase start
        if (phase === 'OBSERVE' && currentSentence) {
            setTimeout(() => speak(currentSentence.content), 500);
        }
    }, [phase, idx, currentSentence]);

    const handleNextPhase = () => {
        if (phase === 'OBSERVE') setPhase('REORDER');
        else if (phase === 'REORDER') setPhase('WRITE');
        else if (phase === 'WRITE') handleNextSentence();
    };

    const handleNextSentence = () => {
        if (idx < sentences.length - 1) {
            setIdx(idx + 1);
            setPhase('OBSERVE');
        } else {
            alert("Chúc mừng! Bạn đã hoàn thành xuất sắc bài học.");
            onBack();
        }
    };

    if (!currentSentence) return <div className="p-10 text-center">Loading...</div>;

    // Progress Bar Calculation
    const progressPercent = ((idx) / sentences.length) * 100;

    return (
        <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">

            {/* Top Bar with Progress */}
            <div className="h-16 px-6 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center gap-4 z-20 shrink-0">
                <button onClick={onBack} className="text-slate-400 hover:text-red-500 transition font-bold">✕ Exit</button>
                <div className="flex-1 w-full max-w-xl mx-auto flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        <span>Câu {idx + 1}/{sentences.length}</span>
                        <span>Tiến độ {Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-700 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto w-full flex flex-col items-center justify-center p-4 relative">

                {/* Visual Context / Header for Phase */}
                <div className="absolute top-8 left-0 w-full text-center pointer-events-none">
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
                        {phase === 'OBSERVE' && "Bước 1: Quan Sát & Thấm Âm"}
                        {phase === 'REORDER' && "Bước 2: Tái Cấu Trúc (Kéo Thả)"}
                        {phase === 'WRITE' && "Bước 3: Ghi Nhớ & Phản Xạ (Viết)"}
                    </h3>
                    <div className="flex justify-center gap-2">
                        <span className={`w-3 h-3 rounded-full transition-all ${phase === 'OBSERVE' ? 'bg-blue-500 scale-125' : 'bg-slate-200'}`}></span>
                        <span className={`w-3 h-3 rounded-full transition-all ${phase === 'REORDER' ? 'bg-indigo-500 scale-125' : 'bg-slate-200'}`}></span>
                        <span className={`w-3 h-3 rounded-full transition-all ${phase === 'WRITE' ? 'bg-pink-500 scale-125' : 'bg-slate-200'}`}></span>
                    </div>
                </div>

                <div className="w-full max-w-4xl bg-white p-8 md:p-12 rounded-[3em] shadow-2xl border border-slate-100 relative overflow-hidden min-h-[400px] flex flex-col justify-center items-center animate-slide-up">

                    {/* Background decoration */}
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full filter blur-[80px] opacity-20 transition-colors duration-1000
                        ${phase === 'OBSERVE' ? 'bg-blue-400' : phase === 'REORDER' ? 'bg-indigo-400' : 'bg-pink-400'}
                    `}></div>
                    <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full filter blur-[80px] opacity-20 transition-colors duration-1000
                        ${phase === 'OBSERVE' ? 'bg-cyan-400' : phase === 'REORDER' ? 'bg-purple-400' : 'bg-rose-400'}
                    `}></div>

                    {/* PHASE 1: OBSERVE */}
                    {phase === 'OBSERVE' && (
                        <div className="flex flex-col items-center text-center z-10 gap-8">
                            <h1 className="text-3xl md:text-5xl font-medium text-slate-800 leading-tight font-serif tracking-wide cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => speak(currentSentence.content)}>
                                {currentSentence.content}
                            </h1>

                            {/* Simple analysis visualization (placeholder) */}
                            <div className="flex gap-2 flex-wrap justify-center opacity-60">
                                {currentSentence.content.split(/\s+/).map((w, i) => (
                                    <span key={i} className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-mono text-slate-500">{w}</span>
                                ))}
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button onClick={() => speak(currentSentence.content)} className="p-4 bg-white border border-slate-200 rounded-full shadow-sm hover:scale-110 transition text-2xl">
                                    🔊
                                </button>
                                <button onClick={handleNextPhase} className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all">
                                    Đã nhớ &rarr; Tiếp tục
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PHASE 2: REORDER */}
                    {phase === 'REORDER' && (
                        <div className="w-full z-10">
                            <ReorderGame
                                sentence={currentSentence}
                                onSuccess={() => setTimeout(handleNextPhase, 1000)}
                            />
                        </div>
                    )}

                    {/* PHASE 3: WRITE */}
                    {phase === 'WRITE' && (
                        <div className="w-full z-10">
                            <DictationGame
                                sentence={currentSentence}
                                onSuccess={() => setTimeout(handleNextPhase, 1500)} // Longer delay for celebration
                            />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
