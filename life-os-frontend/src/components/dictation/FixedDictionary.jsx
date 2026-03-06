import React, { useState, useEffect, useCallback } from 'react';
import { vocabularyApi, learningService } from '../../services/api';
import { Sparkles, Volume2, BookmarkPlus, Play, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const FixedDictionary = ({ word, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Gọi API AI Lookup
    useEffect(() => {
        if (!word) {
            setData(null);
            setError(null);
            return;
        }

        const fetchMeaning = async () => {
            setLoading(true);
            setError(null);
            try {
                // Xóa bỏ các dấu câu ở đầu và cuối từ trước khi tra
                const cleanWord = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').toLowerCase();

                if (!cleanWord) {
                    setError('Không có từ hợp lệ');
                    setLoading(false);
                    return;
                }

                // Gọi tới backend Magic Lookup thay vì từ điển public
                const response = await learningService.lookup({ keyword: cleanWord });
                setData(response.data.data); // Axios bọc data 2 lần: res.data.data
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.error || 'Không tìm thấy từ này hoặc AI đang bận.');
            } finally {
                setLoading(false);
            }
        };

        fetchMeaning();
    }, [word]);

    // Play Audio via TTS (Browser)
    const playAudio = useCallback(() => {
        if (!word) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    }, [word]);

    // Auto-play khi hiển thị kết quả
    useEffect(() => {
        if (data) {
            playAudio();
        }
    }, [data, playAudio]);

    const handleSaveVocabulary = async () => {
        if (!data) return;

        const loadingToast = toast.loading('Đang lưu vào sổ tay...');
        try {
            await vocabularyApi.add({
                term: data.word || word,
                definition: data.meaning || '',
                exampleSentence: data.exampleSentence || '',
                // Map the full AI payload exact like Magic Add does
                extraInfo: {
                    phonetic: data.phonetic || '',
                    hanViet: data.hanViet || null,
                    partOfSpeech: data.partOfSpeech || '',
                    exampleTranslation: data.exampleTranslation || '',
                    contextualNuance: data.contextualNuance || '',
                    synonyms: data.synonyms || [],
                    antonyms: data.antonyms || [],
                    collocations: data.collocations || [],
                    wordFamily: data.wordFamily || []
                }
            });

            toast.success('Đã lưu từ vựng thành công!', { id: loadingToast });
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi lưu từ vựng.', { id: loadingToast });
        }
    };

    if (!word) {
        return (
            <div className="flex-1 w-full bg-slate-50/50 border border-slate-200/50 shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <Sparkles className="w-10 h-10 mb-3 text-indigo-300 opacity-50" />
                <h4 className="font-bold text-slate-400">Siêu Từ Điển AI</h4>
                <p className="text-sm text-slate-400 mt-1 max-w-[250px]">
                    Bấm vào một từ bất kỳ trong Phụ đề để gọi AI phân tích toàn diện.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full glass-panel bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100 p-6 animate-in slide-in-from-bottom-2 duration-300 relative flex flex-col overflow-hidden">
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4 shrink-0">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-600 capitalize">
                            {data ? data.word : word}
                        </h3>
                        {data?.phonetic && (
                            <span className="text-sm font-mono font-bold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/50">
                                {data.phonetic}
                            </span>
                        )}
                        <button
                            onClick={playAudio}
                            className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 hover:scale-105 transition-all border border-indigo-100 shadow-sm"
                            title="Nghe phát âm"
                        >
                            <Volume2 className="w-4 h-4" />
                        </button>
                    </div>

                    {data && (
                        <button
                            onClick={handleSaveVocabulary}
                            className="w-fit text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm mt-1"
                        >
                            <BookmarkPlus className="w-4 h-4" />
                            Lưu vào sổ tay
                        </button>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-500 transition-colors border border-transparent hover:border-rose-100"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    <span className="text-sm text-indigo-400 font-medium animate-pulse">AI đang phân tích ngữ cảnh...</span>
                </div>
            ) : error ? (
                <p className="text-rose-500 font-medium text-sm py-4 text-center bg-rose-50 rounded-lg">{error}</p>
            ) : data && (
                <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">

                    {/* Meaning & Part of Speech */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-block text-[11px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 px-2.5 py-1 rounded-md border border-violet-100 shadow-sm">
                                {data.partOfSpeech || 'Từ vựng'}
                            </span>
                            {data.hanViet && (
                                <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                                    {data.hanViet}
                                </span>
                            )}
                        </div>
                        <p className="text-lg text-slate-800 font-medium">{data.meaning}</p>
                    </div>

                    {/* Example */}
                    {data.exampleSentence && (
                        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                            <p className="text-slate-700 font-medium italic mb-1">"{data.exampleSentence}"</p>
                            <p className="text-slate-500">{data.exampleTranslation}</p>
                        </div>
                    )}

                    {/* Contextual Nuance */}
                    {data.contextualNuance && (
                        <div className="bg-amber-50/80 border border-amber-200/60 p-4 rounded-xl mb-6 shadow-sm">
                            <h4 className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-widest mb-2">
                                <Info size={14} className="text-amber-600" /> Ngữ cảnh tinh tế
                            </h4>
                            <p className="text-sm text-amber-900 leading-relaxed">
                                {data.contextualNuance.replace('GIẢI THÍCH CHUYÊN SÂU:', '').trim()}
                            </p>
                        </div>
                    )}

                    {/* Rich Data Chips: Synonyms, Antonyms, Collocations, Word Family */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.synonyms?.length > 0 && (
                            <div>
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Đồng nghĩa</h5>
                                <div className="flex flex-wrap gap-1.5">
                                    {data.synonyms.map((item, idx) => (
                                        <span key={idx} className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-1 rounded-md border border-indigo-100">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.antonyms?.length > 0 && (
                            <div>
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Trái nghĩa</h5>
                                <div className="flex flex-wrap gap-1.5">
                                    {data.antonyms.map((item, idx) => (
                                        <span key={idx} className="text-xs bg-rose-50 text-rose-700 font-medium px-2 py-1 rounded-md border border-rose-100">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.collocations?.length > 0 && (
                            <div className="md:col-span-2">
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Cụm từ đi kèm (Collocations)</h5>
                                <div className="flex flex-wrap gap-2">
                                    {data.collocations.map((item, idx) => (
                                        <span key={idx} className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1.5 rounded-md border border-emerald-100">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.wordFamily?.length > 0 && (
                            <div className="md:col-span-2">
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Họ từ (Word Family)</h5>
                                <div className="flex flex-wrap gap-2">
                                    {data.wordFamily.map((item, idx) => (
                                        <span key={idx} className="text-xs bg-violet-50 text-violet-700 font-medium px-2.5 py-1.5 rounded-md border border-violet-100">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FixedDictionary;
