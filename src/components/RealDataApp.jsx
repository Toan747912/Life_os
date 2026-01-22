import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ClozeParagraphMode, ParagraphReorderMode, ErrorHuntMode } from './learning/AdvancedReviewModes';
import { DeepFocusMode } from './learning/DeepFocusMode';
import { TransformationMode } from './learning/TransformationMode';
import SettingsModal from './SettingsModal'; // Import settings modal

// =======================
// 1. SHARED & UTILS
// =======================
const speak = (text, rate = null) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    // Use global speech rate from localStorage if not specified
    const globalRate = localStorage.getItem('speechRate');
    utterance.rate = rate || (globalRate ? parseFloat(globalRate) : 1.0);

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US") || v.name.includes("Samantha"));
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
};

// Question Navigator (Glass Bar)
const QuestionNavigator = ({ total, current, onChange, statusMap = {} }) => {
    // Scroll to active item
    const scrollRef = useRef(null);
    useEffect(() => {
        if (scrollRef.current) {
            const activeEl = scrollRef.current.children[current];
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [current]);

    return (
        <div className="w-full shrink-0 z-30 flex flex-col items-center justify-center pb-4 pt-2 glass-panel border-t border-white/40 bg-white/60">
            {/* Legend - Minimalist */}
            <div className="flex gap-4 md:gap-6 text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Chưa làm</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-blue-500/50 shadow-[0_0_8px]"></span> Đang làm</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 shadow-green-500/50 shadow-[0_0_8px]"></span> Đúng</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 shadow-red-500/50 shadow-[0_0_8px]"></span> Sai</div>
            </div>

            <div ref={scrollRef} className="flex gap-2 overflow-x-auto px-4 py-2 w-full max-w-4xl mx-auto no-scrollbar mask-linear-fade snap-x">
                {Array.from({ length: total }).map((_, i) => {
                    const status = statusMap[i];
                    const isCurrent = i === current;

                    let baseClass = "snap-center w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 shrink-0 border-2 ";

                    if (status === 'CORRECT') baseClass += "bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/30";
                    else if (status === 'WRONG' || status === 'TIMEOUT') baseClass += "bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/30";
                    else if (isCurrent) baseClass += "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/40 scale-110 -translate-y-1 z-10";
                    else baseClass += "bg-white/50 border-white text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200";

                    return (
                        <button key={i} onClick={() => onChange(i)} className={baseClass}>
                            {i + 1}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// Ready Overlay (Glassmorphism & Animated)
const ReadyScreen = ({ onReady, sentenceIndex, level = 1, onLevelChange = () => console.warn("Missing onLevelChange") }) => {
    const descriptions = {
        1: "🌟 Khởi động: Thời gian thoải mái",
        2: "🔥 Tăng tốc: Giới hạn thời gian chuẩn",
        3: "⚡ Áp lực: Thời gian cực ngắn!",
        4: "🎧 Thính giác: Giới hạn nghe lại từ"
    };

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center animate-fade-in p-6 bg-slate-900/20 backdrop-blur-sm">
            <div className="glass-panel p-10 rounded-[3rem] shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col items-center animate-slide-up">

                {/* Decorative Background Blobs */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

                <h2 className="text-5xl font-extrabold gradient-text mb-2 tracking-tighter relative z-10">Câu {sentenceIndex + 1}</h2>
                <p className="text-slate-500 mb-8 font-medium relative z-10 text-lg">Chọn mức độ thử thách:</p>

                {/* Level Selector */}
                <div className="flex gap-4 justify-center mb-8 relative z-10">
                    {[1, 2, 3, 4].map(l => (
                        <button key={l} onClick={() => onLevelChange(l)}
                            className={`w-16 h-16 rounded-2xl font-bold text-2xl transition-all border flex items-center justify-center relative overflow-hidden group
                            ${level === l ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-110 shadow-indigo-300' : 'bg-white/50 border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600'}`}>
                            {level === l && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                            {l}
                        </button>
                    ))}
                </div>

                {/* Level Description */}
                <div className="mb-10 relative z-10 h-8 flex items-center justify-center">
                    <span key={level} className="text-indigo-600 font-bold bg-indigo-50/80 px-6 py-2 rounded-full text-sm animate-fade-in border border-indigo-100 shadow-sm">
                        {descriptions[level]}
                    </span>
                </div>

                <button onClick={onReady} className="w-full py-5 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-xl relative z-10 overflow-hidden group">
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                    Sẵn sàng! 🚀
                </button>
            </div>
        </div>
    );
};

// Main Layout Wrapper
const GameLayout = ({ children, navigator, onBack }) => (
    <div className="flex flex-col h-screen font-sans overflow-hidden relative selection:bg-indigo-100 selection:text-indigo-700 bg-slate-50">

        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-linear-to-br from-indigo-50 via-white to-purple-50 opacity-60 -z-20"></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[60vh] h-[60vh] bg-purple-300/20 rounded-full blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vh] h-[60vh] bg-indigo-300/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '3s' }}></div>
        </div>

        {/* Top Bar - Fixed Height */}
        <div className="h-16 shrink-0 flex items-center justify-between px-4 md:px-8 z-20 border-b border-white/40 bg-white/30 backdrop-blur-sm">
            <button onClick={onBack} className="group flex items-center gap-2 text-slate-500 hover:text-red-500 font-bold transition-all px-3 py-1.5 rounded-xl hover:bg-red-50">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> <span>Thoát</span>
            </button>
            <div className="hidden md:block font-bold text-slate-400 tracking-widest uppercase text-[10px] bg-white/60 px-3 py-1 rounded-full border border-white/50 shadow-sm">Learning Station</div>
        </div>

        {/* Main Content (Occupies remaining space, centered) */}
        <div className="flex-1 flex flex-col justify-center items-center relative z-10 overflow-y-auto px-4 py-2 w-full">
            {children}
        </div>

        {/* Bottom Navigator - Fixed Height */}
        {navigator}
    </div>
);

// =======================
// 2A. LISTEN MODE
// =======================
const ListenMode = ({ sentences, onBack }) => {
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        if (sentences[idx]) speak(sentences[idx].content);
    }, [idx, sentences]);

    if (!sentences || sentences.length === 0) return <div>No data</div>;
    const s = sentences[idx];

    return (
        <GameLayout onBack={onBack}
            navigator={<QuestionNavigator total={sentences.length} current={idx} onChange={setIdx} />}
        >
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center h-full max-h-[70vh]">
                <div className="w-full glass-panel rounded-4xl shadow-xl p-6 md:p-10 text-center relative flex flex-col items-center justify-between h-full bg-white/80">
                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-400 to-indigo-500"></div>

                    <h2 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 shrink-0">Luyện Nghe Thụ Động</h2>

                    <div className="flex-1 flex items-center justify-center w-full overflow-y-auto custom-scrollbar my-2">
                        <p className="text-2xl md:text-4xl font-medium text-slate-800 leading-snug font-serif tracking-wide px-2 drop-shadow-sm text-balance">
                            "{s.content}"
                        </p>
                    </div>

                    <div className="shrink-0 mt-6 md:mt-10 pb-2">
                        <button onClick={() => speak(s.content)}
                            className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-linear-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-xl shadow-indigo-300 hover:scale-110 active:scale-95 transition-all mx-auto animate-pulse-soft group border-4 border-white/20">
                            <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform">🔊</span>
                        </button>
                        <p className="text-xs text-slate-400 mt-3 font-medium">Nghe lại</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-6 shrink-0 z-20">
                    <button onClick={() => idx > 0 && setIdx(i => i - 1)} disabled={idx === 0} className="w-12 h-12 rounded-full glass-panel border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-white hover:text-indigo-600 hover:shadow-lg disabled:opacity-30 disabled:pointer-events-none transition-all">←</button>
                    <div className="text-slate-500 font-mono font-bold text-sm bg-white/50 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/60">{String(idx + 1).padStart(2, '0')} / {sentences.length}</div>
                    <button onClick={() => idx < sentences.length - 1 && setIdx(i => i + 1)} disabled={idx === sentences.length - 1} className="w-12 h-12 rounded-full glass-panel border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-white hover:text-indigo-600 hover:shadow-lg disabled:opacity-30 disabled:pointer-events-none transition-all">→</button>
                </div>
            </div>
        </GameLayout>
    );
};

// =======================
// 2B. FILL MODE
// =======================
const FillMode = ({ sentences, onBack }) => {
    const [idx, setIdx] = useState(0);
    const [hiddenIndex, setHiddenIndex] = useState(-1);
    const [words, setWords] = useState([]);
    const [input, setInput] = useState("");
    const [status, setStatus] = useState("PENDING");
    const [progressMap, setProgressMap] = useState({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (sentences[idx]) {
            const w = sentences[idx].content.split(/\s+/);
            setWords(w);
            const candidates = w.map((x, i) => ({ w: x, i })).filter(x => x.w.length > 2);
            const target = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : { i: 0 };
            setHiddenIndex(target.i);
            setInput("");
            setStatus(progressMap[idx] || "PENDING");
        }
    }, [idx, sentences]);

    const check = () => {
        setProcessing(true);
        setTimeout(() => {
            const correctWord = words[hiddenIndex].replace(/[.,!?;:]/g, "");
            if (input.trim().toLowerCase() === correctWord.toLowerCase()) {
                speak("Correct"); setStatus("CORRECT");
                setProgressMap(prev => ({ ...prev, [idx]: 'CORRECT' }));
            } else {
                speak("Try again"); setStatus("WRONG");
                setProgressMap(prev => ({ ...prev, [idx]: 'WRONG' }));
            }
            setProcessing(false);
        }, 600);
    };

    return (
        <GameLayout onBack={onBack}
            navigator={<QuestionNavigator total={sentences.length} current={idx} onChange={setIdx} statusMap={progressMap} />}
        >
            <div className="w-full max-w-4xl mx-auto flex flex-col justify-center items-center h-full p-4">
                <div className="w-full glass-panel rounded-4xl shadow-xl p-8 md:p-12 text-center relative overflow-hidden transition-all duration-300 bg-white/90 border-t-8 border-orange-400 flex flex-col">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mb-8 md:mb-12">Điền Từ Vào Chỗ Trống</h2>

                    <div className="text-2xl md:text-4xl font-medium text-slate-800 leading-loose flex flex-wrap justify-center gap-x-3 gap-y-4 items-baseline mb-12">
                        {words.map((w, i) => {
                            if (i === hiddenIndex && status !== 'CORRECT') {
                                return (
                                    <span key={i} className="relative inline-block mx-1">
                                        <input
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && check()}
                                            className="border-b-4 border-orange-400 outline-none text-center text-orange-600 font-bold w-32 md:w-40 bg-orange-50 focus:bg-white focus:border-orange-500 transition-all placeholder-orange-200 rounded-t-lg px-2 shadow-inner"
                                            autoFocus
                                            placeholder="..."
                                        />
                                        <div className="absolute -bottom-6 left-0 w-full text-center text-[10px] text-orange-400 font-bold uppercase tracking-wider">Type here</div>
                                    </span>
                                )
                            }
                            return <span key={i} className={`transition-all duration-500 ${i === hiddenIndex ? "text-green-600 font-bold scale-110 drop-shadow-sm" : "opacity-90"}`}>{w}</span>
                        })}
                    </div>

                    <div className="flex justify-center mt-auto">
                        {status !== 'CORRECT' ? (
                            <button onClick={check} disabled={processing} className={`px-10 py-4 text-white rounded-xl font-bold shadow-xl transition-all text-lg flex items-center gap-2 ${processing ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 shadow-slate-300 hover:bg-black hover:scale-105 hover:shadow-2xl'}`}>
                                <span>{processing ? 'Đang xử lý...' : 'Kiểm tra'}</span>
                                {!processing && <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white/80">Enter</span>}
                            </button>
                        ) : (
                            <button onClick={() => idx < sentences.length - 1 ? setIdx(idx + 1) : alert("Hoàn thành!")} className="px-10 py-4 bg-green-500 text-white rounded-xl font-bold shadow-xl shadow-green-200 hover:bg-green-600 hover:scale-105 transition-all text-lg animate-bounce-in">
                                Câu tiếp theo ➜
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </GameLayout>
    );
};

// =======================
// 2C. REORDER ENGINE (SYMMETRICAL)
// =======================
const ReorderGameEngine = ({ lessonId, onBack, isReview = false }) => {
    const [level, setLevel] = useState(1);
    const [loading, setLoading] = useState(true);
    const [sentences, setSentences] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [processing, setProcessing] = useState(false);

    const [gameData, setGameData] = useState({ pool: [], chosen: [], status: 'PENDING', correctAnswer: null });
    const [isReady, setIsReady] = useState(false);
    const [statusMap, setStatusMap] = useState({});
    const [timeLeft, setTimeLeft] = useState(60);
    const [audioCount, setAudioCount] = useState(0);
    const timerRef = useRef(null);

    const saveProgress = useCallback((forceStatus) => {
        if (!sentences[currentIdx]) return;
        const payload = {
            lessonId, sentenceId: sentences[currentIdx].id, selectedLevel: level,
            status: forceStatus || gameData.status, currentArrangement: gameData.chosen, timeRemaining: timeLeft, audioCount
        };
        fetch(`${API_URL}/study/save-progress`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        setStatusMap(prev => ({ ...prev, [currentIdx]: forceStatus || gameData.status }));
    }, [lessonId, level, sentences, currentIdx, gameData, timeLeft, audioCount]);

    useEffect(() => {
        setLoading(true);
        const endpoint = isReview
            ? `${API_URL}/study/review/${lessonId}?level=${level}`
            : `${API_URL}/study/init/${lessonId}?level=${level}`;

        fetch(endpoint)
            .then(res => res.json()).then(data => { setSentences(data.sentences); setCurrentIdx(0); setLoading(false); setStatusMap({}); })
            .catch(err => setLoading(false));
    }, [lessonId, level, isReview]);

    useEffect(() => {
        if (!sentences[currentIdx]) return;
        setGameData({ pool: [...sentences[currentIdx].shuffled_words], chosen: [], status: 'PENDING', correctAnswer: null });
        setTimeLeft(sentences[currentIdx].time_limit); setAudioCount(0); setIsReady(false);
    }, [currentIdx, sentences]);

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (isReady && gameData.status === 'PENDING' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(p => { if (p <= 1) { handleTimeout(); return 0; } return p - 1; });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [gameData.status, currentIdx, isReady]);

    const handleTimeout = () => { setGameData(p => ({ ...p, status: 'TIMEOUT' })); saveProgress('TIMEOUT'); };

    const handleWordClick = (word, index, fromPool) => {
        if (gameData.status !== 'PENDING') return;
        if (fromPool && !(level === 4 && audioCount >= 1)) { speak(word); if (level === 4) setAudioCount(c => c + 1); }
        const newPool = [...gameData.pool]; const newChosen = [...gameData.chosen];
        if (fromPool) { newPool.splice(index, 1); newChosen.push(word); } else { newChosen.splice(index, 1); newPool.push(word); }
        setGameData(p => ({ ...p, pool: newPool, chosen: newChosen }));
    };

    const handleSubmit = async () => {
        if (gameData.status !== 'PENDING') {
            if (currentIdx < sentences.length - 1) setCurrentIdx(i => i + 1); else alert("Hoàn thành bài học!");
            return;
        }

        setProcessing(true);
        try {
            // Artificial delay for UX
            await new Promise(r => setTimeout(r, 600));
            const res = await fetch(`${API_URL}/study/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sentenceId: sentences[currentIdx].id, finalArrangement: gameData.chosen, level }) });
            const result = await res.json();
            const status = result.isCorrect ? 'CORRECT' : 'WRONG';
            speak(result.isCorrect ? "Correct!" : "Wrong!");
            setGameData(p => ({ ...p, status, correctAnswer: result.correctAnswer }));
            saveProgress(status);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-slate-400">Loading...</div>;
    if (sentences.length === 0) return (
        <div className="h-screen flex flex-col items-center justify-center text-slate-500 gap-4">
            <p className="text-xl font-bold">{isReview ? 'Bạn chưa có câu nào sai để ôn tập! 🎉' : 'Bài học chưa có dữ liệu.'}</p>
            <button onClick={onBack} className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Quay lại</button>
        </div>
    );
    if (!sentences[currentIdx]) return <div>Empty</div>;

    return (
        <GameLayout onBack={onBack}
            navigator={<QuestionNavigator total={sentences.length} current={currentIdx} onChange={setCurrentIdx} statusMap={statusMap} />}
        >
            {/* Ready Overlay */}
            {!isReady && <ReadyScreen sentenceIndex={currentIdx} onReady={() => setIsReady(true)} level={level} onLevelChange={setLevel} />}

            {/* Toolbar - Floating better */}
            <div className="flex justify-center mb-4 z-20">
                <div className="bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-white/50 p-1.5 flex items-center gap-4 px-4 pl-2">
                    <div className="flex bg-slate-100 rounded-full p-1">
                        {[1, 2, 3, 4].map(l => (
                            <button key={l} onClick={() => setLevel(l)}
                                className={`w-8 h-8 rounded-full font-bold text-xs transition-all ${level === l ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                    <div className="w-px h-6 bg-slate-200"></div>
                    <div className={`font-mono font-bold text-lg w-14 text-center ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                    </div>
                </div>
            </div>

            {/* Workspace */}
            <div className={`flex-1 flex flex-col items-center justify-between w-full max-w-4xl mx-auto transition-all duration-500 pb-2 ${!isReady ? 'blur-sm opacity-30 scale-95 pointer-events-none' : 'scale-100'}`}>

                {/* Drop Zone - More tactile */}
                <div className={`w-full min-h-[160px] p-6 md:p-8 rounded-4xl border-2 border-dashed transition-all duration-300 flex flex-wrap gap-3 content-start items-start justify-center shadow-inner
                 ${gameData.status === 'CORRECT' ? 'bg-green-50 border-green-300' : gameData.status === 'WRONG' ? 'bg-red-50 border-red-300' : 'bg-white/60 border-indigo-200/60 hover:border-indigo-300 hover:bg-white/80'}
             `}>
                    {gameData.chosen.length === 0 && gameData.status === 'PENDING' && (
                        <div className="text-slate-300 font-bold text-xl flex flex-col items-center justify-center h-24">
                            <span className="text-4xl mb-2 opacity-50">⤵</span>
                            <span>Sắp xếp từ vào đây</span>
                        </div>
                    )}
                    {gameData.chosen.map((w, i) => (
                        <button key={i} onClick={() => handleWordClick(w, i, false)} disabled={gameData.status !== 'PENDING' || !isReady}
                            className="px-4 py-2 md:px-6 md:py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-300/50 hover:scale-105 active:scale-95 transition-all text-base md:text-lg animate-fade-in">
                            {w}
                        </button>
                    ))}
                </div>

                {/* Pool - Bottom aligned for easier reach */}
                {gameData.status === 'PENDING' && (
                    <div className="w-full flex flex-wrap gap-2 md:gap-3 justify-center content-center py-6 min-h-[120px]">
                        {gameData.pool.map((w, i) => (
                            <button key={i} onClick={() => handleWordClick(w, i, true)} disabled={!isReady}
                                className="px-4 py-2 md:px-5 md:py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium shadow-sm hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all text-base md:text-lg">
                                {w}
                            </button>
                        ))}
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex gap-4 w-full justify-center mt-auto">
                    <button onClick={handleSubmit} disabled={!isReady || processing}
                        className={`w-full max-w-xs py-4 rounded-2xl font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]
                         ${!isReady || processing ? 'bg-slate-300 cursor-not-allowed' : gameData.status === 'PENDING' ? 'bg-slate-900 shadow-slate-300' : gameData.status === 'CORRECT' ? 'bg-green-500 shadow-green-200' : 'bg-orange-500 shadow-orange-200'}
                     `}>
                        {processing ? 'Đang xử lý...' : (gameData.status === 'PENDING' ? 'Kiểm tra' : 'Tiếp theo ➜')}
                    </button>
                </div>

                {/* Result Feedback Floating */}
                {gameData.correctAnswer && (
                    <div className="absolute inset-x-0 bottom-24 flex justify-center pointer-events-none">
                        <div className="bg-white/95 backdrop-blur-xl px-8 py-6 rounded-3xl shadow-2xl border border-slate-200 flex flex-col items-center animate-slide-up pointer-events-auto max-w-lg mx-4 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Đáp án đúng là:</p>
                            <p className="text-lg md:text-xl font-bold text-slate-800 leading-snug">{gameData.correctAnswer}</p>
                        </div>
                    </div>
                )}
            </div>
        </GameLayout>
    );
};

/* =======================
   2D. READ MODE (Simple Centered)
   ======================= */
const ReadMode = ({ sentences, onBack }) => (
    <div className="flex flex-col h-screen bg-white font-sans text-slate-800">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-20">
            <button onClick={onBack} className="text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-2 transition px-4 py-2 hover:bg-slate-50 rounded-xl">← Quay lại</button>
            <h2 className="text-xl font-bold text-slate-800">Chi tiết bài học</h2>
            <div className="w-24"></div>
        </div>
        <div className="flex-1 overflow-y-auto w-full bg-slate-50/50">
            <div className="max-w-4xl mx-auto p-8 md:p-12 space-y-4">
                {sentences.map((s, i) => (
                    <div key={s.id} onClick={() => speak(s.content)}
                        className="group bg-white p-6 md:p-8 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer flex gap-5 items-start relative overflow-hidden">
                        <span className="text-sm font-bold text-slate-300 mt-1.5 min-w-6 group-hover:text-indigo-400 transition-colors">{String(i + 1).padStart(2, '0')}</span>
                        <p className="text-xl leading-relaxed text-slate-700 group-hover:text-slate-900 transition-colors font-medium">{s.content}</p>
                        <button className="ml-auto w-10 h-10 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">🔊</button>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// =======================
// 3. MAIN APP
// =======================
// --- CONFIGURATION ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
console.log(`[RealDataApp] Using API_URL: ${API_URL}`);

export default function RealDataApp() {
    const [view, setView] = useState('DASHBOARD');
    const [lessons, setLessons] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [lessonData, setLessonData] = useState([]);

    // Create/Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [currentLessonId, setCurrentLessonId] = useState(null);
    const [newTitle, setNewTitle] = useState("");
    const [newText, setNewText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [transformationSubMode, setTransformationSubMode] = useState('REORDER'); // 'REORDER' | 'HANDWRITING'
    const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Settings modal state

    // STRUCTURED INPUT STATE
    const [inputMode, setInputMode] = useState('TEXT'); // TEXT | STRUCTURED
    const [structuredRows, setStructuredRows] = useState([{ context: '', prompt: '', answer: '', distractors: '' }]);

    const addRow = () => setStructuredRows([...structuredRows, { context: '', prompt: '', answer: '', distractors: '' }]);
    const removeRow = (i) => {
        const newRows = [...structuredRows];
        newRows.splice(i, 1);
        setStructuredRows(newRows);
    };
    const updateRow = (i, field, val) => {
        const newRows = [...structuredRows];
        newRows[i][field] = val;
        setStructuredRows(newRows);
    };

    const fetchLessons = useCallback(() => {
        setIsFetching(true);
        fetch(`${API_URL}/lessons`)
            .then(r => {
                if (!r.ok) throw new Error("Server error");
                return r.json();
            })
            .then(data => {
                if (Array.isArray(data)) setLessons(data);
                else console.error("Invalid data format:", data);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                console.error("Failed to fetch lessons from:", `${API_URL}/lessons`);
            })
            .finally(() => setIsFetching(false));
    }, []);

    // Filter Logic
    const standardLessons = lessons.filter(l => l.type !== 'TRANSFORMATION');
    const transformationLessons = lessons.filter(l => l.type === 'TRANSFORMATION');

    // Group Transformation Lessons by Title
    const groupedTransformationLessons = transformationLessons.reduce((acc, lesson) => {
        const existing = acc.find(g => g.title === lesson.title);
        if (existing) {
            existing.lessonIds.push(lesson.id);
            existing.count++;
        } else {
            acc.push({
                title: lesson.title,
                lessonIds: [lesson.id],
                count: 1,
                type: 'TRANSFORMATION',
                // Keep first lesson's id as representative
                id: lesson.id
            });
        }
        return acc;
    }, []);

    useEffect(() => {
        if (view === 'DASHBOARD') {
            fetchLessons();
        }
    }, [view, fetchLessons]);

    const selectLesson = (l) => {
        setSelectedLesson(l);

        // If it's a grouped transformation lesson, fetch all sentences from all lessons with that title
        if (l.lessonIds && l.lessonIds.length > 1) {
            Promise.all(l.lessonIds.map(id => fetch(`${API_URL}/lessons/${id}`).then(r => r.json())))
                .then(results => {
                    const combinedSentences = results.flat();
                    setLessonData(combinedSentences);
                    setView('DETAIL');
                });
        } else {
            // Standard single lesson fetch
            const lessonId = l.lessonIds ? l.lessonIds[0] : l.id;
            fetch(`${API_URL}/lessons/${lessonId}`)
                .then(r => r.json())
                .then(d => {
                    setLessonData(d);
                    setView('DETAIL');
                });
        }
    };

    const handleGenerateDistractors = async (index) => {
        const row = structuredRows[index];
        if (!row.answer) return alert("Vui lòng nhập 'Đáp án' trước để AI phân tích!");

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/generate-distractors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sentence: row.answer, prompt: row.prompt })
            });
            const data = await res.json();
            if (data.distractors) {
                updateRow(index, 'distractors', data.distractors.join(', '));
            }
        } catch (e) {
            alert("Lỗi AI: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateOrUpdate = async () => {
        if (!newTitle) return alert("Nhập tiêu đề!");
        if (inputMode === 'TEXT' && !newText) return alert("Nhập nội dung!");
        if (inputMode === 'STRUCTURED' && structuredRows.every(r => !r.answer)) return alert("Nhập ít nhất một câu!");

        if (isLoading) return;

        setIsLoading(true);
        try {
            if (inputMode === 'STRUCTURED') {
                // STRUCTURED SAVE (TRANSFORMATION)
                const payload = {
                    title: newTitle,
                    sentences: structuredRows.filter(r => r.answer).map(r => ({
                        content: r.answer,
                        prompt: r.prompt,
                        context: r.context,
                        distractors: r.distractors.split(',').map(s => s.trim()).filter(s => s)
                    }))
                };

                if (isEditing) {
                    // UPDATE: Delete all old lessons with this title, then create new one
                    // This handles grouped lessons - all lessons with same title will be replaced
                    const lessonsToDelete = transformationLessons.filter(l => l.title === newTitle);

                    // Delete all lessons with the same title
                    await Promise.all(lessonsToDelete.map(l =>
                        fetch(`${API_URL}/lessons/${l.id}`, { method: 'DELETE' })
                    ));

                    // Create new lesson with updated content
                    const res = await fetch(`${API_URL}/structured-lesson`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw new Error("Failed to update structured lesson");
                } else {
                    // CREATE: Simple POST
                    const res = await fetch(`${API_URL}/structured-lesson`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw new Error("Failed to save structured lesson");
                }

            } else {
                // STANDARD TEXT SAVE
                const method = isEditing ? 'PUT' : 'POST';
                const url = isEditing ? `${API_URL}/lessons/${currentLessonId}` : `${API_URL}/lessons`;

                const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: newTitle, text: newText })
                });

                if (!res.ok) throw new Error("Failed to save");
            }

            setView('DASHBOARD');
            setNewTitle("");
            setNewText("");
            setNewTitle("");
            setNewText("");
            setStructuredRows([{ context: '', prompt: '', answer: '', distractors: '' }]);
            setIsEditing(false);
            setIsEditing(false);
            setCurrentLessonId(null);
            fetchLessons(); // Refresh list
        } catch (error) {
            alert("Có lỗi xảy ra: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Prevent card click
        if (!window.confirm("Bạn có chắc chắn muốn xóa bài học này?")) return;
        if (isLoading) return;

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/lessons/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed to delete");
            fetchLessons(); // Refresh list
        } catch (error) {
            alert("Có lỗi xóa bài: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const startEdit = (e, lesson) => {
        e.stopPropagation();
        setNewTitle(lesson.title);
        // Note: We don't have the full text here, assuming user wants to rewrite or we need to fetch it.
        // For now, let's leave text empty or fetch it first.
        // Better UX: Fetch sentences and join them, OR just let user know old content is replaced.
        // Simple approach for now: Leave text empty but warn user, OR fetch data.
        // Let's try to fetch data to fill it if possible, but our GET /lessons/:id returns sentences.
        // We will just let user enter new text or keep it empty (if backend supports partial update, but our backend replaces).
        // Let's set a placeholder or fetch.

        setIsLoading(true);
        fetch(`${API_URL}/lessons/${lesson.id}`)
            .then(r => r.json())
            .then(sentences => {
                const reconstructedText = sentences.map(s => s.content).join("\n");
                setNewText(reconstructedText);
                setIsEditing(true);
                setCurrentLessonId(lesson.id);
                setInputMode('TEXT'); // Force text mode for standard lessons
                setView('CREATE');
            })
            .catch(err => {
                console.error(err);
                alert("Không thể tải nội dung bài học để sửa.");
            })
            .finally(() => setIsLoading(false));
    };

    const startEditTransformation = (e, lesson) => {
        e.stopPropagation();
        setNewTitle(lesson.title);
        setIsLoading(true);

        fetch(`${API_URL}/lessons/${lesson.id}`)
            .then(r => r.json())
            .then(sentences => {
                // Load sentences into structured rows
                const rows = sentences.map(s => ({
                    context: s.context || '',
                    prompt: s.prompt || '',
                    answer: s.content || '',
                    distractors: Array.isArray(s.distractors)
                        ? s.distractors.join(', ')
                        : (typeof s.distractors === 'string' ? JSON.parse(s.distractors).join(', ') : '')
                }));

                setStructuredRows(rows);
                setIsEditing(true);
                setCurrentLessonId(lesson.id);
                setInputMode('STRUCTURED'); // Force structured mode for transformation
                setView('CREATE');
            })
            .catch(err => {
                console.error(err);
                alert("Không thể tải nội dung bài học để sửa.");
            })
            .finally(() => setIsLoading(false));
    };

    const resetCreate = () => {
        setView('DASHBOARD');
        setIsEditing(false);
        setCurrentLessonId(null);
        setNewTitle("");
        setNewText("");
        setStructuredRows([{ prompt: '', answer: '', distractors: '' }]);
        setInputMode('TEXT');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-700 relative overflow-hidden">
            {/* Global Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm animate-fade-in">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-indigo-600 font-bold text-lg animate-pulse">Đang xử lý...</p>
                    </div>
                </div>
            )}

            {/* Global Animated Background for Dashboard/Create Views */}
            <div className="absolute inset-0 bg-linear-to-br from-indigo-50/40 via-white to-purple-50/40 -z-20"></div>
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[10%] right-[10%] w-[60vh] h-[60vh] bg-indigo-300/10 rounded-full blur-[100px] animate-float"></div>
                <div className="absolute bottom-[10%] left-[10%] w-[50vh] h-[50vh] bg-purple-300/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '4s' }}></div>
            </div>

            {view === 'DASHBOARD' && (
                <div className="w-full max-w-7xl mx-auto p-4 md:p-8 relative z-10 animate-fade-in flex flex-col h-screen">
                    <header className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 gap-4 shrink-0">
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-2 gradient-text filter drop-shadow-sm">Learning Station</h1>
                            <p className="text-slate-500 text-base md:text-lg font-medium opacity-80">Nền tảng học tập thông minh & hiện đại</p>
                        </div>
                        <div className="flex gap-3">
                            {/* Settings Button */}
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-4 rounded-2xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                                title="Settings"
                            >
                                <span className="text-2xl">⚙️</span>
                            </button>
                            {/* New Lesson Button */}
                            <button onClick={() => { setIsEditing(false); setNewTitle(""); setNewText(""); setView('CREATE'); }} className="bg-slate-900 text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold shadow-xl shadow-slate-300 hover:scale-105 active:scale-95 transition-all text-sm md:text-lg flex items-center gap-2 group hover:bg-black">
                                <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">+</span>
                                <span className="group-hover:translate-x-1 transition-transform">Bài học mới</span>
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar space-y-12">
                        {isFetching ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                                <p className="animate-pulse font-medium">Đang tải bài học...</p>
                            </div>
                        ) : lessons.length === 0 ? (
                            <div className="text-center py-20 opacity-50">
                                <p className="text-xl font-medium">Chưa có bài học nào</p>
                                <p className="text-sm">Bấm "Bài học mới" để bắt đầu nhe!</p>
                            </div>
                        ) : (
                            <>
                                {/* STANDARD LESSONS SECTION */}
                                {standardLessons.length > 0 && (
                                    <div className="px-2">
                                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                            <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl text-xl">📚</span>
                                            Tài Liệu Học Tập
                                            <span className="text-sm font-normal text-slate-400 ml-2 bg-slate-100 px-3 py-1 rounded-full">{standardLessons.length}</span>
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                            {standardLessons.map(l => (
                                                <div key={l.id} onClick={() => selectLesson(l)} className="glass-panel p-6 md:p-8 rounded-4xl shadow-sm hover:shadow-[0_20px_60px_rgba(99,102,241,0.25)] hover:-translate-y-2 hover:border-indigo-300 transition-all duration-500 cursor-pointer relative overflow-hidden group bg-white/40">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-indigo-500/10 to-transparent rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors duration-500"></div>
                                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-linear-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors duration-500"></div>

                                                    <div className="relative z-10 flex flex-col h-full">
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="w-14 h-14 rounded-2xl bg-white border border-white/80 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md transition-all">
                                                                📝
                                                            </div>
                                                            <div className="flex gap-2 transition-opacity">
                                                                <button
                                                                    onClick={(e) => startEdit(e, l)}
                                                                    className="p-2 bg-white/50 hover:bg-white text-blue-600 rounded-xl hover:shadow-md transition-all"
                                                                    title="Sửa"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDelete(e, l.id)}
                                                                    className="p-2 bg-white/50 hover:bg-white text-red-500 rounded-xl hover:shadow-md transition-all"
                                                                    title="Xóa"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <h3 className="font-bold text-xl md:text-2xl text-slate-800 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-700 transition-colors">{l.title}</h3>
                                                        <div className="mt-auto pt-6 flex items-center gap-2 text-slate-400 text-xs md:text-sm font-bold group-hover:text-indigo-600 transition-colors uppercase tracking-wider">
                                                            <span>Bắt đầu học</span>
                                                            <span className="group-hover:translate-x-2 transition-transform">➜</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* TRANSFORMATION LESSONS SECTION */}
                                {/* TRANSFORMATION LESSONS SECTION */}
                                <div className="px-2 pt-8 border-t border-slate-200/60">
                                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                        <span className="bg-pink-100 text-pink-600 p-2 rounded-xl text-xl">🪄</span>
                                        Luyện Biến Đổi Câu
                                        <span className="text-sm font-normal text-slate-400 ml-2 bg-slate-100 px-3 py-1 rounded-full">{groupedTransformationLessons.length}</span>
                                    </h2>

                                    {groupedTransformationLessons.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-4 text-slate-400 grayscale opacity-50">🪄</div>
                                            <p className="text-slate-500 font-medium text-lg">Chưa có bài tập biến đổi câu nào</p>
                                            <p className="text-slate-400 text-sm mt-1">Các bài học có cấu trúc "Biến đổi câu" sẽ xuất hiện ở đây.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                            {groupedTransformationLessons.map((group, idx) => (
                                                <div key={`group-${idx}`} onClick={() => selectLesson(group)} className="glass-panel p-6 md:p-8 rounded-4xl shadow-sm hover:shadow-[0_20px_60px_rgba(236,72,153,0.25)] hover:-translate-y-2 hover:border-pink-300 transition-all duration-500 cursor-pointer relative overflow-hidden group bg-white/40">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-pink-500/10 to-transparent rounded-full blur-2xl group-hover:bg-pink-500/20 transition-colors duration-500"></div>

                                                    <div className="relative z-10 flex flex-col h-full">
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-white/80 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-md transition-all text-pink-500">
                                                                ⚡
                                                            </div>
                                                            {/* Show edit/delete for all grouped cards */}
                                                            <div className="flex gap-2 transition-opacity">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // For grouped lessons, load all sentences from all lessons in the group
                                                                        if (group.count > 1) {
                                                                            setIsLoading(true);
                                                                            Promise.all(group.lessonIds.map(id => fetch(`${API_URL}/lessons/${id}`).then(r => r.json())))
                                                                                .then(results => {
                                                                                    const allSentences = results.flat();
                                                                                    const rows = allSentences.map(s => ({
                                                                                        context: s.context || '',
                                                                                        prompt: s.prompt || '',
                                                                                        answer: s.content || '',
                                                                                        distractors: Array.isArray(s.distractors)
                                                                                            ? s.distractors.join(', ')
                                                                                            : (typeof s.distractors === 'string' ? JSON.parse(s.distractors).join(', ') : '')
                                                                                    }));
                                                                                    setStructuredRows(rows);
                                                                                    setNewTitle(group.title);
                                                                                    setIsEditing(true);
                                                                                    setCurrentLessonId(group.lessonIds[0]); // Use first lesson ID as reference
                                                                                    setInputMode('STRUCTURED');
                                                                                    setView('CREATE');
                                                                                })
                                                                                .catch(err => {
                                                                                    console.error(err);
                                                                                    alert("Không thể tải nội dung nhóm bài học.");
                                                                                })
                                                                                .finally(() => setIsLoading(false));
                                                                        } else {
                                                                            // Single lesson - use existing logic
                                                                            const originalLesson = transformationLessons.find(l => l.id === group.lessonIds[0]);
                                                                            startEditTransformation(e, originalLesson);
                                                                        }
                                                                    }}
                                                                    className="p-2 bg-white/50 hover:bg-white text-blue-600 rounded-xl hover:shadow-md transition-all"
                                                                    title="Sửa"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // Delete all lessons in the group
                                                                        if (!window.confirm(`Bạn có chắc muốn xóa ${group.count > 1 ? `${group.count} bài học` : 'bài học này'}?`)) return;
                                                                        if (isLoading) return;
                                                                        setIsLoading(true);
                                                                        Promise.all(group.lessonIds.map(id => fetch(`${API_URL}/lessons/${id}`, { method: 'DELETE' })))
                                                                            .then(() => fetchLessons())
                                                                            .catch(err => alert("Có lỗi xóa bài: " + err.message))
                                                                            .finally(() => setIsLoading(false));
                                                                    }}
                                                                    className="p-2 bg-white/50 hover:bg-white text-red-500 rounded-xl hover:shadow-md transition-all"
                                                                    title="Xóa"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <h3 className="font-bold text-xl md:text-2xl text-slate-800 mb-2 line-clamp-2 leading-tight group-hover:text-pink-600 transition-colors">{group.title}</h3>

                                                        {/* Show grouped count if multiple lessons */}
                                                        {group.count > 1 && (
                                                            <p className="text-xs text-pink-500 font-bold bg-pink-50 px-2 py-1 rounded-lg inline-block mb-2">
                                                                {group.count} bài học được gộp
                                                            </p>
                                                        )}

                                                        <div className="mt-auto pt-6 flex items-center gap-2 text-slate-400 text-xs md:text-sm font-bold group-hover:text-pink-600 transition-colors uppercase tracking-wider">
                                                            <span>Luyện ngay</span>
                                                            <span className="group-hover:translate-x-2 transition-transform">➜</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {view === 'CREATE' && (
                <div className="max-w-3xl mx-auto p-12 relative z-10 animate-slide-up">
                    <h2 className="text-3xl font-bold mb-8 text-slate-900">{isEditing ? 'Chỉnh sửa bài học' : 'Soạn bài mới'}</h2>


                    {/* Mode Toggle */}
                    {!isEditing && (
                        <div className="flex gap-4 mb-6 bg-slate-100 p-1.5 rounded-xl">
                            <button onClick={() => setInputMode('TEXT')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${inputMode === 'TEXT' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                📝 Văn bản thường
                            </button>
                            <button onClick={() => setInputMode('STRUCTURED')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${inputMode === 'STRUCTURED' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                🪄 Biến đổi câu (Game)
                            </button>
                        </div>
                    )}

                    <div className="space-y-6">
                        <input className="w-full p-5 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium text-lg" placeholder="Tiêu đề bài học..." value={newTitle} onChange={e => setNewTitle(e.target.value)} disabled={isLoading} />

                        {inputMode === 'TEXT' ? (
                            <textarea className="w-full h-80 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition font-mono text-sm leading-relaxed" placeholder="Nhập nội dung văn bản ở đây..." value={newText} onChange={e => setNewText(e.target.value)} disabled={isLoading} />
                        ) : (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                                {structuredRows.map((row, i) => (
                                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 relative group transition-all hover:shadow-md">
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 font-bold p-1">🗑️</button>
                                        </div>
                                        <div className="grid gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Ngữ cảnh (Context/Question)</label>
                                                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-500 transition font-medium"
                                                    placeholder="e.g. My computer doesn't work, so I can't e-mail you."
                                                    value={row.context} onChange={e => updateRow(i, 'context', e.target.value)} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Từ gợi ý (Keyword/Prompt)</label>
                                                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-500 transition font-bold text-pink-600"
                                                        placeholder="e.g. WRONG"
                                                        value={row.prompt} onChange={e => updateRow(i, 'prompt', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Đáp án (Target Sentence)</label>
                                                    <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500 transition font-medium text-slate-800"
                                                        placeholder="e.g. There's something wrong with my computer..."
                                                        value={row.answer} onChange={e => updateRow(i, 'answer', e.target.value)} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex justify-between">
                                                    <span>Từ gây nhiễu (Distractors)</span>
                                                    <button onClick={() => handleGenerateDistractors(i)} className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded hover:bg-indigo-200 transition">
                                                        ✨ AI Suggest
                                                    </button>
                                                </label>
                                                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm"
                                                    placeholder="e.g. problem, error, bad (phân cách dấu phẩy)"
                                                    value={row.distractors} onChange={e => updateRow(i, 'distractors', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addRow} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold hover:border-pink-400 hover:text-pink-500 hover:bg-pink-50 transition-all">
                                    + Thêm câu hỏi
                                </button>
                            </div>
                        )}
                        <div className="flex gap-4 pt-4">
                            <button onClick={resetCreate} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100" disabled={isLoading}>Hủy</button>
                            <button onClick={handleCreateOrUpdate} disabled={isLoading} className={`flex-1 py-4 text-white rounded-2xl font-bold shadow-xl transition-all ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                {isLoading ? 'Đang xử lý...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'DETAIL' && selectedLesson && (selectedLesson.type === 'TRANSFORMATION' ? (
                /* TRANSFORMATION START SCREEN */
                <div className="h-screen flex items-center justify-center relative z-10 animate-fade-in p-6">
                    <button onClick={() => setView('DASHBOARD')} className="absolute top-8 left-8 text-slate-400 hover:text-slate-700 font-bold transition flex items-center gap-2 bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm">← Quay lại</button>

                    <div className="glass-panel p-12 rounded-[3rem] shadow-2xl max-w-2xl w-full text-center relative overflow-hidden bg-white/80">
                        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-pink-400 to-purple-500"></div>
                        <div className="mb-8">
                            <div className="w-24 h-24 mx-auto bg-pink-100 rounded-full flex items-center justify-center text-5xl mb-6 shadow-sm text-pink-500 animate-bounce-in">🪄</div>
                            <h2 className="text-4xl font-extrabold text-slate-800 mb-2">{selectedLesson.title}</h2>
                            <p className="text-slate-500 font-medium">Bài tập biến đổi câu: {lessonData.length} câu hỏi</p>
                        </div>

                        {/* Mode Selection */}
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Chọn cơ chế luyện tập</p>

                            {/* Reorder Mode */}
                            <button
                                onClick={() => { setTransformationSubMode('REORDER'); setView('MODE_TRANSFORMATION'); }}
                                className="w-full py-5 bg-linear-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                            >
                                <span className="text-2xl">🧩</span>
                                <span>Xếp từ</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </button>

                            {/* Handwriting Mode */}
                            <button
                                onClick={() => { setTransformationSubMode('HANDWRITING'); setView('MODE_TRANSFORMATION'); }}
                                className="w-full py-5 bg-linear-to-r from-teal-500 to-emerald-600 text-white rounded-2xl font-bold text-xl shadow-xl shadow-teal-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                            >
                                <span className="text-2xl">✍️</span>
                                <span>Viết tay</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* STANDARD MENU */
                <div className="h-screen overflow-y-auto flex flex-col p-6 relative z-10 animate-fade-in custom-scrollbar">
                    <button onClick={() => setView('DASHBOARD')} className="absolute top-8 left-8 text-slate-400 hover:text-slate-700 font-bold transition flex items-center gap-2">← Quay lại</button>
                    <div className="text-center mb-16 max-w-2xl mx-auto mt-12">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">{selectedLesson.title}</h2>
                        <p className="text-lg text-slate-500 font-medium bg-white px-6 py-2 rounded-full shadow-sm inline-block">{lessonData.length} sentences</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto pb-12">
                        <div onClick={() => setView('MODE_READ')} className="glass-panel p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-6 group relative overflow-hidden">
                            <div className="w-20 h-20 rounded-3xl bg-cyan-100 text-cyan-600 flex items-center justify-center text-4xl shadow-inner group-hover:rotate-6 transition-transform">📖</div>
                            <div><h3 className="text-2xl font-bold text-slate-800 group-hover:text-cyan-600 transition-colors">Đọc & Nghe</h3><p className="text-slate-500 font-medium">Luyện tập thụ động</p></div>
                        </div>
                        <div onClick={() => setView('MODE_LISTEN')} className="glass-panel p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-6 group relative overflow-hidden">
                            <div className="w-20 h-20 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center text-4xl shadow-inner group-hover:-rotate-6 transition-transform">🎧</div>
                            <div><h3 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Luyện Nghe</h3><p className="text-slate-500 font-medium">Thử thách thính giác</p></div>
                        </div>
                        <div onClick={() => setView('MODE_FILL')} className="glass-panel p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-6 group relative overflow-hidden">
                            <div className="w-20 h-20 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center text-4xl shadow-inner group-hover:rotate-6 transition-transform">📝</div>
                            <div><h3 className="text-2xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors">Điền Từ</h3><p className="text-slate-500 font-medium">Kiểm tra trí nhớ</p></div>
                        </div>
                        <div onClick={() => { setView('MODE_REORDER'); setIsReviewMode(false); }} className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-6 text-white group relative overflow-hidden border border-slate-700">
                            <div className="absolute inset-0 bg-linear-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
                            <div className="relative z-10 flex items-center gap-6 w-full">
                                <div className="w-20 h-20 rounded-3xl bg-slate-800/50 text-indigo-400 flex items-center justify-center text-4xl backdrop-blur-sm group-hover:bg-white/20 group-hover:text-white transition-all">🧩</div>
                                <div><h3 className="text-2xl font-bold">Xếp Từ Game</h3><p className="text-slate-400 group-hover:text-indigo-100">Tốc độ & Phản xạ</p></div>
                            </div>
                        </div>

                        {/* NEW: DEEP FOCUS LOOP */}
                        <div onClick={() => setView('MODE_DEEP_FOCUS')} className="col-span-1 md:col-span-2 bg-linear-to-r from-indigo-900 via-purple-900 to-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-purple-900/40 hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-8 text-white group relative overflow-hidden ring-4 ring-purple-500/20">
                            {/* Animated glowing border effect */}
                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 z-0 pointer-events-none"></div>

                            <div className="relative z-10 flex items-center gap-8 w-full justify-between px-4">
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-full bg-white/10 text-white flex items-center justify-center text-5xl backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.4)] border border-white/20 animate-pulse-soft">
                                        🧠
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-r from-white to-purple-200">DEEP FOCUS LOOP</h3>
                                            <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500 font-bold uppercase tracking-wider">New</span>
                                        </div>
                                        <p className="text-purple-200 font-medium text-lg leading-snug max-w-lg">
                                            Vòng lặp học sâu: Nghe <span className="text-white/40">•</span> Nhìn <span className="text-white/40">•</span> Tái cấu trúc <span className="text-white/40">•</span> Điền từ
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-purple-900 transition-all text-2xl font-bold">
                                    ➜
                                </div>
                            </div>
                        </div>
                        {/* Review Corner */}
                        <div className="col-span-1 md:col-span-2 mt-4">
                            <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg text-lg">🎯</span>
                                Góc Ôn Tập
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div onClick={() => { setView('MODE_REORDER'); setIsReviewMode(true); }} className="bg-red-50 hover:bg-red-100 border border-red-100 p-5 rounded-3xl cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] group">
                                    <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center text-2xl group-hover:bg-white group-hover:shadow-sm transition-all">🩹</div>
                                    <div>
                                        <h4 className="font-bold text-slate-700">Ôn Lại Câu Sai</h4>
                                        <p className="text-xs text-slate-500">Sửa lỗi đã mắc phải</p>
                                    </div>
                                </div>
                                <div onClick={() => { setView('MODE_REORDER'); setIsReviewMode(false); }} className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 p-5 rounded-3xl cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] group">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl group-hover:bg-white group-hover:shadow-sm transition-all">🔄</div>
                                    <div>
                                        <h4 className="font-bold text-slate-700">Ôn Tập Tổng Hợp</h4>
                                        <p className="text-xs text-slate-500">Chạy lại toàn bộ bài</p>
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Modes Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                                <div onClick={() => setView('MODE_CLOZE_PARA')} className="bg-amber-50 hover:bg-amber-100 border border-amber-100 p-5 rounded-3xl cursor-pointer flex flex-col items-center text-center gap-3 transition-all hover:scale-[1.02] group">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl group-hover:bg-white group-hover:shadow-sm transition-all">🕳️</div>
                                    <div>
                                        <h4 className="font-bold text-slate-700">Đục Lỗ Đoạn Văn</h4>
                                        <p className="text-[10px] text-slate-500">Điền từ còn thiếu</p>
                                    </div>
                                </div>
                                <div onClick={() => setView('MODE_PARA_REORDER')} className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 p-5 rounded-3xl cursor-pointer flex flex-col items-center text-center gap-3 transition-all hover:scale-[1.02] group">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl group-hover:bg-white group-hover:shadow-sm transition-all">📑</div>
                                    <div>
                                        <h4 className="font-bold text-slate-700">Xếp Lại Đoạn Văn</h4>
                                        <p className="text-[10px] text-slate-500">Sắp xếp câu chuyện</p>
                                    </div>
                                </div>
                                <div onClick={() => setView('MODE_ERROR_HUNT')} className="bg-rose-50 hover:bg-rose-100 border border-rose-100 p-5 rounded-3xl cursor-pointer flex flex-col items-center text-center gap-3 transition-all hover:scale-[1.02] group">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl group-hover:bg-white group-hover:shadow-sm transition-all">🕵️</div>
                                    <div>
                                        <h4 className="font-bold text-slate-700">Tìm Lỗi Sai (Khó)</h4>
                                        <p className="text-[10px] text-slate-500">Săn lỗi ngữ pháp</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}


            {view === 'MODE_READ' && <ReadMode sentences={lessonData} onBack={() => setView('DETAIL')} />}
            {view === 'MODE_LISTEN' && <ListenMode sentences={lessonData} onBack={() => setView('DETAIL')} />}
            {view === 'MODE_FILL' && <FillMode sentences={lessonData} onBack={() => setView('DETAIL')} />}
            {view === 'MODE_REORDER' && <ReorderGameEngine lessonId={selectedLesson.id} onBack={() => setView('DETAIL')} isReview={isReviewMode} />}

            {/* Advanced Modes */}
            {view === 'MODE_CLOZE_PARA' && <ClozeParagraphMode sentences={lessonData} onBack={() => setView('DETAIL')} />}
            {view === 'MODE_PARA_REORDER' && <ParagraphReorderMode sentences={lessonData} onBack={() => setView('DETAIL')} />}
            {view === 'MODE_ERROR_HUNT' && <ErrorHuntMode sentences={lessonData} onBack={() => setView('DETAIL')} />}
            {view === 'MODE_DEEP_FOCUS' && <DeepFocusMode sentences={lessonData} onBack={() => setView('DETAIL')} />}
            {view === 'MODE_TRANSFORMATION' && <TransformationMode sentences={lessonData} onBack={() => setView('DETAIL')} mode={transformationSubMode} />}

            {/* Settings Modal */}
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
