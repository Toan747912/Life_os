import React, { useState, useEffect } from 'react';

const SettingsModal = ({ isOpen, onClose }) => {
    const [speechRate, setSpeechRate] = useState(1.0);

    useEffect(() => {
        // Load saved speech rate from localStorage
        const saved = localStorage.getItem('speechRate');
        if (saved) {
            setSpeechRate(parseFloat(saved));
        }
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('speechRate', speechRate.toString());
        onClose();
    };

    const handlePreview = () => {
        // Test the speech rate
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance("This is a preview of the speech rate you selected.");
            utterance.lang = 'en-US';
            utterance.rate = speechRate;
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes("Google US") || v.name.includes("Samantha"));
            if (preferredVoice) utterance.voice = preferredVoice;
            window.speechSynthesis.speak(utterance);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 p-8 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-extrabold text-slate-800">⚙️ Settings</h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                        ✕
                    </button>
                </div>

                {/* Speech Rate Setting */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">
                        🔊 Speech Reading Speed
                    </label>

                    {/* Value Display */}
                    <div className="text-center mb-4">
                        <span className="text-5xl font-black text-indigo-600">{speechRate.toFixed(1)}x</span>
                        <p className="text-sm text-slate-500 mt-1">
                            {speechRate < 0.8 ? '🐢 Very Slow' :
                                speechRate < 1.0 ? '🐌 Slow' :
                                    speechRate === 1.0 ? '👍 Normal' :
                                        speechRate < 1.5 ? '🚀 Fast' : '⚡ Very Fast'}
                        </p>
                    </div>

                    {/* Slider */}
                    <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={speechRate}
                        onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                        className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                        style={{
                            background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${((speechRate - 0.5) / 1.5) * 100}%, #e2e8f0 ${((speechRate - 0.5) / 1.5) * 100}%, #e2e8f0 100%)`
                        }}
                    />

                    {/* Labels */}
                    <div className="flex justify-between text-xs text-slate-400 font-bold mt-2">
                        <span>0.5x Slow</span>
                        <span>1.0x Normal</span>
                        <span>2.0x Fast</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handlePreview}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                    >
                        🎧 Preview
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-105"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
