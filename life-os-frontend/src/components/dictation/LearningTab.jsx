import React from 'react';
import SpeechInput from './SpeechInput';
const LearningTab = ({
    itemsPerPage, setItemsPerPage, setCurrentPageDictation, setCurrentPageLearning,
    currentSentencesLearning, currentPageLearning, totalPages,
    currentSentenceIndex, setCurrentSentenceIndex, setHasStarted, replaySentence,
    activeTab, blankConfigs, blankAnswers, setBlankAnswers, showBlankHints, setShowBlankHints,
    isPlaying, setIsPlaying, playerRef, isYouTubeUrl,
    handleWordClick, sentenceListRef, shadowScores, shadowingIndex, setShadowingIndex,
    isShadowRecording, setIsShadowRecording, shadowTranscript, setShadowTranscript,
    handleShadowSubmit, dictation, settings, selectedWord, setSelectedWord
}) => {
    return (
        <div className="glass-panel rounded-2xl p-6 min-h-[500px] flex flex-col relative animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/50 pb-5 gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <span className="text-indigo-500">📚</span> Phụ đề Song ngữ
                    </h2>
                    <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m15 11 4.54-4.54a2 2 0 1 1 2.82 2.82L17.83 13.84a1 1 0 0 1-1.41 0L15 12.42A1 1 0 0 1 15 11Z" /><path d="m14 10 3-3" /><path d="m8 6 3-3" /><path d="m9.67 15.65 1.4-1.4a.5.5 0 0 0-.02-.73l-1.9-1.9a.5.5 0 0 0-.71 0l-1.42 1.41a.5.5 0 0 0 0 .71l1.91 1.91a.5.5 0 0 0 .74 0Z" /><path d="M2.5 17.5 7 13" /><path d="m13 7 4.5 4.5" /></svg>
                        Click vào từ tiếng Anh bất kỳ để tra từ điển nhanh
                    </p>
                </div>
                <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hiển thị:</label>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            const val = e.target.value;
                            setItemsPerPage(val === 'all' ? 'all' : Number(val));
                            setCurrentPageDictation(1);
                            setCurrentPageLearning(1);
                        }}
                        className="border border-slate-200/60 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 bg-white/60 backdrop-blur-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer appearance-none pr-8 relative w-full sm:w-auto"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
                    >
                        <option value={10}>10 câu / trang</option>
                        <option value={20}>20 câu / trang</option>
                        <option value={50}>50 câu / trang</option>
                        <option value={100}>100 câu / trang</option>
                        <option value={500}>500 câu / trang</option>
                        <option value="all">Tất cả</option>
                    </select>
                </div>
            </div>

            <div
                className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar relative pb-10"
                style={{ maxHeight: '600px' }}
                ref={sentenceListRef}
            >
                {currentSentencesLearning.map((sentence, idx) => {
                    const actualIndex = itemsPerPage === 'all' ? idx : (currentPageLearning - 1) * itemsPerPage + idx;
                    return (
                        <div
                            key={actualIndex}
                            data-index={actualIndex}
                            onClick={() => {
                                setCurrentSentenceIndex(actualIndex);
                                setHasStarted(true);
                                replaySentence(null, sentence);
                            }}
                            className={`p-5 rounded-2xl transition-all duration-300 cursor-pointer border group ${actualIndex === currentSentenceIndex ? 'bg-indigo-50/80 border-indigo-200 shadow-md scale-[1.01] relative z-10' : 'bg-slate-50 border-slate-100/50 hover:bg-white hover:border-slate-200 hover:shadow-sm hover:scale-[1.005]'}`}
                        >
                            <div className="flex gap-4 sm:gap-5">
                                {/* Time indicator */}
                                <div className="text-xs font-mono font-bold text-slate-400 shrink-0 mt-1 flex flex-col items-center gap-1.5">
                                    <span className={`w-7 h-7 flex items-center justify-center rounded-full ${actualIndex === currentSentenceIndex ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>{actualIndex + 1}</span>
                                    <span className="opacity-70">{new Date(sentence.startTime * 1000).toISOString().substr(14, 5)}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className={`text-lg leading-relaxed ${actualIndex === currentSentenceIndex ? 'text-indigo-900 font-bold' : 'text-slate-700 font-medium'}`}>
                                        {sentence.text.split(' ').map((word, wIdx) => {
                                            const cleanWord = word.replace(/[.,!?"]/g, '');
                                            const isBlank = activeTab === 'blanks' && (blankConfigs[actualIndex] || []).includes(wIdx);

                                            if (isBlank) {
                                                const ans = blankAnswers[actualIndex]?.[wIdx] || '';
                                                const isCorrect = ans.toLowerCase() === cleanWord.toLowerCase();
                                                const showHintWord = showBlankHints[`${actualIndex}-${wIdx}`];
                                                return (
                                                    <span key={wIdx} className="inline-flex items-center gap-1.5 mx-1" onClick={e => e.stopPropagation()}>
                                                        <input
                                                            type="text"
                                                            value={ans}
                                                            onChange={(e) => {
                                                                setBlankAnswers(prev => ({
                                                                    ...prev,
                                                                    [actualIndex]: { ...(prev[actualIndex] || {}), [wIdx]: e.target.value }
                                                                }));
                                                                // Auto resume if correct and video paused
                                                                if (e.target.value.toLowerCase() === cleanWord.toLowerCase() && !isPlaying) {
                                                                    if (isYouTubeUrl && playerRef.current) {
                                                                        playerRef.current.getInternalPlayer().playVideo();
                                                                    } else if (!isYouTubeUrl && playerRef.current) {
                                                                        playerRef.current.play();
                                                                    }
                                                                    setIsPlaying(true);
                                                                }
                                                            }}
                                                            className={`w-${Math.max(4, cleanWord.length)} min-w-[3.5rem] px-2.5 py-1 text-center text-sm font-bold rounded-lg border outline-none transition-all shadow-sm ${isCorrect ? 'bg-emerald-100 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white text-indigo-700 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`}
                                                            placeholder={showHintWord ? cleanWord.substring(0, 1) + '...' : ''}
                                                        />
                                                        {/* Hint Button */}
                                                        {!isCorrect && <button onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowBlankHints(prev => ({ ...prev, [`${actualIndex}-${wIdx}`]: true }));
                                                        }} className="text-amber-300 hover:text-amber-500 transition-colors p-1" title="Gợi ý"><svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg></button>}
                                                        <span className={actualIndex === currentSentenceIndex ? 'text-indigo-900' : 'text-slate-700'}>{word.replace(cleanWord, '')}</span>
                                                        {' '}
                                                    </span>
                                                );
                                            }

                                            return cleanWord ? (
                                                <span
                                                    key={wIdx}
                                                    className={`hover:bg-indigo-100 hover:text-indigo-700 rounded-md px-1 py-0.5 transition-colors cursor-pointer ${actualIndex === currentSentenceIndex ? 'hover:bg-indigo-200/50' : ''}`}
                                                    onClick={(e) => handleWordClick(word, e)}
                                                >
                                                    {word}{' '}
                                                </span>
                                            ) : (
                                                <span key={wIdx}>{word} </span>
                                            );
                                        })}
                                    </div>
                                    {/* Translation */}
                                    {sentence.translation && (
                                        <div className="text-sm font-medium text-slate-500/80 mt-2 italic flex items-start gap-2">
                                            <span className="mt-0.5 opacity-50"><svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg></span>
                                            {sentence.translation}
                                        </div>
                                    )}

                                    {/* Shadowing Results */}
                                    {shadowScores[actualIndex] && (
                                        <div className="mt-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 shadow-sm animate-in zoom-in-95 duration-300">
                                            <div className="flex items-center gap-3 mb-2.5">
                                                <span className="text-sm font-bold text-indigo-700 flex items-center gap-1.5"><svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg> {shadowScores[actualIndex].score}</span>
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded shadow-sm border border-emerald-100/50">{shadowScores[actualIndex].accuracy.toFixed(1)}%</span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-700 mb-2 border-l-[3px] border-indigo-200 pl-3 italic">
                                                "{shadowScores[actualIndex].attempt}"
                                            </div>

                                            {/* Highlighting wrong words for shadowing */}
                                            {shadowScores[actualIndex].wrongWords && shadowScores[actualIndex].wrongWords.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-indigo-100/50 flex flex-wrap gap-2">
                                                    {shadowScores[actualIndex].wrongWords.map((wordObj, wIdx) => (
                                                        <div key={wIdx} className="inline-flex items-center text-xs bg-white border border-rose-100 rounded-lg px-2 py-1 shadow-sm font-mono">
                                                            <span className="text-rose-500 line-through decoration-rose-300 mr-1.5 font-bold opacity-90">{wordObj.got || '(trống)'}</span>
                                                            <svg xmlns="http://www.w3.org/0000.svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mx-0.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                                            <span className="text-emerald-700 font-extrabold ml-1.5 flex tracking-wide">
                                                                {settings.strictPronunciation && wordObj.charDiffs && wordObj.charDiffs.length > 0 ? (
                                                                    wordObj.charDiffs.map((diff, i) => {
                                                                        if (diff.type === 'correct') return <span key={i} className="text-emerald-700">{diff.char}</span>;
                                                                        if (diff.type === 'missing') return <span key={i} className="text-amber-500 border-b-2 border-amber-400 bg-amber-50 px-[1px] mx-[1px] rounded-sm">{diff.char}</span>;
                                                                        if (diff.type === 'wrong') return <span key={i} className="text-rose-600 bg-rose-100/80 px-[1px] mx-[1px] rounded-sm" title={`Bạn đọc: ${diff.gotChar}`}>{diff.char}</span>;
                                                                        if (diff.type === 'extra') return <del key={i} className="text-slate-400 opacity-60 text-[9px] -translate-y-1 inline-block mx-[1px]">{diff.char}</del>;
                                                                        return null;
                                                                    })
                                                                ) : (
                                                                    <span>{wordObj.expected}</span>
                                                                )}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if ('speechSynthesis' in window) {
                                                                        window.speechSynthesis.cancel();
                                                                        const utterance = new SpeechSynthesisUtterance(wordObj.expected);
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
                                                                className="ml-2 text-indigo-400 hover:text-indigo-600 focus:outline-none bg-indigo-50 hover:bg-indigo-100 rounded-full p-1 transition-colors"
                                                                title="Nghe phát âm từ này"
                                                            >
                                                                <svg xmlns="http://www.w3.org/0000.svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Shadowing UI */}
                                    {shadowingIndex === actualIndex && (
                                        <div className="mt-4 glass-panel bg-white/50 p-5 rounded-2xl border border-slate-200/60 shadow-inner animate-in slide-in-from-top-2 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                                            <div className="flex justify-between items-center mb-4 relative z-10">
                                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                    <span className="flex h-2 w-2 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                                    </span>
                                                    Luyện đọc (Shadowing)
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setShadowingIndex(null); }}
                                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100/80 border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm"
                                                >
                                                    <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                </button>
                                            </div>
                                            <div className="className-relative z-10">
                                                <SpeechInput
                                                    isRecording={isShadowRecording}
                                                    setIsRecording={setIsShadowRecording}
                                                    onTranscript={(text) => setShadowTranscript(text)}
                                                    language={dictation.language}
                                                    placeholder="Nhấn Micro và nói rõ ràng..."
                                                />
                                            </div>
                                            <div className="mt-4 flex justify-end relative z-10">
                                                <button
                                                    onClick={() => handleShadowSubmit(actualIndex)}
                                                    disabled={!shadowTranscript.trim() || isShadowRecording}
                                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${!shadowTranscript.trim() || isShadowRecording ? 'bg-slate-100 border border-slate-200/50 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:shadow-md hover:shadow-indigo-500/20 transform hover:-translate-y-0.5'}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" /><path d="m9 12 2 2 4-4" /></svg>
                                                    Chấm Điểm Phát Âm
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2.5 shrink-0 justify-start pt-1 sm:pt-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShadowingIndex(actualIndex);
                                            setIsShadowRecording(false);
                                            setShadowTranscript('');
                                        }}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border shadow-sm ${shadowingIndex === actualIndex ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/30' : 'bg-indigo-50/80 text-indigo-600 hover:bg-indigo-100 hover:-translate-y-0.5 border-indigo-100/80'}`}
                                        title="Luyện đọc câu này"
                                    >
                                        <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if ('speechSynthesis' in window) {
                                                window.speechSynthesis.cancel();
                                                const utterance = new SpeechSynthesisUtterance(sentence.text);
                                                utterance.lang = dictation?.language === 'Vietnamese' ? 'vi-VN' : 'en-US';
                                                window.speechSynthesis.speak(utterance);
                                            }
                                        }}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-fuchsia-50/80 text-fuchsia-600 hover:bg-fuchsia-100 hover:-translate-y-0.5 transition-all border border-fuchsia-100/80 shadow-sm"
                                        title="Đọc mẫu câu này"
                                    >
                                        <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Pagination Controls cho Learning/Blanks Tab */}
            {itemsPerPage !== 'all' && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-5 border-t border-slate-200/50 gap-4">
                    <div className="text-sm font-bold text-slate-500">
                        Đang hiển thị <span className="text-indigo-600 text-base">{currentSentencesLearning.length}</span> câu / trang
                    </div>
                    <div className="flex justify-center items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setCurrentPageLearning(p => Math.max(1, p - 1))}
                            disabled={currentPageLearning === 1}
                            className="px-3 py-2 bg-white/60 backdrop-blur-sm text-slate-700 rounded-xl border border-slate-200/60 hover:bg-slate-50 disabled:opacity-50 text-sm font-bold transition-all shadow-sm"
                        >
                            <span className="hidden sm:inline">← Trang trước</span>
                            <span className="sm:hidden">←</span>
                        </button>
                        <div className="flex items-center gap-1.5 mx-1 sm:mx-2">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum = currentPageLearning;
                                if (currentPageLearning <= 3) pageNum = i + 1;
                                else if (currentPageLearning >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = currentPageLearning - 2 + i;

                                if (pageNum > 0 && pageNum <= totalPages) {
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPageLearning(pageNum)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${currentPageLearning === pageNum ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20' : 'bg-white/60 backdrop-blur-sm text-slate-600 border border-slate-200/60 hover:bg-slate-50 shadow-sm'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                }
                                return null;
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPageLearning(p => Math.min(totalPages, p + 1))}
                            disabled={currentPageLearning === totalPages}
                            className="px-3 py-2 bg-white/60 backdrop-blur-sm text-slate-700 rounded-xl border border-slate-200/60 hover:bg-slate-50 disabled:opacity-50 text-sm font-bold transition-all shadow-sm"
                        >
                            <span className="hidden sm:inline">Trang sau →</span>
                            <span className="sm:hidden">→</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Dictionary Selection Handled in Parent Component via handleWordClick */}
        </div>
    );
};

export default LearningTab;
