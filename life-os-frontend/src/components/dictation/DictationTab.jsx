import React from 'react';
import SpeechInput from './SpeechInput';
import { getAccuracyBadge } from './DictationHelpers';

const DictationTab = ({
    sentences,
    currentSentenceIndex,
    setCurrentSentenceIndex,
    itemsPerPage,
    setItemsPerPage,
    currentPageDictation,
    setCurrentPageDictation,
    totalPages,
    currentSentencesDictation,
    getSentenceColor,
    isSentenceCompleted,
    userInput,
    handleUserInputChange,
    handleShowHint,
    showHint,
    revealedChars,
    generateHintText,
    showOriginal,
    setShowOriginal,
    dictation,
    isRecording,
    setIsRecording,
    inputRef,
    handleReset,
    handleNextSentence,
    submitAttempt,
    isSubmitting,
    settings,
    currentResult,
    resultsRef,
    setHasStarted,
    replaySentence
}) => {
    return (
        <>
            {/* Sentence Progress */}
            <div className="glass-panel rounded-2xl p-6 min-w-0">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-slate-500 font-bold">
                        Câu hiện tại: <span className="text-indigo-600 font-black text-base">{currentSentenceIndex + 1}</span> / {sentences.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-slate-500">Hiển thị:</label>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                const val = e.target.value;
                                setItemsPerPage(val === 'all' ? 'all' : Number(val));
                                setCurrentPageDictation(1);
                            }}
                            className="border border-slate-200/60 rounded-lg px-2.5 py-1.5 text-sm font-bold text-slate-700 bg-white/60 backdrop-blur-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer appearance-none pr-7 relative"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center' }}
                        >
                            <option value={10}>10 câu</option>
                            <option value={20}>20 câu</option>
                            <option value={50}>50 câu</option>
                            <option value={100}>100 câu</option>
                            <option value={500}>500 câu</option>
                            <option value="all">Tất cả</option>
                        </select>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    {currentSentencesDictation.map((_, idx) => {
                        const actualIndex = itemsPerPage === 'all' ? idx : (currentPageDictation - 1) * itemsPerPage + idx;
                        return (
                            <button
                                key={actualIndex}
                                onClick={() => {
                                    setCurrentSentenceIndex(actualIndex);
                                }}
                                className={`w-9 h-9 flex items-center justify-center shrink-0 rounded-full text-sm font-bold transition-all ${getSentenceColor(actualIndex)}`}
                            >
                                {actualIndex + 1}
                            </button>
                        );
                    })}
                </div>

                {/* Pagination Controls cho Dictation Tab */}
                {itemsPerPage !== 'all' && totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-6 border-t border-slate-200/50 pt-5">
                        <button
                            onClick={() => setCurrentPageDictation(p => Math.max(1, p - 1))}
                            disabled={currentPageDictation === 1}
                            className="px-4 py-2 bg-white/60 backdrop-blur-sm text-slate-700 font-bold rounded-xl border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm transition-all"
                        >
                            ← Trang trước
                        </button>
                        <span className="text-sm font-bold text-slate-500">
                            Trang <span className="text-indigo-600 font-black">{currentPageDictation}</span> / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPageDictation(p => Math.min(totalPages, p + 1))}
                            disabled={currentPageDictation === totalPages}
                            className="px-4 py-2 bg-white/60 backdrop-blur-sm text-slate-700 font-bold rounded-xl border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm transition-all"
                        >
                            Trang sau →
                        </button>
                    </div>
                )}
            </div>

            {/* Input Section */}
            <div className={`glass-panel rounded-2xl p-6 flex flex-col min-h-[400px] transition-all duration-500 ${isSentenceCompleted ? 'border-emerald-200/50 bg-emerald-50/30' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                        {isSentenceCompleted ? (
                            <><span className="text-emerald-500">✨</span> Đã hoàn thành đánh giá</>
                        ) : (
                            <><span className="text-indigo-500">🎯</span> Nhập nội dung bạn nghe được</>
                        )}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                            onClick={() => {
                                setHasStarted(true);
                                replaySentence();
                            }}
                            className="px-3.5 py-1.5 rounded-lg text-sm bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100/50 transition-colors border border-indigo-200/50 flex items-center gap-1.5 font-bold shadow-sm"
                            title={`Dùng phím tắt ${settings.replayKey} + Space để phát lại nhanh`}
                        >
                            <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                            Nghe lại
                        </button>
                        <button
                            onClick={handleShowHint}
                            disabled={isSentenceCompleted}
                            className={`px-3.5 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 font-bold ${isSentenceCompleted ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : showHint
                                ? 'bg-amber-100/50 text-amber-700 border border-amber-300/50 shadow-sm'
                                : 'bg-amber-50/30 text-amber-600 hover:bg-amber-100/50 border border-amber-200/50 shadow-sm'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>
                            Gợi ý {revealedChars > 0 && `(${revealedChars})`}
                        </button>
                        <button
                            onClick={() => setShowOriginal(!showOriginal)}
                            className={`px-3.5 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 font-bold ${showOriginal
                                ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-300/50 shadow-sm'
                                : 'bg-emerald-50/30 text-emerald-600 hover:bg-emerald-100/50 border border-emerald-200/50 shadow-sm'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                            Transcript
                        </button>
                    </div>
                </div>

                {/* Hint Display */}
                {showHint && !isSentenceCompleted && (
                    <div className="mb-4 p-5 bg-amber-50/80 border border-amber-200/50 rounded-xl shadow-sm">
                        <p className="text-xl text-amber-800 font-mono tracking-[0.2em] text-center font-bold">
                            {generateHintText()}
                        </p>
                    </div>
                )}

                {/* Original Transcript */}
                {showOriginal && dictation && (
                    <div className="mb-4 p-5 bg-emerald-50/80 border border-emerald-200/50 rounded-xl shadow-sm">
                        <p className="text-sm text-emerald-800 font-medium leading-relaxed">
                            <strong className="font-extrabold mr-2 uppercase tracking-wider text-xs bg-emerald-100 px-2 py-1 rounded text-emerald-700">Transcript gốc:</strong> {dictation.transcript}
                        </p>
                    </div>
                )}

                {/* Speech Input */}
                {!isSentenceCompleted && (
                    <div className="mb-5">
                        <SpeechInput
                            isRecording={isRecording}
                            setIsRecording={setIsRecording}
                            onTranscript={handleUserInputChange}
                            language={dictation?.language}
                        />
                    </div>
                )}

                {/* Text Input */}
                <textarea
                    ref={inputRef}
                    value={userInput}
                    onChange={(e) => handleUserInputChange(e.target.value)}
                    disabled={isSentenceCompleted}
                    placeholder="Nhập nội dung bạn nghe được..."
                    className={`flex-1 w-full p-5 rounded-xl resize-none min-h-[140px] text-lg leading-relaxed shadow-sm transition-all outline-none font-medium custom-scrollbar
                                ${isSentenceCompleted
                            ? 'bg-slate-50 border border-slate-200/50 text-slate-500 cursor-not-allowed opacity-80'
                            : 'bg-white/60 backdrop-blur-sm border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800'
                        }`}
                />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                    <div className="text-sm font-bold text-slate-400 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/50">
                        {userInput.length} ký tự
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {isSentenceCompleted ? (
                            <>
                                <button
                                    onClick={handleReset}
                                    className="px-6 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold shadow-sm flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                    Viết Lại
                                </button>
                                <button
                                    onClick={handleNextSentence}
                                    className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex-1 sm:flex-none flex justify-center items-center gap-2 hover:-translate-y-0.5"
                                >
                                    {currentSentenceIndex < sentences.length - 1 ? (
                                        <>Câu Tiếp Theo <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></>
                                    ) : (
                                        <>Hoàn Thành Bài Tập <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg></>
                                    )}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={submitAttempt}
                                disabled={!userInput.trim() || isSubmitting}
                                className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all ${!userInput.trim() || isSubmitting
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang nộp...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                                        Chấm Điểm
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Keyboard Shortcuts Hint */}
                {itemsPerPage && <div className="mt-6 pt-5 border-t border-slate-200/50 flex flex-wrap justify-center sm:justify-start gap-4 text-[11px] text-slate-400 font-bold tracking-wide uppercase">
                    <span className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-500 shadow-sm font-sans">{settings.replayKey}</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-500 shadow-sm font-sans">Space</kbd> Nghe lại</span>
                    <span className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-500 shadow-sm font-sans">{settings.replayKey}</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-500 shadow-sm font-sans">Enter</kbd> Nộp bài</span>
                    <span className="flex items-center gap-2"><kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-500 shadow-sm font-sans">{settings.replayKey}</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-500 shadow-sm font-sans">→</kbd> Chuyển câu</span>
                </div>}
            </div>

            {/* Results Section */}
            {
                currentResult && (
                    <div ref={resultsRef} className="glass-panel rounded-3xl p-8 animate-in slide-in-from-bottom-5 fade-in duration-500 mt-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 relative z-10">
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                <span className="p-2 bg-emerald-100/50 text-emerald-600 rounded-xl">📊</span> Kết Quả Câu {currentSentenceIndex + 1}
                            </h2>
                            {getAccuracyBadge(currentResult.analysis.accuracy)}
                        </div>

                        {/* Score Display */}
                        <div className="grid grid-cols-3 gap-6 mb-8 relative z-10">
                            <div className="text-center p-5 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 rounded-2xl border border-indigo-100/50 shadow-sm">
                                <p className="text-4xl font-black text-indigo-600 tracking-tight">{currentResult.analysis.score}</p>
                                <p className="text-xs font-bold text-indigo-500 mt-2 uppercase tracking-widest">Điểm số</p>
                            </div>
                            <div className="text-center p-5 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl border border-emerald-100/50 shadow-sm">
                                <p className="text-4xl font-black text-emerald-600 tracking-tight">
                                    {currentResult.analysis.accuracy.toFixed(1)}%
                                </p>
                                <p className="text-xs font-bold text-emerald-500 mt-2 uppercase tracking-widest">Chính xác</p>
                            </div>
                            <div className="text-center p-5 bg-gradient-to-br from-rose-50/80 to-pink-50/50 rounded-2xl border border-rose-100/50 shadow-sm">
                                <p className="text-4xl font-black text-rose-600 tracking-tight">
                                    {currentResult.analysis.distance}
                                </p>
                                <p className="text-xs font-bold text-rose-500 mt-2 uppercase tracking-widest">Lỗi sai</p>
                            </div>
                        </div>

                        {/* Wrong Words Analysis */}
                        {currentResult.analysis.wrongWords && currentResult.analysis.wrongWords.length > 0 && (
                            <div className="mb-8 relative z-10">
                                <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                    <span>Các lỗi cần khắc phục</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {currentResult.analysis.wrongWords.map((word, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-4 bg-rose-50/30 border border-rose-100/50 rounded-2xl transition-all hover:border-rose-200 hover:shadow-sm"
                                        >
                                            <span className="px-3 py-1.5 bg-rose-100/80 text-rose-700 rounded-lg text-sm font-mono line-through decoration-rose-400 opacity-90 decoration-2 font-bold shadow-sm">
                                                {word.got || "(trống)"}
                                            </span>
                                            <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                                            </svg>
                                            <span className="px-3 py-1.5 bg-emerald-100/80 text-emerald-800 font-extrabold rounded-lg text-sm font-mono shadow-sm border border-emerald-200/50 flex items-center gap-2">
                                                {settings.strictPronunciation && word.charDiffs && word.charDiffs.length > 0 ? (
                                                    <span className="flex items-center tracking-wide">
                                                        {word.charDiffs.map((diff, i) => {
                                                            if (diff.type === 'correct') return <span key={i} className="text-emerald-800">{diff.char}</span>;
                                                            if (diff.type === 'missing') return <span key={i} className="text-amber-500 border-b-[3px] border-amber-400 bg-amber-50/50 px-0.5 mx-[1px] rounded-sm">{diff.char}</span>;
                                                            if (diff.type === 'wrong') return <span key={i} className="text-rose-600 bg-rose-100/80 px-0.5 mx-[1px] rounded-sm" title={`Bạn đã đọc thành: ${diff.gotChar}`}>{diff.char}</span>;
                                                            if (diff.type === 'extra') return <del key={i} className="text-slate-400 opacity-60 text-[10px] -translate-y-1 mx-[1px]">{diff.char}</del>;
                                                            return null;
                                                        })}
                                                    </span>
                                                ) : (
                                                    <span>{word.expected}</span>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if ('speechSynthesis' in window) {
                                                            window.speechSynthesis.cancel();
                                                            const utterance = new SpeechSynthesisUtterance(word.expected);
                                                            utterance.lang = 'en-US';
                                                            if (settings.ttsSpeed) utterance.rate = settings.ttsSpeed;
                                                            if (settings.ttsVoiceURI) {
                                                                const voices = window.speechSynthesis.getVoices();
                                                                const selectedVoice = voices.find(v => v.voiceURI === settings.ttsVoiceURI);
                                                                if (selectedVoice) utterance.voice = selectedVoice;
                                                            }
                                                            window.speechSynthesis.speak(utterance);
                                                        }
                                                    }}
                                                    className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-200/50 text-emerald-700 hover:bg-emerald-300 hover:text-emerald-900 transition-colors"
                                                    title="Nghe phát âm từ này"
                                                >
                                                    <svg xmlns="http://www.w3.org/0000.svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                                                </button>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Correct Transcript vs User Input */}
                        <div className="space-y-4 relative z-10">
                            <div className="p-6 bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 transition-all hover:bg-slate-50">
                                <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                    Bạn đã viết
                                </p>
                                <p className="text-slate-800 font-medium text-lg leading-relaxed">
                                    {currentResult.attempt.userAnswer || <span className="text-slate-400 italic">(Không có nội dung)</span>}
                                </p>
                            </div>
                            <div className="p-6 bg-emerald-50/50 backdrop-blur-sm rounded-2xl border border-emerald-200/50 relative shadow-sm transition-all hover:shadow-md hover:border-emerald-300/50">
                                <div className="absolute top-0 right-0 p-4">
                                    <span className="flex h-3 w-3 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                                    </span>
                                </div>
                                <p className="text-xs uppercase tracking-widest font-bold text-emerald-600 mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                                    Đáp án hoàn hảo
                                </p>
                                <p className="text-emerald-900 font-bold text-lg leading-relaxed tracking-wide">
                                    {currentResult.correctTranscript}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
        </>
    );
};

export default DictationTab;
