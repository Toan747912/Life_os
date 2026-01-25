import React, { useState, useEffect, useMemo } from 'react';

const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
};

export const MatchingGame = ({ sentences, onBack }) => {
    const [leftItems, setLeftItems] = useState([]);
    const [rightItems, setRightItems] = useState([]);
    const [selectedLeft, setSelectedLeft] = useState(null); // id
    const [selectedRight, setSelectedRight] = useState(null); // id
    const [matches, setMatches] = useState([]); // Array of id
    const [wrongMatch, setWrongMatch] = useState(null); // { leftId, rightId }
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        // Prepare items
        const left = sentences.map(s => ({ id: s.id, text: s.context || s.prompt || "(Missing Context)" }));
        const right = sentences.map(s => ({ id: s.id, text: s.content }));

        // Shuffle
        setLeftItems([...left].sort(() => Math.random() - 0.5));
        setRightItems([...right].sort(() => Math.random() - 0.5));
    }, [sentences]);

    const handleSelectLeft = (id) => {
        if (matches.includes(id) || wrongMatch) return;
        setSelectedLeft(id);
        if (selectedRight) checkMatch(id, selectedRight);
    };

    const handleSelectRight = (id) => {
        if (matches.includes(id) || wrongMatch) return;
        setSelectedRight(id);
        if (selectedLeft) checkMatch(selectedLeft, id);
    };

    const checkMatch = (lId, rId) => {
        if (lId === rId) {
            // Correct
            const newMatches = [...matches, lId];
            setMatches(newMatches);
            setSelectedLeft(null);
            setSelectedRight(null);
            speak(sentences.find(s => s.id === lId).content);

            if (newMatches.length === sentences.length) {
                setTimeout(() => setIsFinished(true), 500);
            }
        } else {
            // Wrong
            setWrongMatch({ leftId: lId, rightId: rId });
            setTimeout(() => {
                setWrongMatch(null);
                setSelectedLeft(null);
                setSelectedRight(null);
            }, 800);
        }
    };

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center animate-bounce-in h-full">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-5xl mb-6 shadow-sm">🎉</div>
                <h2 className="text-4xl font-black text-slate-800 mb-4">Tuyệt vời!</h2>
                <p className="text-slate-500 mb-8 font-medium">Bạn đã nối chính xác tất cả các câu.</p>
                <button onClick={onBack} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:scale-105 active:scale-95 transition-all">
                    Quay lại Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col h-full overflow-hidden p-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">🧩 Thử thách Nối Câu</h3>
                <div className="bg-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full font-bold text-sm">
                    {matches.length} / {sentences.length} đã hoàn thành
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-8 md:gap-16 items-start overflow-y-auto custom-scrollbar pr-2 py-4">
                {/* Left Column: Contexts */}
                <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 pl-2">Ngữ cảnh gốc</p>
                    {leftItems.map(item => {
                        const isMatched = matches.includes(item.id);
                        const isSelected = selectedLeft === item.id;
                        const isWrong = wrongMatch?.leftId === item.id;

                        return (
                            <button
                                key={`left-${item.id}`}
                                onClick={() => handleSelectLeft(item.id)}
                                disabled={isMatched}
                                className={`w-full text-left p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 relative group
                                    ${isMatched ? 'bg-green-50 border-green-200 opacity-60 scale-95' :
                                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 ring-4 ring-indigo-100' :
                                            isWrong ? 'bg-red-50 border-red-300 animate-shake' :
                                                'bg-white border-slate-100 hover:border-indigo-300 hover:shadow-md'}
                                `}
                            >
                                <p className={`text-sm md:text-base font-medium leading-relaxed ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                                    {item.text}
                                </p>
                                {isMatched && <span className="absolute top-2 right-2 text-green-500">✅</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Right Column: Answers */}
                <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 pl-2">Cấu trúc biến đổi</p>
                    {rightItems.map(item => {
                        const isMatched = matches.includes(item.id);
                        const isSelected = selectedRight === item.id;
                        const isWrong = wrongMatch?.rightId === item.id;

                        return (
                            <button
                                key={`right-${item.id}`}
                                onClick={() => handleSelectRight(item.id)}
                                disabled={isMatched}
                                className={`w-full text-left p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 relative group
                                    ${isMatched ? 'bg-green-50 border-green-200 opacity-60 scale-95' :
                                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 ring-4 ring-indigo-100' :
                                            isWrong ? 'bg-red-50 border-red-300 animate-shake' :
                                                'bg-white border-slate-100 hover:border-indigo-300 hover:shadow-md'}
                                `}
                            >
                                <p className={`text-sm md:text-base font-bold leading-relaxed ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                    {item.text}
                                </p>
                                {isMatched && <span className="absolute top-2 right-2 text-green-500">✅</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
