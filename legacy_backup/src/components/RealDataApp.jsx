import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ClozeParagraphMode, ParagraphReorderMode, ErrorHuntMode } from './learning/AdvancedReviewModes';
import { DeepFocusMode } from './learning/DeepFocusMode';
import { MatchingGame } from './learning/MatchingGame';
import { TransformationMode } from './learning/TransformationMode';
import { SocraticReview } from './SocraticReview';
import { RelatedPosts } from './RelatedPosts';
import { GraphView } from './GraphView';
import SettingsModal from './SettingsModal';

// =======================
// 1. SHARED & UTILS
// =======================
const speak = (text, rate = null) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    const globalRate = localStorage.getItem('speechRate');
    utterance.rate = rate || (globalRate ? parseFloat(globalRate) : 1.0);

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US") || v.name.includes("Samantha"));
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
};

const QuestionNavigator = ({ total, current, onChange, statusMap = {} }) => {
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

const ReadyScreen = ({ onReady, sentenceIndex, level = 1, onLevelChange = () => console.warn("Missing onLevelChange") }) => {
    const descriptions = {
        1: "🌟 Khởi động: Học tập thoải mái",
        2: "🔥 Tăng tốc: Tập trung cao độ",
        3: "⚡ Áp lực: Phản xạ nhanh nhẹn",
        4: "🎧 Thính giác: Giới hạn nghe lại từ"
    };

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center animate-fade-in p-6 bg-slate-900/20 backdrop-blur-sm">
            <div className="glass-panel p-10 rounded-[3rem] shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col items-center animate-slide-up">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
                <h2 className="text-5xl font-extrabold gradient-text mb-2 tracking-tighter relative z-10">Câu {sentenceIndex + 1}</h2>
                <p className="text-slate-500 mb-8 font-medium relative z-10 text-lg">Chọn mức độ thử thách:</p>
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

const GameLayout = ({ children, navigator, onBack }) => (
    <div className="flex flex-col h-screen font-sans overflow-hidden relative selection:bg-indigo-100 selection:text-indigo-700 bg-slate-50">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-50 via-white to-purple-50 opacity-60 -z-20"></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[60vh] h-[60vh] bg-purple-300/20 rounded-full blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vh] h-[60vh] bg-indigo-300/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '3s' }}></div>
        </div>
        <div className="h-16 shrink-0 flex items-center justify-between px-4 md:px-8 z-20 border-b border-white/40 bg-white/30 backdrop-blur-sm">
            <button onClick={onBack} className="group flex items-center gap-2 text-slate-500 hover:text-red-500 font-bold transition-all px-3 py-1.5 rounded-xl hover:bg-red-50">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> <span>Thoát</span>
            </button>
            <div className="hidden md:block font-bold text-slate-400 tracking-widest uppercase text-[10px] bg-white/60 px-3 py-1 rounded-full border border-white/50 shadow-sm">Learning Station</div>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center relative z-10 overflow-y-auto px-4 py-2 w-full">
            {children}
        </div>
        {navigator}
    </div>
);

// =======================
// 2A. MODES (LISTEN, FILL, REORDER, READ)
// =======================
const ListenMode = ({ sentences, onBack }) => {
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        if (sentences[idx]) speak(sentences[idx].content);
    }, [idx, sentences]);
    if (!sentences || sentences.length === 0) return <div>No data</div>;
    const s = sentences[idx];
    return (
        <GameLayout onBack={onBack} navigator={<QuestionNavigator total={sentences.length} current={idx} onChange={setIdx} />}>
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center h-full max-h-[70vh]">
                <div className="w-full glass-panel rounded-4xl shadow-xl p-6 md:p-10 text-center relative flex flex-col items-center justify-between h-full bg-white/80">
                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-400 to-indigo-500"></div>
                    <h2 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 shrink-0">Luyện Nghe Thụ Động</h2>
                    <div className="flex-1 flex items-center justify-center w-full overflow-y-auto custom-scrollbar my-2">
                        <p className="text-2xl md:text-4xl font-medium text-slate-800 leading-snug font-serif tracking-wide px-2 drop-shadow-sm text-balance">"{s.content}"</p>
                    </div>
                    <div className="shrink-0 mt-6 md:mt-10 pb-2">
                        <button onClick={() => speak(s.content)} className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-linear-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-xl shadow-indigo-300 hover:scale-110 active:scale-95 transition-all mx-auto animate-pulse-soft group border-4 border-white/20">
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
    }, [idx, sentences, progressMap]);

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
        <GameLayout onBack={onBack} navigator={<QuestionNavigator total={sentences.length} current={idx} onChange={setIdx} statusMap={progressMap} />}>
            <div className="w-full max-w-4xl mx-auto flex flex-col justify-center items-center h-full p-4">
                <div className="w-full glass-panel rounded-4xl shadow-xl p-8 md:p-12 text-center relative overflow-hidden transition-all duration-300 bg-white/90 border-t-8 border-orange-400 flex flex-col">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mb-8 md:mb-12">Điền Từ Vào Chỗ Trống</h2>
                    <div className="text-2xl md:text-4xl font-medium text-slate-800 leading-loose flex flex-wrap justify-center gap-x-3 gap-y-4 items-baseline mb-12">
                        {words.map((w, i) => {
                            if (i === hiddenIndex && status !== 'CORRECT') {
                                return (
                                    <span key={i} className="relative inline-block mx-1">
                                        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} className="border-b-4 border-orange-400 outline-none text-center text-orange-600 font-bold w-32 md:w-40 bg-orange-50 focus:bg-white focus:border-orange-500 transition-all placeholder-orange-200 rounded-t-lg px-2 shadow-inner" autoFocus placeholder="..." />
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
                            <button onClick={() => idx < sentences.length - 1 ? setIdx(idx + 1) : alert("Hoàn thành!")} className="px-10 py-4 bg-green-500 text-white rounded-xl font-bold shadow-xl shadow-green-200 hover:bg-green-600 hover:scale-105 transition-all text-lg animate-bounce-in">Câu tiếp theo ➜</button>
                        )}
                    </div>
                </div>
            </div>
        </GameLayout>
    );
};

