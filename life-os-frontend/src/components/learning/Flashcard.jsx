import React, { useState, useEffect, useRef } from 'react';
import { Volume2, RotateCw, Type, CheckCircle2, XCircle, BookOpen, Youtube } from 'lucide-react';

const Flashcard = ({ item, onResult }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [mode, setMode] = useState('standard'); // 'standard' or 'typing'
    const [typedText, setTypedText] = useState('');
    const [evalStatus, setEvalStatus] = useState('idle'); // 'idle', 'correct', 'incorrect'
    const inputRef = useRef(null);

    const { term, definition, exampleSentence, extraInfo, resource } = item || {};
    const { ipa, synonyms, timestamp } = extraInfo || {};

    const getYoutubeContextUrl = () => {
        const url = resource?.aiMetadata?.sourceUrl;
        if (!url || timestamp === undefined || timestamp === null) return null;
        const hasQuery = url.includes('?');
        return `${url}${hasQuery ? '&' : '?'}t=${timestamp}s`;
    };

    // Reset state when changing item
    useEffect(() => {
        setIsFlipped(false);
        setTypedText('');
        setEvalStatus('idle');
    }, [item]);

    // Auto focus input when in typing mode
    useEffect(() => {
        if (!isFlipped && mode === 'typing' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isFlipped, mode, item]);

    const playAudio = (e) => {
        if (e) e.stopPropagation();
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(term);
        utterance.lang = 'en-US';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.stopPropagation();
            if (typedText.trim()) {
                checkAnswer();
            }
        }
    };

    const checkAnswer = () => {
        if (!term) return;

        const cleanStr = (str) => str.toLowerCase().trim().replace(/[.,!?;:()[\]{}"']/g, '');

        if (cleanStr(typedText) === cleanStr(term)) {
            setEvalStatus('correct');
            playAudio();
            setTimeout(() => {
                onResult('remembered');
            }, 1200);
        } else {
            setEvalStatus('incorrect');
            setIsFlipped(true);
        }
    };

    const toggleMode = (e) => {
        e.stopPropagation();
        setMode(mode === 'standard' ? 'typing' : 'standard');
        setTypedText('');
        setEvalStatus('idle');
    };

    return (
        <div className="w-full max-w-md mx-auto perspective-1000 h-96">
            <div
                className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : 'cursor-pointer'}`}
                onClick={() => {
                    if (mode === 'standard') setIsFlipped(!isFlipped);
                }}
            >
                {/* Front Side */}
                <div className={`absolute inset-0 backface-hidden bg-white rounded-3xl border-2 shadow-xl flex flex-col p-8 text-center transition-colors ${evalStatus === 'correct' ? 'border-emerald-400 bg-emerald-50' :
                    evalStatus === 'incorrect' ? 'border-rose-400 bg-rose-50' :
                        'border-slate-100'
                    }`}>
                    {/* Header Controls */}
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold text-indigo-500 uppercase tracking-widest">
                            {mode === 'standard' ? 'Standard' : 'Typing Mode'}
                        </span>
                        <div className="flex gap-2">
                            {getYoutubeContextUrl() && (
                                <a
                                    href={getYoutubeContextUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors z-10 relative"
                                    title="View context on YouTube"
                                >
                                    <Youtube size={18} />
                                </a>
                            )}
                            <button
                                onClick={playAudio}
                                className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors z-10 relative"
                                title="Listen to pronunciation"
                            >
                                <Volume2 size={18} />
                            </button>
                            <button
                                onClick={toggleMode}
                                className={`p-2 rounded-full transition-colors z-10 relative ${mode === 'typing' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
                                title={mode === 'standard' ? "Switch to Typing Mode" : "Switch to Standard Mode"}
                            >
                                {mode === 'standard' ? <Type size={18} /> : <BookOpen size={18} />}
                            </button>
                        </div>
                    </div>

                    {mode === 'standard' ? (
                        // STANDARD MODE
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h2 className="text-4xl font-bold text-slate-800 mb-2">{term}</h2>
                            {ipa && <p className="text-slate-400 font-mono text-lg">{ipa}</p>}
                            <div className="mt-8 flex items-center gap-2 text-slate-400 text-sm">
                                <RotateCw size={16} />
                                <span>Click anywhere to flip</span>
                            </div>
                        </div>
                    ) : (
                        // TYPING MODE
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl w-full text-slate-700 italic border border-slate-100 text-sm mb-2 shadow-inner">
                                {definition}
                            </div>
                            {synonyms && synonyms.length > 0 && (
                                <p className="text-xs text-slate-400">
                                    <span className="font-semibold text-slate-500">Hint:</span> {synonyms.join(', ')}
                                </p>
                            )}

                            <div className="relative w-full z-10 flex">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    onClick={(e) => e.stopPropagation()}
                                    value={typedText}
                                    onChange={(e) => setTypedText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type the word here..."
                                    disabled={evalStatus !== 'idle'}
                                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all text-center text-lg font-bold shadow-sm ${evalStatus === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
                                        evalStatus === 'incorrect' ? 'border-rose-500 bg-rose-50 text-rose-700' :
                                            'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 bg-white'
                                        }`}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    spellCheck="false"
                                />
                                {evalStatus === 'correct' && <CheckCircle2 className="absolute right-3 top-3 text-emerald-500" size={24} />}
                                {evalStatus === 'incorrect' && <XCircle className="absolute right-3 top-3 text-rose-500" size={24} />}
                            </div>

                            {evalStatus === 'idle' && (
                                <p className="text-xs text-slate-400 mt-2">Press <kbd className="font-mono bg-slate-100 px-1 rounded">Enter</kbd> to submit</p>
                            )}
                            {evalStatus === 'correct' && (
                                <p className="text-emerald-600 font-bold animate-pulse text-sm mt-2">Excellent! Moving to next...</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Back Side */}
                <div
                    className="absolute inset-0 backface-hidden bg-indigo-600 rounded-3xl shadow-xl flex flex-col p-8 text-white rotate-y-180 overflow-y-auto"
                    onClick={(e) => {
                        // In typing mode, clicking back side doesn't flip back to front if evaluating
                        if (mode === 'standard' || evalStatus === 'idle') {
                            setIsFlipped(false);
                        }
                    }}
                >
                    <div className="flex justify-between items-start mb-6 w-full">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-75">Definition</span>
                        <div className="flex items-center gap-3">
                            {getYoutubeContextUrl() && (
                                <a
                                    href={getYoutubeContextUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 text-rose-300 hover:text-rose-100 hover:bg-white/10 rounded-full transition-colors relative z-10"
                                    title="View context on YouTube"
                                >
                                    <Youtube size={20} />
                                </a>
                            )}
                            <button onClick={playAudio} className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10">
                                <Volume2 size={20} />
                            </button>
                        </div>
                    </div>

                    {mode === 'typing' && evalStatus === 'incorrect' && (
                        <div className="bg-rose-500/30 text-white p-3 rounded-xl mb-4 text-center border border-rose-400/50">
                            <p className="text-xs font-bold uppercase tracking-wider mb-1 text-rose-200">Correct Answer:</p>
                            <p className="text-2xl font-black tracking-wide">{term}</p>
                        </div>
                    )}

                    {mode === 'standard' && (
                        <p className="text-2xl font-medium mb-6 leading-tight">
                            {definition}
                        </p>
                    )}

                    {exampleSentence && (
                        <div className={`mt-auto ${mode === 'typing' ? '' : 'pt-6 border-t border-white/20'}`}>
                            <span className="text-xs font-bold uppercase tracking-wider opacity-75 block mb-2">Example</span>
                            <p className="italic text-indigo-100 text-lg">"{exampleSentence}"</p>
                        </div>
                    )}

                    {synonyms && synonyms.length > 0 && (
                        <div className="mt-4">
                            <span className="text-xs font-bold uppercase tracking-wider opacity-75 block mb-1">Synonyms</span>
                            <p className="text-sm text-indigo-100">{synonyms.join(', ')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons (Visible only when flipped) */}
            {isFlipped && (
                <div className="flex gap-4 mt-8 animate-in slide-in-from-bottom-4 duration-300">
                    <button
                        onClick={(e) => { e.stopPropagation(); onResult('forgot'); }}
                        className="flex-1 py-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-50 transition-colors shadow-sm"
                    >
                        I forgot
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onResult('remembered'); }}
                        className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                    >
                        I remembered!
                    </button>
                </div>
            )}
        </div>
    );
};

export default Flashcard;
