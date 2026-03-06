import React, { useState, useEffect } from 'react';
import { dictationApi, userApi } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';

const EditDictation = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [dictation, setDictation] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    // Undo/Redo state
    const [sentenceHistory, setSentenceHistory] = useState([]);
    const [sentenceFuture, setSentenceFuture] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [customCategories, setCustomCategories] = useState([]);
    const [existingCategories, setExistingCategories] = useState([]);

    const categories = [
        'Công nghệ', 'Kinh doanh', 'Khoa học', 'Giải trí', 'Học thuật',
        'Giao tiếp', 'Du lịch', 'Tin tức', 'General'
    ];

    useEffect(() => {
        const fetchDictation = async () => {
            try {
                const response = await dictationApi.getById(id);
                setDictation(response.data);
                setSentenceHistory([]);
                setSentenceFuture([]);
            } catch (err) {
                console.error('Error fetching dictation:', err);
                setError('Không thể tải dữ liệu bài học. ' + (err.response?.data?.error || err.message));
            } finally {
                setLoading(false);
            }
        };
        const fetchPreferencesAndCategories = async () => {
            try {
                const [prefRes, dictRes] = await Promise.all([
                    userApi.getPreferences(),
                    dictationApi.getAll()
                ]);

                if (prefRes.data && prefRes.data.dictationFolders) {
                    setCustomCategories(prefRes.data.dictationFolders);
                }

                if (dictRes.data) {
                    const dynamicCats = [...new Set(dictRes.data.map(d => d.category || 'General'))];
                    setExistingCategories(dynamicCats);
                }
            } catch (error) {
                console.error('Error loading preferences or categories:', error);
            }
        };

        fetchDictation();
        fetchPreferencesAndCategories();
    }, [id]);

    const handleCreateFolder = async () => {
        const folderName = window.prompt("Nhập tên thư mục mới:");
        if (!folderName || folderName.trim() === '') return;

        const newFolderName = folderName.trim();
        if (customCategories.includes(newFolderName) || categories.includes(newFolderName)) {
            alert('Thư mục này đã tồn tại!');
            return;
        }

        try {
            const updatedFolders = [...customCategories, newFolderName];
            await userApi.updatePreferences({ dictationFolders: updatedFolders });
            setCustomCategories(updatedFolders);
            // Optionally, select the newly created folder right away
            setDictation({ ...dictation, category: newFolderName });
        } catch (error) {
            console.error('Error creating folder:', error);
            alert('Lỗi tạo thư mục: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleUpdateSentence = (index, field, value) => {
        const newSentences = [...dictation.sentences];
        newSentences[index] = { ...newSentences[index], [field]: value };
        setDictation({ ...dictation, sentences: newSentences });
    };

    const saveHistory = () => {
        if (dictation && dictation.sentences) {
            setSentenceHistory(prev => [...prev, dictation.sentences]);
            setSentenceFuture([]);
        }
    };

    const handleUndo = () => {
        if (sentenceHistory.length > 0) {
            const currentSentences = dictation.sentences;
            const prevSentences = sentenceHistory[sentenceHistory.length - 1];

            setSentenceFuture(prev => [currentSentences, ...prev]);
            setSentenceHistory(prev => prev.slice(0, prev.length - 1));

            setDictation({ ...dictation, sentences: prevSentences });
        }
    };

    const handleRedo = () => {
        if (sentenceFuture.length > 0) {
            const currentSentences = dictation.sentences;
            const nextSentences = sentenceFuture[0];

            setSentenceHistory(prev => [...prev, currentSentences]);
            setSentenceFuture(prev => prev.slice(1));

            setDictation({ ...dictation, sentences: nextSentences });
        }
    };

    const handleAddSentence = () => {
        saveHistory();
        setDictation({
            ...dictation,
            sentences: [...(dictation.sentences || []), { text: '', startTime: 0, endTime: 0 }]
        });
    };

    const handleRemoveSentence = (index) => {
        saveHistory();
        setDictation({
            ...dictation,
            sentences: dictation.sentences.filter((_, i) => i !== index)
        });
    };

    const handleMergeSentence = (index) => {
        if (!dictation.sentences || index >= dictation.sentences.length - 1) return;
        saveHistory();
        const current = dictation.sentences[index];
        const next = dictation.sentences[index + 1];

        const newSentence = {
            text: `${current.text} ${next.text}`,
            startTime: current.startTime,
            endTime: next.endTime
        };

        const newSentences = [...dictation.sentences];
        newSentences.splice(index, 2, newSentence);
        setDictation({ ...dictation, sentences: newSentences });
    };

    const handleAutoSplit = () => {
        if (!dictation.transcript) return;
        saveHistory();

        const rawSentences = dictation.transcript
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        let currentTime = 0;
        const sentencesWithTime = rawSentences.map(text => {
            const duration = Math.max(2, text.length / 5);
            const sentence = {
                text,
                startTime: Number(currentTime.toFixed(1)),
                endTime: Number((currentTime + duration).toFixed(1))
            };
            currentTime += duration + 0.5;
            return sentence;
        });

        setDictation({ ...dictation, sentences: sentencesWithTime });
    };

    const handleSplitSentence = (index) => {
        saveHistory();
        const sentence = dictation.sentences[index];
        const text = sentence.text;
        const middle = Math.floor(text.length / 2);

        // Find nearest space to middle
        let splitIndex = text.lastIndexOf(' ', middle);
        if (splitIndex === -1) splitIndex = text.indexOf(' ', middle);
        if (splitIndex === -1) splitIndex = middle; // Fallback to exact middle

        const part1 = text.substring(0, splitIndex).trim();
        const part2 = text.substring(splitIndex).trim();

        const duration = sentence.endTime - sentence.startTime;
        const part1Duration = Number((duration / 2).toFixed(1));

        const newSentence1 = {
            text: part1,
            startTime: sentence.startTime,
            endTime: Number((sentence.startTime + part1Duration).toFixed(1))
        };
        const newSentence2 = {
            text: part2,
            startTime: Number((sentence.startTime + part1Duration).toFixed(1)),
            endTime: sentence.endTime
        };

        const newSentences = [...dictation.sentences];
        newSentences.splice(index, 1, newSentence1, newSentence2);
        setDictation({ ...dictation, sentences: newSentences });
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            await dictationApi.update(id, {
                title: dictation.title,
                transcript: dictation.transcript,
                sentences: dictation.sentences,
                difficulty: dictation.difficulty,
                language: dictation.language,
                category: dictation.category,
                tags: dictation.tags || [],
                vocabulary: dictation.vocabulary,
                summary: dictation.summary
            });
            alert('✅ Cập nhật bài học thành công!');
            navigate('/dictations');
        } catch (err) {
            console.error('Error updating dictation:', err);
            setError('Lỗi khi lưu bài học: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100 opacity-20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-slate-500 font-medium animate-pulse">Đang tải dữ liệu bài học...</p>
            </div>
        );
    }

    // Pagination logic
    const totalItems = dictation?.sentences?.length || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSentences = dictation?.sentences?.slice(indexOfFirstItem, indexOfLastItem) || [];

    if (error && !dictation) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-2xl text-red-600 mb-6 shadow-sm inline-block w-full max-w-lg">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 text-red-600">
                        <svg xmlns="http://www.w3.org/0000.svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                    </div>
                    <p className="font-medium text-lg mb-1">Lỗi kết nối dữ liệu</p>
                    <p className="text-sm opacity-80">{error}</p>
                </div>
                <div>
                    <button
                        onClick={() => navigate('/dictations')}
                        className="px-6 py-2.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium shadow-sm inline-flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-600 mb-2 tracking-tight">
                        Chỉnh Sửa Bài Học
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                        Cập nhật thông tin, nội dung transcript hoặc điều chỉnh thời gian
                    </p>
                </div>
                <button
                    onClick={() => navigate('/dictations')}
                    className="group flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200/80 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all shadow-sm font-medium"
                >
                    <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
                    Quay lại
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-xl text-red-600 flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/0000.svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                    <span className="font-medium">{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column: Settings */}
                <div className="lg:col-span-1">
                    <div className="glass-panel rounded-2xl p-6 md:p-8 sticky top-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/0000.svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                            Cài Đặt Bài Học
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
                                    Tiêu đề bài học <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={dictation.title}
                                    onChange={(e) => setDictation({ ...dictation, title: e.target.value })}
                                    placeholder="Nhập tiêu đề (VD: Hội thoại công sở...)"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 outline-none placeholder:text-slate-400"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
                                        Ngôn ngữ
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={dictation.language}
                                            onChange={(e) => setDictation({ ...dictation, language: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="en">🇺🇸 Tiếng Anh</option>
                                            <option value="vi">🇻🇳 Tiếng Việt</option>
                                            <option value="ja">🇯🇵 Tiếng Nhật</option>
                                            <option value="ko">🇰🇷 Tiếng Hàn</option>
                                            <option value="zh">🇨🇳 Tiếng Trung</option>
                                            <option value="fr">🇫🇷 Tiếng Pháp</option>
                                            <option value="de">🇩🇪 Tiếng Đức</option>
                                            <option value="es">🇪🇸 Tiếng Tây Ban Nha</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
                                        Độ khó
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={dictation.difficulty}
                                            onChange={(e) => setDictation({ ...dictation, difficulty: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="easy">🟢 Dễ</option>
                                            <option value="medium">🟡 Trung bình</option>
                                            <option value="hard">🔴 Khó</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
                                    Thư mục / Danh mục
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <select
                                            value={dictation.category}
                                            onChange={(e) => setDictation({ ...dictation, category: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 outline-none appearance-none cursor-pointer"
                                        >
                                            {[...new Set([...categories, ...customCategories, ...existingCategories])].map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCreateFolder}
                                        className="px-4 py-2.5 bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl transition-colors font-semibold shadow-sm flex items-center gap-1 shrink-0"
                                        title="Tạo Thư Mục Mới"
                                    >
                                        <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                                        Tạo
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1 flex items-center justify-between">
                                    <span>Thẻ (Tags)</span>
                                    <span className="text-xs text-slate-400 font-medium font-normal">Nhấn Enter để thêm</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" /><path d="M7 7h.01" /></svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const newTag = tagInput.trim();
                                                const currentTags = dictation.tags || [];
                                                if (newTag && !currentTags.includes(newTag)) {
                                                    setDictation({ ...dictation, tags: [...currentTags, newTag] });
                                                    setTagInput('');
                                                }
                                            }
                                        }}
                                        placeholder="VD: IELTS, Giao Tiếp..."
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 outline-none placeholder:text-slate-400"
                                    />
                                </div>

                                {dictation.tags && dictation.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {dictation.tags.map((tag, i) => (
                                            <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 shadow-sm text-slate-600 rounded-lg text-xs font-semibold group hover:border-indigo-200 hover:text-indigo-700 transition-colors">
                                                <span className="text-indigo-400">#</span>{tag}
                                                <button
                                                    onClick={() => setDictation({ ...dictation, tags: dictation.tags.filter((_, idx) => idx !== i) })}
                                                    className="text-slate-400 hover:text-red-500 p-0.5 rounded-full hover:bg-red-50 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/0000.svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-5 mt-2 border-t border-slate-200/60">
                                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                                    Thống Kê Nội Dung
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm font-medium">
                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col gap-1">
                                        <span className="text-slate-400 text-xs">Nguồn</span>
                                        <span className="text-slate-800 flex items-center gap-1.5">
                                            {dictation.sourceType === 'youtube' ? (
                                                <><svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg> YouTube</>
                                            ) : dictation.sourceType === 'file' ? (
                                                <><svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg> Audio/Video</>
                                            ) : (
                                                <><svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg> Thủ Công</>
                                            )}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col gap-1">
                                        <span className="text-slate-400 text-xs">Số câu</span>
                                        <span className="text-slate-800">{dictation.sentences?.length || 0}</span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col gap-1">
                                        <span className="text-slate-400 text-xs">Từ vựng</span>
                                        <span className="text-slate-800">{dictation.vocabulary?.length || 0}</span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col gap-1">
                                        <span className="text-slate-400 text-xs">Thời lượng</span>
                                        <span className="text-slate-800">{dictation.duration ? `${Math.round(dictation.duration)}s` : '---'}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`w-full py-4 mt-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg group relative overflow-hidden ${saving
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
                                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-indigo-500/25 hover:-translate-y-0.5 border border-transparent'
                                    }`}
                            >
                                {saving ? null : <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />}
                                <span className="relative z-10 flex items-center gap-2">
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/0000.svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/0000.svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                                            Lưu Thay Đổi
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Main Content */}
                <div className="lg:col-span-2">
                    <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-sm overflow-hidden">
                        {/* Transcript Editor */}
                        <div className="mb-8">
                            <label className="block text-base font-bold text-slate-800 mb-3 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/0000.svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                    Transcript Gốc
                                </span>
                            </label>
                            <div className="relative group">
                                <textarea
                                    value={dictation.transcript}
                                    onChange={(e) => setDictation({ ...dictation, transcript: e.target.value })}
                                    placeholder="Nội dung bài nghe..."
                                    className="w-full h-[180px] p-4 bg-white border-2 border-slate-200/80 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 leading-relaxed resize-y custom-scrollbar font-medium"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <button
                                    onClick={handleAutoSplit}
                                    disabled={!dictation.transcript}
                                    className="text-sm px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:hover:bg-blue-50 rounded-xl font-bold flex items-center gap-2 transition-colors border border-blue-100 shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
                                    Tự Động Chia Câu Từ Transcript
                                </button>
                                <span className="text-xs font-medium text-slate-400">
                                    {dictation.transcript?.length || 0} ký tự
                                </span>
                            </div>
                        </div>

                        {/* Sentences Editor */}
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200/60">
                                <label className="block text-base font-bold text-slate-800 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/0000.svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></svg>
                                    Danh Sách Câu <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs ml-1">{dictation.sentences?.length || 0}</span>
                                </label>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex bg-slate-100 rounded-lg p-1 mr-2 border border-slate-200 shadow-inner">
                                        <button
                                            onClick={handleUndo}
                                            disabled={sentenceHistory.length === 0}
                                            className="p-1.5 rounded-md text-slate-600 hover:text-indigo-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                                            title="Hoàn tác (Undo)"
                                        >
                                            <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
                                        </button>
                                        <button
                                            onClick={handleRedo}
                                            disabled={sentenceFuture.length === 0}
                                            className="p-1.5 rounded-md text-slate-600 hover:text-indigo-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                                            title="Làm lại (Redo)"
                                        >
                                            <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" /></svg>
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleAddSentence}
                                        className="px-4 py-2 bg-white border border-slate-200 text-emerald-600 shadow-sm rounded-xl text-sm font-bold hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                                        Thêm Câu Trống
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-3 custom-scrollbar">
                                {currentSentences.map((sentence, localIndex) => {
                                    const actualIndex = indexOfFirstItem + localIndex;
                                    return (
                                        <div
                                            key={actualIndex}
                                            className="flex flex-col gap-3 p-4 bg-white border border-slate-200/80 hover:border-indigo-300 shadow-sm rounded-xl group transition-all"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-700 rounded-lg text-sm font-bold shrink-0 ring-1 ring-indigo-200/50 shadow-inner mt-1">
                                                    {actualIndex + 1}
                                                </span>
                                                <textarea
                                                    value={sentence.text}
                                                    onChange={(e) => {
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = e.target.scrollHeight + 'px';
                                                        handleUpdateSentence(actualIndex, 'text', e.target.value);
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = e.target.scrollHeight + 'px';
                                                    }}
                                                    placeholder="Nội dung câu..."
                                                    rows="2"
                                                    className="flex-1 px-4 py-3 bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm md:text-base resize-none overflow-hidden min-h-[44px] leading-relaxed transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                                                />
                                            </div>

                                            <div className="flex flex-wrap items-center justify-end gap-2 ml-11">
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200 shadow-sm mr-auto" title="Thời gian (giây)">
                                                    <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 ml-1"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        value={sentence.startTime}
                                                        onChange={(e) => handleUpdateSentence(actualIndex, 'startTime', parseFloat(e.target.value))}
                                                        className="w-16 px-1 py-1 text-center bg-white border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded outline-none text-sm font-mono font-medium text-slate-700 appearance-none shadow-inner"
                                                        placeholder="0.0"
                                                    />
                                                    <span className="text-slate-400 text-xs font-bold">→</span>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        value={sentence.endTime}
                                                        onChange={(e) => handleUpdateSentence(actualIndex, 'endTime', parseFloat(e.target.value))}
                                                        className="w-16 px-1 py-1 text-center bg-white border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded outline-none text-sm font-mono font-medium text-slate-700 appearance-none shadow-inner"
                                                        placeholder="0.0"
                                                    />
                                                </div>

                                                <div className="flex gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                                    {actualIndex < dictation.sentences.length - 1 && (
                                                        <button
                                                            onClick={() => handleMergeSentence(actualIndex)}
                                                            className="px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200/60 rounded-lg hover:bg-amber-100 hover:text-amber-700 text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                                                            title="Gộp nội dung và thời gian với câu kế tiếp"
                                                        >
                                                            <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                                                            <span className="hidden sm:inline">Gộp câu</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleSplitSentence(actualIndex)}
                                                        className="px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-200/60 rounded-lg hover:bg-purple-100 hover:text-purple-700 text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                                                        title="Chia câu này thành 2 câu nhỏ"
                                                    >
                                                        <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
                                                        <span className="hidden sm:inline">Chia</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveSentence(actualIndex)}
                                                        className="px-3 py-1.5 text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 hover:text-red-600 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                                                        title="Xóa câu này"
                                                    >
                                                        <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
                                                        <span className="hidden sm:inline">Xóa</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination UI */}
                            {totalItems > itemsPerPage && (
                                <div className="flex flex-wrap justify-between items-center mt-6 pt-4 border-t border-slate-200/60 gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-500">Hiển thị:</span>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="border-none bg-slate-50 shadow-sm ring-1 ring-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                                        >
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                            <option value={500}>500</option>
                                            <option value={10000}>Tất cả</option>
                                        </select>
                                        <span className="text-sm font-medium text-slate-500">câu/trang</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl ring-1 ring-slate-200 shadow-sm">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 text-sm font-bold text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                            Trước
                                        </button>
                                        <span className="text-sm font-medium text-slate-400 px-3 flex items-center gap-1">
                                            <span className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded text-xs">{currentPage}</span>
                                            /
                                            <span className="text-xs">{totalPages}</span>
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages || totalPages === 0}
                                            className="px-3 py-1.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 text-sm font-bold text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            Sau
                                            <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditDictation;