const ReorderGameEngine = ({ lessonId, onBack, isReview = false }) => {
    const [level, setLevel] = useState(1);
    const [loading, setLoading] = useState(true);
    const [sentences, setSentences] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [gameData, setGameData] = useState({ pool: [], chosen: [], status: 'PENDING', correctAnswer: null });
    const [isReady, setIsReady] = useState(false);
    const [statusMap, setStatusMap] = useState({});
    const [audioCount, setAudioCount] = useState(0);

    const saveProgress = useCallback((forceStatus) => {
        if (!sentences[currentIdx]) return;
        const payload = {
            lessonId, sentenceId: sentences[currentIdx].id, selectedLevel: level,
            status: forceStatus || gameData.status, currentArrangement: gameData.chosen, timeRemaining: 0, audioCount
        };
        fetch(`${API_URL}/study/save-progress`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        setStatusMap(prev => ({ ...prev, [currentIdx]: forceStatus || gameData.status }));
    }, [lessonId, level, sentences, currentIdx, gameData, audioCount]);

    useEffect(() => {
        setLoading(true);
        const endpoint = isReview ? `${API_URL}/study/review/${lessonId}?level=${level}` : `${API_URL}/study/init/${lessonId}?level=${level}`;
        fetch(endpoint).then(res => res.json()).then(data => { setSentences(data.sentences); setCurrentIdx(0); setLoading(false); setStatusMap({}); }).catch(() => setLoading(false));
    }, [lessonId, level, isReview]);

    useEffect(() => {
        if (!sentences[currentIdx]) return;
        setGameData({ pool: [...sentences[currentIdx].shuffled_words], chosen: [], status: 'PENDING', correctAnswer: null });
        setAudioCount(0); setIsReady(false);
    }, [currentIdx, sentences]);

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
            await new Promise(r => setTimeout(r, 600));
            const res = await fetch(`${API_URL}/study/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sentenceId: sentences[currentIdx].id, finalArrangement: gameData.chosen, level }) });
            const result = await res.json();
            const status = result.isCorrect ? 'CORRECT' : 'WRONG';
            speak(result.isCorrect ? "Correct!" : "Wrong!");
            setGameData(p => ({ ...p, status, correctAnswer: result.correctAnswer }));
            saveProgress(status);
        } finally { setProcessing(false); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-slate-400">Loading...</div>;
    if (sentences.length === 0) return <div className="h-screen flex flex-col items-center justify-center text-slate-500 gap-4"><p className="text-xl font-bold">{isReview ? 'Bạn chưa có câu nào sai để ôn tập! 🎉' : 'Bài học chưa có dữ liệu.'}</p><button onClick={onBack} className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Quay lại</button></div>;
    return (
        <GameLayout onBack={onBack} navigator={<QuestionNavigator total={sentences.length} current={currentIdx} onChange={setCurrentIdx} statusMap={statusMap} />}>
            {!isReady && <ReadyScreen sentenceIndex={currentIdx} onReady={() => setIsReady(true)} level={level} onLevelChange={setLevel} />}
            <div className="flex justify-center mb-4 z-20">
                <div className="bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-white/50 p-1.5 flex items-center gap-4 px-4 pl-2">
                    <div className="flex bg-slate-100 rounded-full p-1">
                        {[1, 2, 3, 4].map(l => (
                            <button key={l} onClick={() => setLevel(l)} className={`w-8 h-8 rounded-full font-bold text-xs transition-all ${level === l ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className={`flex-1 flex flex-col items-center justify-between w-full max-w-4xl mx-auto transition-all duration-500 pb-2 ${!isReady ? 'blur-sm opacity-30 scale-95 pointer-events-none' : 'scale-100'}`}>
                <div className={`w-full min-h-[160px] p-6 md:p-8 rounded-4xl border-2 border-dashed transition-all duration-300 flex flex-wrap gap-3 content-start items-start justify-center shadow-inner ${gameData.status === 'CORRECT' ? 'bg-green-50 border-green-300' : gameData.status === 'WRONG' ? 'bg-red-50 border-red-300' : 'bg-white/60 border-indigo-200/60 hover:border-indigo-300 hover:bg-white/80'}`}>
                    {gameData.chosen.length === 0 && gameData.status === 'PENDING' && (<div className="text-slate-300 font-bold text-xl flex flex-col items-center justify-center h-24"><span className="text-4xl mb-2 opacity-50">⤵</span><span>Sắp xếp từ vào đây</span></div>)}
                    {gameData.chosen.map((w, i) => (<button key={i} onClick={() => handleWordClick(w, i, false)} disabled={gameData.status !== 'PENDING' || !isReady} className="px-4 py-2 md:px-6 md:py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-300/50 hover:scale-105 active:scale-95 transition-all text-base md:text-lg animate-fade-in">{w}</button>))}
                </div>
                {gameData.status === 'PENDING' && (<div className="w-full flex flex-wrap gap-2 md:gap-3 justify-center content-center py-6 min-h-[120px]">{gameData.pool.map((w, i) => (<button key={i} onClick={() => handleWordClick(w, i, true)} disabled={!isReady} className="px-4 py-2 md:px-5 md:py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium shadow-sm hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all text-base md:text-lg">{w}</button>))}</div>)}
                <div className="flex gap-4 w-full justify-center mt-auto"><button onClick={handleSubmit} disabled={!isReady || processing} className={`w-full max-w-xs py-4 rounded-2xl font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${!isReady || processing ? 'bg-slate-300 cursor-not-allowed' : gameData.status === 'PENDING' ? 'bg-slate-900 shadow-slate-300' : gameData.status === 'CORRECT' ? 'bg-green-500 shadow-green-200' : 'bg-orange-500 shadow-orange-200'}`}>{processing ? 'Đang xử lý...' : (gameData.status === 'PENDING' ? 'Kiểm tra' : 'Tiếp theo ➜')}</button></div>
                {gameData.correctAnswer && (<div className="absolute inset-x-0 bottom-24 flex justify-center pointer-events-none"><div className="bg-white/95 backdrop-blur-xl px-8 py-6 rounded-3xl shadow-2xl border border-slate-200 flex flex-col items-center animate-slide-up pointer-events-auto max-w-lg mx-4 text-center"><p className="text-xs font-bold text-slate-400 uppercase mb-2">Đáp án đúng là:</p><p className="text-lg md:text-xl font-bold text-slate-800 leading-snug">{gameData.correctAnswer}</p></div></div>)}
            </div>
        </GameLayout>
    );
};

const ReadMode = ({ sentences, onBack }) => (
    <div className="flex flex-col h-screen bg-white font-sans text-slate-800">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-20"><button onClick={onBack} className="text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-2 transition px-4 py-2 hover:bg-slate-50 rounded-xl">← Quay lại</button><h2 className="text-xl font-bold text-slate-800">Chi tiết bài học</h2><div className="w-24"></div></div>
        <div className="flex-1 overflow-y-auto w-full bg-slate-50/50"><div className="max-w-4xl mx-auto p-8 md:p-12 space-y-4">{sentences.map((s, i) => (<div key={s.id} onClick={() => speak(s.content)} className="group bg-white p-6 md:p-8 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer flex gap-5 items-start relative overflow-hidden"><span className="text-sm font-bold text-slate-300 mt-1.5 min-w-6 group-hover:text-indigo-400 transition-colors">{String(i + 1).padStart(2, '0')}</span><p className="text-xl leading-relaxed text-slate-700 group-hover:text-slate-900 transition-colors font-medium">{s.content}</p><button className="ml-auto w-10 h-10 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">🔊</button></div>))}</div></div>
    </div>
);

// =======================
// 3. MAIN APP
// =======================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export default function RealDataApp() {
    const [view, setView] = useState('DASHBOARD');
    const [lessons, setLessons] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [lessonData, setLessonData] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [currentLessonId, setCurrentLessonId] = useState(null);
    const [newTitle, setNewTitle] = useState("");
    const [newText, setNewText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [transformationSubMode, setTransformationSubMode] = useState('REORDER');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [inputMode, setInputMode] = useState('TEXT');
    const [structuredRows, setStructuredRows] = useState([{ context: '', prompt: '', answer: '', distractors: '' }]);

    const addRow = () => setStructuredRows([...structuredRows, { context: '', prompt: '', answer: '', distractors: '' }]);
    const removeRow = (i) => { const newRows = [...structuredRows]; newRows.splice(i, 1); setStructuredRows(newRows); };
    const updateRow = (i, field, val) => { const newRows = [...structuredRows]; newRows[i][field] = val; setStructuredRows(newRows); };

    const fetchLessons = useCallback(() => {
        setIsFetching(true);
        fetch(`${API_URL}/lessons`).then(r => r.json()).then(data => { if (Array.isArray(data)) setLessons(data); }).catch(console.error).finally(() => setIsFetching(false));
    }, []);

    useEffect(() => { if (view === 'DASHBOARD') fetchLessons(); }, [view, fetchLessons]);

    const selectLesson = (l) => {
        setSelectedLesson(l);
        if (l.lessonIds && l.lessonIds.length > 1) {
            Promise.all(l.lessonIds.map(id => fetch(`${API_URL}/lessons/${id}`).then(r => r.json()))).then(results => { setLessonData(results.flat()); setView('DETAIL'); });
        } else {
            const lessonId = l.lessonIds ? l.lessonIds[0] : l.id;
            fetch(`${API_URL}/lessons/${lessonId}`).then(r => r.json()).then(d => { setLessonData(d); setView('DETAIL'); });
        }
    };

    const handleGenerateDistractors = async (index) => {
        const row = structuredRows[index]; if (!row.answer) return alert("Nhập đáp án trước!");
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/generate-distractors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sentence: row.answer, prompt: row.prompt }) });
            const data = await res.json(); if (data.distractors) updateRow(index, 'distractors', data.distractors.join(', '));
        } catch (e) { alert("Lỗi AI: " + e.message); } finally { setIsLoading(false); }
    };

    const handleCreateOrUpdate = async () => {
        if (!newTitle) return alert("Nhập tiêu đề!");
        setIsLoading(true);
        try {
            if (inputMode === 'STRUCTURED' || inputMode === 'MATCHING') {
                const payload = { title: newTitle, sentences: structuredRows.filter(r => r.answer).map(r => ({ content: r.answer, prompt: r.prompt, context: r.context, distractors: r.distractors.split(',').map(s => s.trim()).filter(s => s) })), type: inputMode === 'MATCHING' ? 'MATCHING' : 'TRANSFORMATION' };
                if (isEditing) {
                    const lessonsToDelete = lessons.filter(l => l.title === newTitle);
                    await Promise.all(lessonsToDelete.map(l => fetch(`${API_URL}/lessons/${l.id}`, { method: 'DELETE' })));
                }
                await fetch(`${API_URL}/structured-lesson`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            } else {
                const method = isEditing ? 'PUT' : 'POST';
                const url = isEditing ? `${API_URL}/lessons/${currentLessonId}` : `${API_URL}/lessons`;
                const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle, text: newText }) });
                const data = await res.json();

                // Auto-Tagging (The Librarian)
                if (data.success && data.lessonId) {
                    // Call extraction in background
                    fetch(`${API_URL}/ai/extract`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: newText, lessonId: data.lessonId })
                    }).catch(console.error);
                }
            }
            setView('DASHBOARD'); resetCreate(); fetchLessons();
        } catch (error) { alert("Lỗi: " + error.message); } finally { setIsLoading(false); }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation(); if (!window.confirm("Xóa bài học này?")) return;
        setIsLoading(true);
        try { await fetch(`${API_URL}/lessons/${id}`, { method: 'DELETE' }); fetchLessons(); } catch (error) { alert("Lỗi: " + error.message); } finally { setIsLoading(false); }
    };

    const startEdit = (e, lesson) => {
        e.stopPropagation(); setIsLoading(true);
        fetch(`${API_URL}/lessons/${lesson.id}`).then(r => r.json()).then(sentences => { setNewTitle(lesson.title); setNewText(sentences.map(s => s.content).join("\n")); setIsEditing(true); setCurrentLessonId(lesson.id); setInputMode('TEXT'); setView('CREATE'); }).finally(() => setIsLoading(false));
    };

    const startEditTransformation = (e, lesson) => {
        e.stopPropagation(); setIsLoading(true);
        fetch(`${API_URL}/lessons/${lesson.id}`).then(r => r.json()).then(sentences => {
            setNewTitle(lesson.title);
            setStructuredRows(sentences.map(s => ({ context: s.context || '', prompt: s.prompt || '', answer: s.content || '', distractors: Array.isArray(s.distractors) ? s.distractors.join(', ') : (s.distractors || '') })));
            setIsEditing(true); setCurrentLessonId(lesson.id); setInputMode(lesson.type === 'MATCHING' ? 'MATCHING' : 'STRUCTURED'); setView('CREATE');
        }).finally(() => setIsLoading(false));
    };

    const resetCreate = () => { setView('DASHBOARD'); setIsEditing(false); setCurrentLessonId(null); setNewTitle(""); setNewText(""); setStructuredRows([{ context: '', prompt: '', answer: '', distractors: '' }]); setInputMode('TEXT'); };

    const matchingLessons = lessons.filter(l => l.type === 'MATCHING');
    const standardLessons = lessons.filter(l => l.type !== 'TRANSFORMATION' && l.type !== 'MATCHING');
    const transformationLessons = lessons.filter(l => l.type === 'TRANSFORMATION');

    // Grouping logic for dashboard cards
    const groupedTransformations = transformationLessons.reduce((acc, l) => {
        const existing = acc.find(g => g.title === l.title);
        if (existing) { existing.lessonIds.push(l.id); existing.count++; }
        else acc.push({ title: l.title, lessonIds: [l.id], count: 1, type: 'TRANSFORMATION', id: l.id });
        return acc;
    }, []);

    const groupedMatching = matchingLessons.reduce((acc, l) => {
        const existing = acc.find(g => g.title === l.title);
        if (existing) { existing.lessonIds.push(l.id); existing.count++; }
        else acc.push({ title: l.title, lessonIds: [l.id], count: 1, type: 'MATCHING', id: l.id });
        return acc;
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-700 relative overflow-hidden">
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-indigo-600 font-bold text-lg animate-pulse">Đang xử lý...</p>
                    </div>
                </div>
            )}

            <div className="absolute inset-0 bg-linear-to-br from-indigo-50/40 via-white to-purple-50/40 -z-20"></div>

            {view === 'DASHBOARD' && (
                <div className="w-full max-w-7xl mx-auto p-4 md:p-8 relative z-10 animate-fade-in flex flex-col h-screen">
                    <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 shrink-0">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-2">Learning Station</h1>
                            <p className="text-slate-500 font-medium opacity-80">Nền tảng học tập thông minh</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsSettingsOpen(true)} className="bg-slate-100 hover:bg-slate-200 p-4 rounded-2xl shadow-md transition-all">⚙️</button>
                            <button onClick={() => setView('GRAPH')} className="bg-indigo-100 text-indigo-700 px-6 py-4 rounded-2xl font-bold hover:bg-indigo-200 transition-all shadow-sm">🧠 Brain Map</button>
                            <button onClick={() => { setIsEditing(false); resetCreate(); setView('CREATE'); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all text-lg">+ Bài học mới</button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto pb-8 space-y-12 custom-scrollbar">
                        {isFetching ? (<div className="flex flex-col items-center justify-center h-64 text-slate-400"><div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div><p>Đang tải...</p></div>) : (
                            <>
                                {standardLessons.length > 0 && (
                                    <section>
                                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">📚 Tài Liệu Học Tập</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {standardLessons.map(l => (
                                                <div key={l.id} onClick={() => selectLesson(l)} className="glass-panel p-6 rounded-4xl hover:-translate-y-2 transition-all cursor-pointer bg-white/40 border border-white relative group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">📝</div>
                                                        <div className="flex gap-2">
                                                            <button onClick={(e) => startEdit(e, l)} className="p-2 hover:bg-white rounded-lg text-blue-600">✏️</button>
                                                            <button onClick={(e) => handleDelete(e, l.id)} className="p-2 hover:bg-white rounded-lg text-red-500">🗑️</button>
                                                        </div>
                                                    </div>
                                                    <h3 className="font-bold text-xl mb-4 line-clamp-2">{l.title}</h3>
                                                    <div className="text-indigo-600 font-bold text-sm">Học ngay ➜</div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {groupedTransformations.length > 0 && (
                                    <section>
                                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">🪄 Biến Đổi Câu</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {groupedTransformations.map(g => (
                                                <div key={g.id} onClick={() => selectLesson(g)} className="glass-panel p-6 rounded-4xl hover:-translate-y-2 transition-all cursor-pointer bg-white/40 border border-white group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-xl text-pink-500 shadow-sm">⚡</div>
                                                        <div className="flex gap-2">
                                                            <button onClick={(e) => { e.stopPropagation(); startEditTransformation(e, g); }} className="p-2 hover:bg-white rounded-lg text-blue-600">✏️</button>
                                                            <button onClick={(e) => handleDelete(e, g.id)} className="p-2 hover:bg-white rounded-lg text-red-500">🗑️</button>
                                                        </div>
                                                    </div>
                                                    <h3 className="font-bold text-xl mb-2">{g.title}</h3>
                                                    {g.count > 1 && <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-lg mb-4 inline-block">{g.count} bài học</span>}
                                                    <div className="text-pink-600 font-bold text-sm">Luyện tập ➜</div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {groupedMatching.length > 0 && (
                                    <section>
                                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">🧩 Luyện Nối Câu</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {groupedMatching.map(g => (
                                                <div key={g.id} onClick={() => selectLesson(g)} className="glass-panel p-6 rounded-4xl hover:-translate-y-2 transition-all cursor-pointer bg-white/40 border border-white group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-xl text-rose-500 shadow-sm">🔗</div>
                                                        <div className="flex gap-2">
                                                            <button onClick={(e) => { e.stopPropagation(); startEditTransformation(e, g); }} className="p-2 hover:bg-white rounded-lg text-blue-600">✏️</button>
                                                            <button onClick={(e) => handleDelete(e, g.id)} className="p-2 hover:bg-white rounded-lg text-red-500">🗑️</button>
                                                        </div>
                                                    </div>
                                                    <h3 className="font-bold text-xl mb-4">{g.title}</h3>
                                                    <div className="text-rose-600 font-bold text-sm">Chơi game ➜</div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {view === 'CREATE' && (
                <div className="max-w-3xl mx-auto p-12 relative z-10 animate-slide-up">
                    <h2 className="text-3xl font-bold mb-8 text-slate-900">{isEditing ? 'Chỉnh sửa bài học' : 'Soạn bài mới'}</h2>
                    {!isEditing && (
                        <div className="flex gap-4 mb-6 bg-slate-100 p-1.5 rounded-xl">
                            {['TEXT', 'STRUCTURED', 'MATCHING'].map(mode => (
                                <button key={mode} onClick={() => setInputMode(mode)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${inputMode === mode ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>
                                    {mode === 'TEXT' ? '📝 Văn bản' : mode === 'STRUCTURED' ? '🪄 Biến đổi' : '🧩 Nối câu'}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="space-y-6">
                        <input className="w-full p-5 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium text-lg" placeholder="Tiêu đề bài học..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            <div className="flex-1 space-y-6 w-full">
                                {inputMode === 'TEXT' ? (
                                    <>
                                        <textarea className="w-full h-80 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition font-mono text-sm leading-relaxed" placeholder="Nhập nội dung văn bản..." value={newText} onChange={e => setNewText(e.target.value)} />
                                        <SocraticReview content={newText} apiUrl={API_URL} />
                                    </>
                                ) : (
                                    <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                                        {structuredRows.map((row, i) => (
                                            <div key={i} className={`bg-white p-6 rounded-2xl shadow-sm border relative group transition-all hover:shadow-md ${inputMode === 'MATCHING' ? 'border-rose-100' : 'border-pink-100'}`}>
                                                <button onClick={() => removeRow(i)} className="absolute top-4 right-4 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">🗑️</button>
                                                <div className="grid gap-4">
                                                    {inputMode === 'MATCHING' ? (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div><label className="text-[10px] font-bold text-slate-400 uppercase">Vế A (Trái)</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={row.context} onChange={e => updateRow(i, 'context', e.target.value)} /></div>
                                                            <div><label className="text-[10px] font-bold text-slate-400 uppercase">Vế B (Phải)</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={row.answer} onChange={e => updateRow(i, 'answer', e.target.value)} /></div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div><label className="text-[10px] font-bold text-slate-400 uppercase">Ngữ cảnh</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={row.context} onChange={e => updateRow(i, 'context', e.target.value)} /></div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Gợi ý</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={row.prompt} onChange={e => updateRow(i, 'prompt', e.target.value)} /></div>
                                                                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Đáp án</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={row.answer} onChange={e => updateRow(i, 'answer', e.target.value)} /></div>
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between mb-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Từ gây nhiễu</label><button onClick={() => handleGenerateDistractors(i)} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 rounded">✨ AI Suggest</button></div>
                                                                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={row.distractors} onChange={e => updateRow(i, 'distractors', e.target.value)} />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={addRow} className={`w-full py-4 border-2 border-dashed rounded-2xl font-bold transition-all ${inputMode === 'MATCHING' ? 'border-rose-200 text-rose-400 hover:bg-rose-50' : 'border-pink-200 text-pink-400 hover:bg-pink-50'}`}>+ Thêm mục mới</button>
                                    </div>
                                )}
                                <div className="flex gap-4 pt-4">
                                    <button onClick={resetCreate} className="flex-1 py-4 font-bold text-slate-500">Hủy</button>
                                    <button onClick={handleCreateOrUpdate} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl">Lưu bài học</button>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar for Related Posts */}
                        <RelatedPosts
                            content={inputMode === 'TEXT' ? newText : structuredRows.map(r => r.answer).join(" ")}
                            apiUrl={API_URL}
                            onSelect={(lesson) => {
                                if (window.confirm(`Switch to related lesson "${lesson.title}"? Unsaved changes will be lost.`)) {
                                    selectLesson({ id: lesson.id });
                                }
                            }}
                        />
                    </div>
                </div>
            )}

            {view === 'GRAPH' && (
                <div className="w-full max-w-7xl mx-auto p-8 animate-fade-in flex flex-col h-screen">
                    <button onClick={() => setView('DASHBOARD')} className="font-bold text-slate-400 hover:text-slate-600 mb-4 self-start">← Back to Dashboard</button>
                    <h2 className="text-3xl font-black mb-6 text-indigo-900">🧠 Knowledge Graph (The Brain)</h2>
                    <GraphView apiUrl={API_URL} onNodeClick={(node) => selectLesson({ id: Number(node.id) })} />
                </div>
            )}

            {view === 'DETAIL' && selectedLesson && (
                selectedLesson.type === 'TRANSFORMATION' ? (
                    <div className="h-screen flex items-center justify-center p-6">
                        <div className="glass-panel p-12 rounded-[3rem] shadow-2xl max-w-2xl w-full text-center bg-white/80">
                            <button onClick={() => setView('DASHBOARD')} className="absolute top-8 left-8 font-bold text-slate-400 hover:text-slate-600">← Trở về</button>
                            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🪄</div>
                            <h2 className="text-3xl font-extrabold mb-8">{selectedLesson.title}</h2>
                            <div className="space-y-4">
                                <button onClick={() => { setTransformationSubMode('REORDER'); setView('MODE_TRANSFORMATION'); }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl shadow-lg">🧩 Xếp từ game</button>
                                <button onClick={() => setView('MODE_MATCHING')} className="w-full py-5 bg-rose-500 text-white rounded-2xl font-bold text-xl shadow-lg">🔗 Nối câu game</button>
                                <button onClick={() => { setTransformationSubMode('HANDWRITING'); setView('MODE_TRANSFORMATION'); }} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-bold text-xl shadow-lg">✍️ Viết tay</button>
                            </div>
                        </div>
                    </div>
                ) : selectedLesson.type === 'MATCHING' ? (
                    /* Auto launch matching game if it's a dedicated matching lesson */
                    <MatchingGame sentences={lessonData} onBack={() => setView('DASHBOARD')} />
                ) : (
                    <div className="h-screen overflow-y-auto flex flex-col p-6 items-center">
                        <button onClick={() => setView('DASHBOARD')} className="absolute top-8 left-8 font-bold text-slate-400">← Trở về</button>
                        <h2 className="text-4xl font-black mt-12 mb-12">{selectedLesson.title}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                            <div onClick={() => setView('MODE_READ')} className="glass-panel p-8 rounded-4xl flex items-center gap-6 cursor-pointer hover:scale-105 transition-all"><div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center text-3xl">📖</div><div><h3 className="font-bold text-xl">Đọc & Nghe</h3><p className="text-slate-500">Học thụ động</p></div></div>
                            <div onClick={() => setView('MODE_LISTEN')} className="glass-panel p-8 rounded-4xl flex items-center gap-6 cursor-pointer hover:scale-105 transition-all"><div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">🎧</div><div><h3 className="font-bold text-xl">Luyện Nghe</h3><p className="text-slate-500">Nghe & Chọn</p></div></div>
                            <div onClick={() => setView('MODE_FILL')} className="glass-panel p-8 rounded-4xl flex items-center gap-6 cursor-pointer hover:scale-105 transition-all"><div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl">📝</div><div><h3 className="font-bold text-xl">Điền Từ</h3><p className="text-slate-500">Nhớ & Gõ</p></div></div>
                            <div onClick={() => { setView('MODE_REORDER'); setIsReviewMode(false); }} className="bg-slate-900 text-white p-8 rounded-4xl flex items-center gap-6 cursor-pointer hover:scale-105 transition-all"><div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">🧩</div><div><h3 className="font-bold text-xl">Xếp Từ Game</h3><p className="opacity-60">Tốc độ & Phản xạ</p></div></div>
                            <div onClick={() => setView('MODE_DEEP_FOCUS')} className="col-span-1 md:col-span-2 bg-indigo-900 text-white p-8 rounded-4xl flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-all"><div className="flex items-center gap-6"><div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-4xl">🧠</div><div><h3 className="font-bold text-2xl">DEEP FOCUS LOOP</h3><p className="opacity-60">Vòng lặp học sâu đa kỹ năng</p></div></div><div className="text-3xl">➜</div></div>
                        </div>
                    </div>
                )
            )}

            {view === 'MODE_READ' && <ReadMode sentences={lessonData} onBack={() => setView('DETAIL')} />}
            {view === 'MODE_LISTEN' && <ListenMode sentences={lessonData} onBack={() => setView('DETAIL')} />}
            {view === 'MODE_FILL' && <FillMode sentences={lessonData} onBack={() => setView('DETAIL')} />}
            {view === 'MODE_REORDER' && selectedLesson && <ReorderGameEngine lessonId={selectedLesson.id} onBack={() => setView('DETAIL')} isReview={isReviewMode} />}
            {view === 'MODE_CLOZE_PARA' && <ClozeParagraphMode sentences={lessonData} onBack={() => setView('DETAIL')} />}
            {view === 'MODE_PARA_REORDER' && <ParagraphReorderMode sentences={lessonData} onBack={() => setView('DETAIL')} />}
            {view === 'MODE_ERROR_HUNT' && <ErrorHuntMode sentences={lessonData} onBack={() => setView('DETAIL')} />}
            {view === 'MODE_DEEP_FOCUS' && <DeepFocusMode sentences={lessonData} onBack={() => setView('DETAIL')} />}
            {view === 'MODE_TRANSFORMATION' && <TransformationMode sentences={lessonData} onBack={() => setView('DETAIL')} mode={transformationSubMode} />}
            {view === 'MODE_MATCHING' && <MatchingGame sentences={lessonData} onBack={() => setView('DETAIL')} />}

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
