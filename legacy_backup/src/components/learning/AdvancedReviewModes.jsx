import React, { useState, useEffect } from 'react';

// =======================
// MODE 1: CLOZE PARAGRAPH (Đục Lỗ Đoạn Văn)
// =======================
export const ClozeParagraphMode = ({ sentences, onBack }) => {
    const [tokens, setTokens] = useState([]);
    const [inputs, setInputs] = useState({});
    const [results, setResults] = useState({}); // { index: 'CORRECT' | 'WRONG' }
    const [isChecked, setIsChecked] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        // 1. Combine all text
        const fullText = sentences.map(s => s.content).join(" ");
        // 2. Tokenize (keeping punctuation separate or attached? Let's split by space)
        const rawTokens = fullText.split(/\s+/);

        // 3. Select random indices to hide (e.g., 20% of words)
        const totalWords = rawTokens.length;
        const numToHide = Math.max(3, Math.floor(totalWords * 0.2));
        const indicesToHide = new Set();
        while (indicesToHide.size < numToHide) {
            const idx = Math.floor(Math.random() * totalWords);
            // Verify token is a valid word (longer than 1 char, not punctuation)
            if (rawTokens[idx].length > 1 && !/^[.,!?;:"']+$/.test(rawTokens[idx])) {
                indicesToHide.add(idx);
            }
        }

        const processedTokens = rawTokens.map((t, i) => ({
            original: t,
            clean: t.replace(/[.,!?;:"']/g, "").toLowerCase(),
            isHidden: indicesToHide.has(i),
            punctuation: t.match(/[.,!?;:"']+$/)?.[0] || ""
        }));

        setTokens(processedTokens);
    }, [sentences]);

    const handleCheck = () => {
        let correctCount = 0;
        const newResults = {};

        tokens.forEach((t, i) => {
            if (t.isHidden) {
                const userVal = (inputs[i] || "").trim().toLowerCase();
                const correctVal = t.clean;
                if (userVal === correctVal) {
                    newResults[i] = 'CORRECT';
                    correctCount++;
                } else {
                    newResults[i] = 'WRONG';
                }
            }
        });

        setResults(newResults);
        setIsChecked(true);
        // Calculate score percentage
        const totalHidden = tokens.filter(t => t.isHidden).length;
        setScore(Math.round((correctCount / totalHidden) * 100));
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50 relative animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="bg-white/90 backdrop-blur-md border-b border-indigo-100 p-4 flex items-center justify-between z-20">
                <button onClick={onBack} className="text-slate-500 hover:text-indigo-600 font-bold transition flex items-center gap-2">← Thoát</button>
                <h2 className="text-lg font-bold text-indigo-900 border-b-2 border-indigo-500">Đục Lỗ Đoạn Văn</h2>
                <div className="w-20"></div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 max-w-4xl mx-auto w-full">
                <div className="bg-white p-8 md:p-12 rounded-4xl shadow-xl border border-slate-100 leading-loose text-lg md:text-xl text-slate-800 text-justify">
                    {tokens.map((token, i) => {
                        if (!token.isHidden) return <span key={i} className="mr-1.5">{token.original}</span>;

                        const status = results[i];
                        const isCorrect = status === 'CORRECT';

                        return (
                            <span key={i} className="inline-flex flex-col items-center mr-1.5 group relative align-middle">
                                <input
                                    type="text"
                                    className={`
                                        border-b-2 outline-none text-center font-bold font-mono px-1 py-0.5 w-24 md:w-32 transition-all
                                        ${!isChecked ? 'border-dashed border-slate-300 focus:border-indigo-600 bg-slate-50 focus:bg-white text-indigo-700' : ''}
                                        ${status === 'CORRECT' ? 'border-green-500 bg-green-50 text-green-700' : ''}
                                        ${status === 'WRONG' ? 'border-red-500 bg-red-50 text-red-600' : ''}
                                    `}
                                    value={inputs[i] || ""}
                                    onChange={(e) => !isChecked && setInputs(prev => ({ ...prev, [i]: e.target.value }))}
                                    disabled={isChecked}
                                    placeholder={isChecked && status === 'WRONG' ? token.clean : "?"}
                                />
                                {isChecked && status === 'WRONG' && (
                                    <span className="absolute -top-6 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold animate-pulse">
                                        {token.clean}
                                    </span>
                                )}
                                {token.punctuation && <span className="absolute -right-3 bottom-0.5">{token.punctuation}</span>}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-slate-100 flex justify-center z-20">
                {!isChecked ? (
                    <button onClick={handleCheck} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95">
                        Kiểm Tra Đáp Án
                    </button>
                ) : (
                    <div className="flex items-center gap-6 animate-slide-up">
                        <div className="text-center">
                            <span className="block text-xs uppercase text-slate-400 font-bold tracking-wider">Kết quả</span>
                            <span className={`text-3xl font-black ${score >= 80 ? 'text-green-500' : score >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                                {score}%
                            </span>
                        </div>
                        <button onClick={onBack} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all">
                            Hoàn Thành
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// =======================
// MODE 2: PARAGRAPH ASSEMBLY (Xếp Lại Đoạn Văn)
// =======================
export const ParagraphReorderMode = ({ sentences, onBack }) => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        // Init items with random order
        const mapped = sentences.map((s, i) => ({ id: s.id, content: s.content, originalIndex: i }));
        // Shuffle
        setItems(mapped.sort(() => Math.random() - 0.5));
    }, [sentences]);

    const [isCorrectVideo, setIsCorrectVideo] = useState(false);

    // Simple swap logic for drag-and-drop simulation (click to select, click to swap)
    const [selectedIdx, setSelectedIdx] = useState(null);

    const handleItemClick = (idx) => {
        if (selectedIdx === null) {
            setSelectedIdx(idx);
        } else {
            // Swap
            const newItems = [...items];
            const temp = newItems[selectedIdx];
            newItems[selectedIdx] = newItems[idx];
            newItems[idx] = temp;
            setItems(newItems);
            setSelectedIdx(null);

            // Check correctness instantly? Or wait? Let's check instantly for smooth feel or wait for button.
            // Let's verify with button to be safer.
        }
    };

    const handleCheck = () => {
        const currentOrder = items.map(i => i.originalIndex);
        // Correct if 0, 1, 2, 3...
        const isCorrect = currentOrder.every((val, i) => val === i);
        if (isCorrect) {
            setIsCorrectVideo(true);
            alert("Chính xác! Bạn đã khôi phục lại câu chuyện hoàn hảo. 🎉");
        } else {
            alert("Chưa đúng thứ tự rồi. Hãy thử lại nhé!");
        }
    };

    return (
        <div className="h-screen flex flex-col bg-indigo-50 relative animate-fade-in overflow-hidden">
            <div className="bg-white/90 backdrop-blur-md border-b border-indigo-100 p-4 flex items-center justify-between z-20">
                <button onClick={onBack} className="text-slate-500 hover:text-indigo-600 font-bold transition flex items-center gap-2">← Thoát</button>
                <h2 className="text-lg font-bold text-indigo-900 border-b-2 border-indigo-500">Xếp Lại Đoạn Văn</h2>
                <div className="w-20"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl mx-auto w-full space-y-3">
                <p className="text-center text-slate-500 mb-4 italic">Bấm vào một câu để chọn, rồi bấm vào vị trí khác để hoán đổi.</p>
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        onClick={() => handleItemClick(index)}
                        className={`
                            p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative group
                            ${selectedIdx === index
                                ? 'bg-indigo-100 border-indigo-500 shadow-indigo-200 shadow-lg scale-[1.02] z-10'
                                : 'bg-white border-transparent hover:border-indigo-200 shadow-sm hover:shadow-md'
                            }
                        `}
                    >
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-2xl opacity-20 pointer-events-none group-hover:text-indigo-200 transition-colors">
                            {index + 1}
                        </span>
                        <p className="pl-8 text-slate-700 font-medium leading-relaxed">{item.content}</p>
                    </div>
                ))}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex justify-center z-20">
                <button onClick={handleCheck} className="px-10 py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95">
                    Kiểm Tra Thứ Tự
                </button>
            </div>
        </div>
    );
};

// =======================
// MODE 3: ERROR HUNT (Tìm Lỗi Sai - Super Hard)
// =======================
export const ErrorHuntMode = ({ sentences, onBack }) => {
    const [mutatedSentences, setMutatedSentences] = useState([]);
    const [errors, setErrors] = useState([]); // Array of { sentenceIndex, tokenIndex, originalWord }
    const [foundErrors, setFoundErrors] = useState(new Set()); // Set of "sentenceIdx-tokenIdx" strings
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        // Strategy: For each sentence, randomly mutate 1 word (swap with neighbor or duplicate)
        const newMutated = [];
        const newErrors = [];

        sentences.forEach((s, sIdx) => {
            const tokens = s.content.split(/\s+/);
            // 50% chance to have an error in this sentence
            const hasError = Math.random() > 0.3;

            if (hasError && tokens.length > 3) {
                // Randomly choose mutation type: 
                // 1. Swap adjacent (common grammar mistake simulation)
                // 2. Duplicate word (stutter)
                const type = Math.random() > 0.5 ? 'SWAP' : 'DUPLICATE';
                const targetIdx = Math.floor(Math.random() * (tokens.length - 1));

                if (type === 'SWAP') {
                    // Swap targetIdx and targetIdx + 1
                    const temp = tokens[targetIdx];
                    tokens[targetIdx] = tokens[targetIdx + 1];
                    tokens[targetIdx + 1] = temp;

                    // Mark BOTH as errors conceptually, but let's just mark the first one for simplicity of click
                    newErrors.push({ sIdx, tIdx: targetIdx, type: 'SWAP' });
                    newErrors.push({ sIdx, tIdx: targetIdx + 1, type: 'SWAP' });
                } else {
                    // Duplicate
                    tokens.splice(targetIdx, 0, tokens[targetIdx]);
                    newErrors.push({ sIdx, tIdx: targetIdx, type: 'DUPLICATE' });
                }
            }

            newMutated.push(tokens);
        });

        setMutatedSentences(newMutated);
        setErrors(newErrors);
    }, [sentences]);

    const handleTokenClick = (sIdx, tIdx) => {
        if (isRevealed) return;

        const errorKey = `${sIdx}-${tIdx}`;
        // Check if this is an error
        const isError = errors.some(e => e.sIdx === sIdx && e.tIdx === tIdx);

        if (isError && !foundErrors.has(errorKey)) {
            // Found one!
            const newFound = new Set(foundErrors);
            newFound.add(errorKey);
            setFoundErrors(newFound);
        } else if (!isError) {
            // Shake effect or feedback?
            alert("Từ này đúng mà! Đừng bắt lỗi oan 😅");
        }
    };

    const handleReveal = () => {
        setIsRevealed(true);
    };

    const totalErrors = errors.length;
    const foundCount = foundErrors.size;

    return (
        <div className="h-screen flex flex-col bg-orange-50 relative animate-fade-in overflow-hidden">
            <div className="bg-white/90 backdrop-blur-md border-b border-orange-100 p-4 flex items-center justify-between z-20">
                <button onClick={onBack} className="text-slate-500 hover:text-orange-600 font-bold transition flex items-center gap-2">← Thoát</button>
                <h2 className="text-lg font-bold text-orange-900 border-b-2 border-orange-500">Săn Lỗi Sai (Super Hard)</h2>
                <div className="w-20"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 max-w-4xl mx-auto w-full">
                <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-orange-100 leading-loose text-lg md:text-xl text-slate-800 text-justify">
                    {mutatedSentences.map((tokens, sIdx) => (
                        <p key={sIdx} className="mb-4">
                            {tokens.map((word, tIdx) => {
                                const key = `${sIdx}-${tIdx}`;
                                const isFound = foundErrors.has(key);
                                const isMissed = isRevealed && errors.some(e => e.sIdx === sIdx && e.tIdx === tIdx) && !isFound;

                                return (
                                    <span
                                        key={tIdx}
                                        onClick={() => handleTokenClick(sIdx, tIdx)}
                                        className={`
                                            inline-block px-1 rounded cursor-pointer transition-all hover:bg-orange-100 mx-0.5
                                            ${isFound ? 'bg-green-200 text-green-800 font-bold line-through decoration-red-500' : ''}
                                            ${isMissed ? 'bg-red-200 text-red-800 font-bold border border-red-400' : ''}
                                        `}
                                    >
                                        {word}
                                    </span>
                                );
                            })}
                        </p>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center z-20">
                <div className="text-sm font-bold text-slate-500">
                    Đã tìm thấy: <span className="text-orange-600 text-xl">{foundCount}/{totalErrors}</span> lỗi
                </div>
                {!isRevealed ? (
                    <button onClick={handleReveal} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all">
                        Chấp nhận / Xem đáp án
                    </button>
                ) : (
                    <button onClick={onBack} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all">
                        Kết thúc
                    </button>
                )}
            </div>
        </div>
    );
};
