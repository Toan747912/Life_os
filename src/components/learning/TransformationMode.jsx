import React, { useState } from 'react';
import { TransformationGame } from './TransformationGame';
import { TransformationHandwritingGame } from './TransformationHandwritingGame'; // Import new component

export const TransformationMode = ({ sentences, onBack, mode = 'REORDER' }) => { // Default to REORDER
    const [idx, setIdx] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    if (!sentences || sentences.length === 0) return (
        <div className="h-screen flex flex-col items-center justify-center text-slate-500 gap-4">
            <p className="text-xl font-bold">No data available for this mode.</p>
            <button onClick={onBack} className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Back</button>
        </div>
    );

    if (isFinished) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 animate-fade-in text-center p-8">
            <div className="text-6xl mb-6 animate-bounce">🎉</div>
            <h2 className="text-3xl font-black text-slate-800 mb-4">Lesson Complete!</h2>
            <p className="text-slate-500 mb-8 max-w-md">You have successfully transformed all sentences.</p>
            <button onClick={onBack} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:scale-105 transition-all">
                Return to Menu
            </button>
        </div>
    );

    const handleSuccess = () => {
        if (idx < sentences.length - 1) {
            setIdx(idx + 1);
        } else {
            setIsFinished(true);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-indigo-100 bg-white/50 backdrop-blur-sm sticky top-0 z-40">
                <button onClick={onBack} className="text-slate-400 hover:text-red-500 font-bold transition-colors flex items-center gap-2">
                    <span>✕</span> Exit
                </button>
                <div className="flex flex-col items-center">
                    <div className="text-indigo-900 font-bold bg-indigo-50 px-4 py-1 rounded-full text-sm mb-1">
                        Sentence {idx + 1} / {sentences.length}
                    </div>
                    {/* Mode Indicator */}
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {mode === 'REORDER' ? 'Word Reordering' : 'Handwriting Challenge'}
                    </div>
                </div>
            </div>

            {/* Content using GameLayout style implicitly or directly */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                {mode === 'REORDER' ? (
                    <TransformationGame
                        key={`reorder-${idx}`}
                        sentence={sentences[idx]}
                        onSuccess={handleSuccess}
                        onWrong={() => { }}
                    />
                ) : (
                    <TransformationHandwritingGame
                        key={`handwriting-${idx}`}
                        sentence={sentences[idx]}
                        onSuccess={handleSuccess}
                        onWrong={() => { }}
                    />
                )}
            </div>

            {/* Progress Bar */}
            <div className="fixed bottom-0 left-0 w-full h-1 bg-slate-200">
                <div
                    className={`h-full transition-all duration-500 ${mode === 'REORDER' ? 'bg-indigo-500' : 'bg-teal-500'}`}
                    style={{ width: `${((idx) / sentences.length) * 100}%` }}
                ></div>
            </div>
        </div>
    );
};
