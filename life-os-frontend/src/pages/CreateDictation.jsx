import React, { useState, useRef, useEffect } from 'react';
import { dictationApi, userApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const CreateDictation = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('upload'); // upload, youtube, manual
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Nhập liệu, 2: Xem lại, 3: Hoàn thành
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Undo/Redo state
    const [sentenceHistory, setSentenceHistory] = useState([]);
    const [sentenceFuture, setSentenceFuture] = useState([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    // Form data chung
    const [formData, setFormData] = useState({
        title: '',
        difficulty: 'medium',
        language: 'en',
        category: 'General',
        tags: []
    });
    const [tagInput, setTagInput] = useState('');
    const [customCategories, setCustomCategories] = useState([]);
    const [existingCategories, setExistingCategories] = useState([]);

    useEffect(() => {
        const loadCategories = async () => {
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
                console.error('Error loading categories:', error);
            }
        };
        loadCategories();
    }, []);

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
            setFormData({ ...formData, category: newFolderName });
        } catch (error) {
            console.error('Error creating folder:', error);
            alert('Lỗi tạo thư mục: ' + (error.response?.data?.error || error.message));
        }
    };

    const categories = [
        'Công nghệ', 'Kinh doanh', 'Khoa học', 'Giải trí', 'Học thuật',
        'Giao tiếp', 'Du lịch', 'Tin tức', 'General'
    ];

    // Form cho YouTube
    const [youtubeUrl, setYoutubeUrl] = useState('');

    // Form cho upload file
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    // Form cho phụ đề (SRT)
    const [srtFile, setSrtFile] = useState(null);
    const srtInputRef = useRef(null);

    // Form cho manual
    const [manualData, setManualData] = useState({
        audioUrl: '',
        transcript: '',
        sentences: []
    });
    const [newSentence, setNewSentence] = useState({ text: '', startTime: 0, endTime: 0 });

    // ================== UPLOAD METHOD ==================
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const validTypes = [
                'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg',
                'video/mp4', 'video/webm', 'video/quicktime'
            ];
            if (!validTypes.includes(selectedFile.type)) {
                setError('Vui lòng chọn file audio hoặc video hợp lệ');
                return;
            }
            if (selectedFile.size > 5120 * 1024 * 1024) {
                setError('File quá lớn (tối đa 5GB)');
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleSrtChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.name.endsWith('.srt')) {
                setError('Vui lòng chọn file .srt hợp lệ');
                return;
            }
            setSrtFile(file);
            setError(null);
        }
    };

    const readSrtContent = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    };

    const handleUploadAnalyze = async () => {
        if (!file) {
            setError('Vui lòng chọn file');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('audio', file);
            data.append('title', formData.title || 'Bài học mới');
            data.append('difficulty', formData.difficulty);
            data.append('language', formData.language);
            data.append('category', formData.category);
            data.append('tags', formData.tags.join(','));

            if (srtFile) {
                const srtContent = await readSrtContent(srtFile);
                data.append('srtContent', srtContent);
            }

            setUploadProgress(1); // Set initial progress to show the bar

            const response = await dictationApi.analyzeAudio(data, (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted);
            });

            setAnalysis({
                ...response.data,
                sourceType: 'upload',
                file: file
            });
            setSentenceHistory([]);
            setSentenceFuture([]);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Lỗi khi phân tích file');
        } finally {
            setLoading(false);
            setUploadProgress(0); // Reset after upload finishes
        }
    };

    // ================== YOUTUBE METHOD ==================
    const handleYouTubeAnalyze = async () => {
        if (!youtubeUrl) {
            setError('Vui lòng nhập URL YouTube');
            return;
        }

        // Validate YouTube URL
        const videoId = extractYouTubeId(youtubeUrl);
        if (!videoId) {
            setError('URL YouTube không hợp lệ');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let srtContent = '';
            if (srtFile) {
                srtContent = await readSrtContent(srtFile);
            }

            const response = await dictationApi.analyzeYouTube({
                youtubeUrl,
                title: formData.title,
                difficulty: formData.difficulty,
                language: formData.language,
                category: formData.category,
                tags: formData.tags.join(','),
                srtContent: srtContent
            });

            setAnalysis({
                ...response.data,
                sourceType: 'youtube',
                sourceUrl: youtubeUrl
            });
            setSentenceHistory([]);
            setSentenceFuture([]);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Lỗi khi phân tích video YouTube');
        } finally {
            setLoading(false);
        }
    };

    function extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // ================== MANUAL METHOD ==================
    const handleManualAddSentence = () => {
        if (!newSentence.text.trim()) return;
        setManualData({
            ...manualData,
            sentences: [...manualData.sentences, { ...newSentence }]
        });
        setNewSentence({ text: '', startTime: 0, endTime: 0 });
    };

    const handleManualRemoveSentence = (index) => {
        setManualData({
            ...manualData,
            sentences: manualData.sentences.filter((_, i) => i !== index)
        });
    };

    const handleManualMergeSentence = (index) => {
        if (index >= manualData.sentences.length - 1) return;
        const current = manualData.sentences[index];
        const next = manualData.sentences[index + 1];

        const newSentence = {
            text: `${current.text} ${next.text}`,
            startTime: current.startTime,
            endTime: next.endTime
        };

        const newSentences = [...manualData.sentences];
        newSentences.splice(index, 2, newSentence);
        setManualData({ ...manualData, sentences: newSentences });
    };

    const handleManualAutoSplit = () => {
        if (!manualData.transcript) return;

        const rawSentences = manualData.transcript
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        let currentTime = 0;
        const sentencesWithTime = rawSentences.map(text => {
            const duration = Math.max(2, text.length / 5);
            const sentence = { text, startTime: currentTime, endTime: currentTime + duration };
            currentTime += duration + 0.5;
            return sentence;
        });

        setManualData({ ...manualData, sentences: sentencesWithTime });
    };

    const handleManualSubmit = async () => {
        if (!manualData.audioUrl || !manualData.transcript || manualData.sentences.length === 0) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await dictationApi.save({
                title: formData.title || 'Bài học thủ công',
                audioUrl: manualData.audioUrl,
                transcript: manualData.transcript,
                sentences: manualData.sentences,
                difficulty: formData.difficulty,
                language: formData.language,
                category: formData.category,
                tags: formData.tags,
                sourceType: 'manual'
            });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Lỗi khi lưu bài học');
        } finally {
            setLoading(false);
        }
    };

    // ================== SAVE & EDIT ==================
    const handleSave = async () => {
        setLoading(true);
        setError(null);

        try {
            await dictationApi.save({
                title: formData.title || analysis.videoTitle || analysis.title || 'Bài học mới',
                audioUrl: analysis.sourceType === 'youtube' ? analysis.sourceUrl : analysis.filePath,
                transcript: analysis.transcript,
                sentences: analysis.sentences,
                vocabulary: analysis.vocabulary,
                summary: analysis.summary,
                difficulty: formData.difficulty,
                language: formData.language,
                category: formData.category,
                tags: formData.tags,
                sourceType: analysis.sourceType,
                sourceUrl: analysis.sourceUrl,
                duration: analysis.duration
            });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Lỗi khi lưu bài học');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSentence = (index, field, value) => {
        const newSentences = [...analysis.sentences];
        newSentences[index] = { ...newSentences[index], [field]: value };
        setAnalysis({ ...analysis, sentences: newSentences });
    };

    const saveHistory = () => {
        if (analysis && analysis.sentences) {
            setSentenceHistory(prev => [...prev, analysis.sentences]);
            setSentenceFuture([]);
        }
    };

    const handleUndo = () => {
        if (sentenceHistory.length > 0) {
            const currentSentences = analysis.sentences;
            const prevSentences = sentenceHistory[sentenceHistory.length - 1];

            setSentenceFuture(prev => [currentSentences, ...prev]);
            setSentenceHistory(prev => prev.slice(0, prev.length - 1));

            setAnalysis({ ...analysis, sentences: prevSentences });
        }
    };

    const handleRedo = () => {
        if (sentenceFuture.length > 0) {
            const currentSentences = analysis.sentences;
            const nextSentences = sentenceFuture[0];

            setSentenceHistory(prev => [...prev, currentSentences]);
            setSentenceFuture(prev => prev.slice(1));

            setAnalysis({ ...analysis, sentences: nextSentences });
        }
    };

    const handleAddSentence = () => {
        saveHistory();
        setAnalysis({
            ...analysis,
            sentences: [...analysis.sentences, { text: '', startTime: 0, endTime: 0 }]
        });
    };

    const handleRemoveSentence = (index) => {
        saveHistory();
        setAnalysis({
            ...analysis,
            sentences: analysis.sentences.filter((_, i) => i !== index)
        });
    };

    const handleMergeSentence = (index) => {
        if (index >= analysis.sentences.length - 1) return;
        saveHistory();
        const current = analysis.sentences[index];
        const next = analysis.sentences[index + 1];

        const newSentence = {
            text: `${current.text} ${next.text}`,
            startTime: current.startTime,
            endTime: next.endTime
        };

        const newSentences = [...analysis.sentences];
        newSentences.splice(index, 2, newSentence);
        setAnalysis({ ...analysis, sentences: newSentences });
    };

    const handleReset = () => {
        setStep(1);
        setAnalysis(null);
        setFile(null);
        setSrtFile(null);
        setYoutubeUrl('');
        setManualData({ audioUrl: '', transcript: '', sentences: [] });
        setSentenceHistory([]);
        setSentenceFuture([]);
        setError(null);
    };

    // ================== RENDER ==================
    return (
        <div className="max-w-6xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-600 mb-3 tracking-tight">
                    Thêm Bài Học Mới
                </h1>
                <p className="text-slate-500 text-lg">
                    Chọn phương thức phù hợp để thêm bài học vào thư viện của bạn
                </p>
            </div>

            {/* Success State */}
            {step === 3 ? (
                <div className="glass-panel max-w-2xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50/20" />
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-xl shadow-green-500/20 animate-bounce">
                            ✓
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-800 mb-3">
                            Tạo bài học thành công!
                        </h2>
                        <p className="text-slate-500 text-lg mb-10">
                            Bài học đã được lưu và sẵn sàng để sử dụng.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate('/dictations')}
                                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all font-semibold flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/0000.svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                                Xem danh sách
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-8 py-3.5 bg-white text-slate-700 border border-slate-200/60 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/0000.svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                Thêm bề học khác
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Settings */}
                    <div className="lg:col-span-4">
                        <div className="glass-panel rounded-2xl p-6 sticky top-[88px]">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
                                <svg xmlns="http://www.w3.org/0000.svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                                Cài Đặt Chung
                            </h3>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Tiêu đề bài học
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Nhập tiêu đề hấp dẫn..."
                                        className="w-full px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Ngôn ngữ
                                    </label>
                                    <select
                                        value={formData.language}
                                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all"
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
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Độ khó
                                    </label>
                                    <select
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all"
                                    >
                                        <option value="easy">🟢 Dễ - Dành cho người mới bắt đầu</option>
                                        <option value="medium">🟡 Trung bình - Cần có nền tảng cơ bản</option>
                                        <option value="hard">🔴 Khó - Thử thách cho người học nâng cao</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Chủ đề (Thư mục)
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all"
                                        >
                                            {[...new Set([...categories, ...customCategories, ...existingCategories])].map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={handleCreateFolder}
                                            className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-semibold whitespace-nowrap active:scale-95 flex items-center justify-center border border-indigo-100"
                                            title="Tạo Thư Mục Mới"
                                        >
                                            <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /><line x1="12" x2="12" y1="10" y2="16" /><line x1="9" x2="15" y1="13" y2="13" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Thẻ phân loại (Tags)
                                    </label>
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const newTag = tagInput.trim();
                                                if (newTag && !formData.tags.includes(newTag)) {
                                                    setFormData({ ...formData, tags: [...formData.tags, newTag] });
                                                    setTagInput('');
                                                }
                                            }
                                        }}
                                        placeholder="Nhấn Enter để thêm tag (VD: IELTS, TED)"
                                        className="w-full px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 mb-3"
                                    />
                                    {formData.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formData.tags.map((tag, i) => (
                                                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium shadow-sm">
                                                    #{tag}
                                                    <button
                                                        onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, idx) => idx !== i) })}
                                                        className="text-slate-400 hover:text-red-500 outline-none p-0.5"
                                                    >
                                                        <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-5 mt-5 border-t border-slate-200/60">
                                    <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Thống kê dữ liệu</h4>
                                    <div className="text-sm text-slate-600 space-y-2 font-medium">
                                        <p className="flex justify-between"><span>Phương thức:</span> <span className="text-slate-900">{activeTab === 'upload' ? 'Upload File' : activeTab === 'youtube' ? 'YouTube' : 'Thủ công'}</span></p>
                                        {analysis && (
                                            <>
                                                <p className="flex justify-between"><span>Số câu:</span> <span className="text-slate-900">{analysis.sentences?.length || 0}</span></p>
                                                <p className="flex justify-between"><span>Từ vựng:</span> <span className="text-slate-900">{analysis.vocabulary?.length || 0}</span></p>
                                                {analysis.duration && <p className="flex justify-between"><span>Thời lượng:</span> <span className="text-slate-900">{Math.round(analysis.duration)}s</span></p>}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Main Content */}
                    <div className="lg:col-span-8">
                        {/* Step 1: Input Methods */}
                        {step === 1 && (
                            <div className="glass-panel rounded-2xl p-8">
                                {/* Tabs */}
                                <div className="flex gap-3 mb-8 bg-slate-100/50 p-1.5 rounded-2xl">
                                    {[
                                        { id: 'upload', icon: <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>, label: 'Upload File' },
                                        { id: 'youtube', icon: <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg>, label: 'YouTube' },
                                        { id: 'manual', icon: <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>, label: 'Thủ công' }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                                                ? 'bg-white text-indigo-700 shadow-md ring-1 ring-slate-200/50 scale-[1.02]'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                                                }`}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                        <svg xmlns="http://www.w3.org/0000.svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                        <p className="text-red-700 font-medium">{error}</p>
                                    </div>
                                )}

                                {/* Upload Tab */}
                                {activeTab === 'upload' && (
                                    <div className="space-y-6">
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="group relative border-2 border-dashed border-indigo-200/60 bg-indigo-50/30 rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-300 overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 to-violet-100/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative z-10">
                                                {file ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-md mb-4 group-hover:scale-110 transition-transform">
                                                            <svg xmlns="http://www.w3.org/0000.svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                                                        </div>
                                                        <p className="font-bold text-slate-800 text-lg mb-1 truncate max-w-full px-4">{file.name}</p>
                                                        <p className="text-sm text-slate-500 font-medium bg-slate-100/80 px-3 py-1 rounded-full">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFile(null);
                                                            }}
                                                            className="mt-6 px-4 py-2 bg-white text-red-500 text-sm font-semibold rounded-lg hover:bg-red-50 hover:text-red-600 shadow-sm transition-all"
                                                        >
                                                            Thay đổi file
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-indigo-400 shadow-sm border border-indigo-50 mb-5 group-hover:scale-110 group-hover:shadow-md transition-all duration-500">
                                                            <svg xmlns="http://www.w3.org/0000.svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                                        </div>
                                                        <p className="font-bold text-slate-700 text-xl mb-2">
                                                            Kéo thả hoặc click để chọn file
                                                        </p>
                                                        <p className="text-sm font-medium text-slate-500">
                                                            Hỗ trợ: MP3, WAV, M4A, MP4, WebM
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-2 bg-slate-100/50 px-3 py-1 rounded-full">
                                                            Tối đa 5GB
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="audio/*,video/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </div>

                                        {/* Tùy chọn SRT */}
                                        <div className="mt-4 p-4 border border-blue-100 bg-blue-50 rounded-lg">
                                            <label className="block text-sm font-medium text-blue-800 mb-2">
                                                ⚡ Tùy chọn: Chọn file phụ đề (.srt) để phân tích siêu tốc
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => srtInputRef.current?.click()}
                                                    className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm text-blue-700 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500"
                                                >
                                                    Tải lên file .srt
                                                </button>
                                                <span className="text-sm text-gray-600 truncate max-w-[200px]">
                                                    {srtFile ? srtFile.name : 'Chưa chọn file'}
                                                </span>
                                                {srtFile && (
                                                    <button
                                                        onClick={() => setSrtFile(null)}
                                                        className="text-red-500 hover:text-red-700 text-sm"
                                                    >
                                                        ✖ Bỏ chọn
                                                    </button>
                                                )}
                                                <input
                                                    ref={srtInputRef}
                                                    type="file"
                                                    accept=".srt"
                                                    onChange={handleSrtChange}
                                                    className="hidden"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleUploadAnalyze}
                                            disabled={!file || loading}
                                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 relative overflow-hidden group ${!file || loading
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-indigo-500/30 hover:-translate-y-0.5'
                                                }`}
                                        >
                                            {(!file || loading) ? null : <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />}
                                            <span className="relative z-10 flex items-center gap-2">
                                                {loading ? (
                                                    <>
                                                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        {uploadProgress > 0 && uploadProgress < 100
                                                            ? `Đang tải lên... ${uploadProgress}%`
                                                            : 'AI đang phân tích & xử lý dữ liệu...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/0000.svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><line x1="9" y1="10" x2="15" y2="10" /><line x1="12" y1="7" x2="12" y2="13" /></svg>
                                                        Bắt đầu Phân Tích bằng AI
                                                    </>
                                                )}
                                            </span>
                                        </button>

                                        {/* Progress Bar UI */}
                                        {loading && uploadProgress > 0 && (
                                            <div className="mt-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                                <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
                                                    <span>{uploadProgress < 100 ? 'Đang truyền tệp tin lên máy chủ...' : 'Đang tiến hành nhận dạng và phân tích...'}</span>
                                                    <span className="text-indigo-600">{uploadProgress}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200/60 rounded-full h-3 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-300 relative ${uploadProgress === 100 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
                                                        style={{ width: `${uploadProgress}%` }}
                                                    >
                                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* YouTube Tab */}
                                {activeTab === 'youtube' && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Nhập URL Video YouTube
                                            </label>
                                            <input
                                                type="text"
                                                value={youtubeUrl}
                                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                                placeholder="https://www.youtube.com/watch?v=..."
                                                className="w-full px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400"
                                            />
                                            <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1.5">
                                                <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                                Gợi ý: Chọn video có phụ đề tiếng Anh để kết quả tốt nhất
                                            </p>
                                        </div>

                                        {/* Tùy chọn SRT */}
                                        <div className="p-5 border border-indigo-100 bg-indigo-50/50 rounded-xl group hover:bg-indigo-50/80 hover:border-indigo-200 transition-colors">
                                            <label className="block text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                                                Tùy chọn: Chọn file phụ đề (.srt) để phân tích siêu tốc
                                            </label>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <button
                                                    onClick={() => srtInputRef.current?.click()}
                                                    className="px-5 py-2.5 bg-white border border-indigo-200/80 rounded-lg text-sm font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm hover:shadow transition-all flex items-center gap-2"
                                                >
                                                    <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                                    Tải lên file .srt
                                                </button>
                                                <span className="text-sm font-medium text-slate-600 truncate max-w-[200px] sm:max-w-xs">
                                                    {srtFile ? srtFile.name : 'Chưa chọn file'}
                                                </span>
                                                {srtFile && (
                                                    <button
                                                        onClick={() => setSrtFile(null)}
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                                        title="Bỏ chọn file"
                                                    >
                                                        <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
                                                    </button>
                                                )}
                                                <input
                                                    ref={srtInputRef}
                                                    type="file"
                                                    accept=".srt"
                                                    onChange={handleSrtChange}
                                                    className="hidden"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleYouTubeAnalyze}
                                            disabled={!youtubeUrl || loading}
                                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 relative overflow-hidden group ${!youtubeUrl || loading
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                                : 'bg-gradient-to-r from-rose-500 to-red-600 text-white hover:shadow-red-500/30 hover:-translate-y-0.5'
                                                }`}
                                        >
                                            {(!youtubeUrl || loading) ? null : <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />}
                                            <span className="relative z-10 flex items-center gap-2">
                                                {loading ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Đang tải và phân tích...
                                                    </span>
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/0000.svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg>
                                                        Phân Tích Video YouTube
                                                    </>
                                                )}
                                            </span>
                                        </button>
                                    </div>
                                )}

                                {/* Manual Tab */}
                                {activeTab === 'manual' && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                URL Audio/Video (có sẵn)
                                            </label>
                                            <input
                                                type="text"
                                                value={manualData.audioUrl}
                                                onChange={(e) => setManualData({ ...manualData, audioUrl: e.target.value })}
                                                placeholder="https://... hoặc /uploads/..."
                                                className="w-full px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-semibold text-slate-700">
                                                    Transcript (toàn bộ nội dung)
                                                </label>
                                                <button
                                                    onClick={handleManualAutoSplit}
                                                    disabled={!manualData.transcript}
                                                    className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-100"
                                                >
                                                    <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                                                    Tự động chia thành câu
                                                </button>
                                            </div>
                                            <textarea
                                                value={manualData.transcript}
                                                onChange={(e) => setManualData({ ...manualData, transcript: e.target.value })}
                                                placeholder="Nhập nội dung transcript..."
                                                className="w-full h-36 px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all resize-y placeholder:text-slate-400 font-mono text-sm leading-relaxed"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="block text-sm font-semibold text-slate-700">
                                                    Danh sách câu <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold ml-1">{manualData.sentences.length}</span>
                                                </label>
                                            </div>

                                            {/* Add Sentence Form */}
                                            <div className="p-4 bg-slate-50/50 border border-slate-200/60 rounded-xl mb-4 shadow-sm">
                                                <input
                                                    type="text"
                                                    value={newSentence.text}
                                                    onChange={(e) => setNewSentence({ ...newSentence, text: e.target.value })}
                                                    placeholder="Nội dung câu mới..."
                                                    className="w-full px-4 py-2 bg-white/80 border border-slate-200/60 rounded-lg mb-3 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all placeholder:text-slate-400 text-sm"
                                                />
                                                <div className="flex gap-3">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={newSentence.startTime}
                                                            onChange={(e) => setNewSentence({ ...newSentence, startTime: parseFloat(e.target.value) })}
                                                            placeholder="Start (s)"
                                                            className="w-full pl-3 pr-8 py-2 bg-white/80 border border-slate-200/60 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all text-sm font-mono"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">s</span>
                                                    </div>
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={newSentence.endTime}
                                                            onChange={(e) => setNewSentence({ ...newSentence, endTime: parseFloat(e.target.value) })}
                                                            placeholder="End (s)"
                                                            className="w-full pl-3 pr-8 py-2 bg-white/80 border border-slate-200/60 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all text-sm font-mono"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">s</span>
                                                    </div>
                                                    <button
                                                        onClick={handleManualAddSentence}
                                                        disabled={!newSentence.text.trim()}
                                                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-indigo-600 transition-all font-bold flex items-center justify-center gap-1"
                                                    >
                                                        <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Sentence List */}
                                            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                                {manualData.sentences.map((sentence, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-3 p-3 bg-white border border-slate-100 shadow-sm rounded-xl group hover:border-indigo-100 hover:shadow-md transition-all"
                                                    >
                                                        <span className="w-7 h-7 flex items-center justify-center bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold shrink-0 ring-1 ring-indigo-100">
                                                            {index + 1}
                                                        </span>
                                                        <span className="flex-1 text-sm font-medium text-slate-700 leading-relaxed">{sentence.text}</span>
                                                        <span className="text-xs font-mono font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 shrink-0">
                                                            {sentence.startTime}s <span className="text-slate-300">→</span> {sentence.endTime}s
                                                        </span>
                                                        {index < manualData.sentences.length - 1 && (
                                                            <button
                                                                onClick={() => handleManualMergeSentence(index)}
                                                                className="opacity-0 group-hover:opacity-100 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 text-xs font-bold transition-all border border-amber-200 shrink-0"
                                                                title="Gộp với câu tiếp theo"
                                                            >
                                                                🔗 Gộp
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleManualRemoveSentence(index)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-all shrink-0"
                                                        >
                                                            <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                                {manualData.sentences.length === 0 && (
                                                    <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                                                        Chưa có câu nào. Hãy thêm câu mới hoặc tự động chia từ transcript.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleManualSubmit}
                                            disabled={loading || !manualData.audioUrl || !manualData.transcript}
                                            className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${loading || !manualData.audioUrl || !manualData.transcript
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-emerald-500/30 hover:-translate-y-0.5'
                                                }`}
                                        >
                                            <svg xmlns="http://www.w3.org/0000.svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                                            {loading ? 'Đang lưu bài học...' : 'Lưu Bài Học'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Review & Edit */}
                        {step === 2 && analysis && (
                            <div className="glass-panel rounded-3xl p-8 animate-in slide-in-from-right-8 duration-500 shadow-xl border border-white/60">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-slate-200/60 gap-4">
                                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2.5">
                                        <svg xmlns="http://www.w3.org/0000.svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                        Xem Lại & Chỉnh Sửa
                                    </h2>
                                    <button
                                        onClick={handleReset}
                                        className="text-sm font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                                    >
                                        <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                                        Quay lại
                                    </button>
                                </div>

                                {/* Source Info */}
                                <div className="mb-6 px-5 py-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100 rounded-xl flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                                        {analysis.sourceType === 'youtube'
                                            ? <svg xmlns="http://www.w3.org/0000.svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg>
                                            : <svg xmlns="http://www.w3.org/0000.svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                        }
                                    </div>
                                    <p className="text-sm font-medium text-blue-900">
                                        <span className="opacity-70">Nguồn:</span> {analysis.sourceType === 'youtube' ? 'YouTube' : 'Upload File'}
                                        {analysis.videoTitle && <span className="font-semibold block sm:inline sm:ml-2 text-indigo-900">{analysis.videoTitle}</span>}
                                    </p>
                                </div>

                                {/* Transcript Editor */}
                                <div className="mb-8 relative group">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                        Transcript (Có thể chỉnh sửa)
                                    </label>
                                    <textarea
                                        value={analysis.transcript}
                                        onChange={(e) => setAnalysis({ ...analysis, transcript: e.target.value })}
                                        className="w-full h-40 px-5 py-4 bg-white/60 border border-slate-200/80 hover:border-indigo-300 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all resize-y placeholder:text-slate-400 font-mono text-sm leading-relaxed shadow-sm custom-scrollbar"
                                    />
                                </div>

                                {/* Sentences Editor */}
                                <div className="mb-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between mb-5 gap-4">
                                        <label className="text-base font-bold text-slate-800 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                                            Danh sách câu
                                            <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs ml-1 shadow-sm">{analysis.sentences?.length || 0}</span>
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={handleUndo}
                                                disabled={sentenceHistory.length === 0}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${sentenceHistory.length === 0
                                                    ? 'bg-white border border-slate-200 text-slate-300 cursor-not-allowed shadow-none'
                                                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-sm hover:shadow'
                                                    }`}
                                                title="Hoàn tác (Undo)"
                                            >
                                                <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
                                                Hoàn tác
                                            </button>
                                            <button
                                                onClick={handleRedo}
                                                disabled={sentenceFuture.length === 0}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${sentenceFuture.length === 0
                                                    ? 'bg-white border border-slate-200 text-slate-300 cursor-not-allowed shadow-none'
                                                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-sm hover:shadow'
                                                    }`}
                                                title="Làm lại (Redo)"
                                            >
                                                Làm lại
                                                <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" /></svg>
                                            </button>
                                            <button
                                                onClick={handleAddSentence}
                                                className="px-4 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200/60 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                                            >
                                                <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                Thêm câu
                                            </button>
                                        </div>
                                    </div>

                                    {/* Pagination Logic */}
                                    {(() => {
                                        const totalItems = analysis.sentences?.length || 0;
                                        const totalPages = Math.ceil(totalItems / itemsPerPage);
                                        const indexOfLastItem = currentPage * itemsPerPage;
                                        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                                        const currentSentences = analysis.sentences?.slice(indexOfFirstItem, indexOfLastItem) || [];

                                        return (
                                            <>
                                                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                                    {currentSentences.map((sentence, localIndex) => {
                                                        const actualIndex = indexOfFirstItem + localIndex;
                                                        return (
                                                            <div
                                                                key={actualIndex}
                                                                className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 hover:border-indigo-300 shadow-sm rounded-xl group transition-all"
                                                            >
                                                                <span className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-700 rounded-lg text-sm font-bold shrink-0 ring-1 ring-indigo-200/50 shadow-inner">
                                                                    {actualIndex + 1}
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    value={sentence.text}
                                                                    onChange={(e) => handleUpdateSentence(actualIndex, 'text', e.target.value)}
                                                                    placeholder="Nội dung câu..."
                                                                    className="flex-1 px-4 py-2 bg-transparent border-none focus:ring-0 outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400 group-hover:bg-slate-50/50 rounded-lg transition-colors cursor-text"
                                                                />
                                                                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shrink-0">
                                                                    <input
                                                                        type="number"
                                                                        step="0.1"
                                                                        value={sentence.startTime}
                                                                        onChange={(e) => handleUpdateSentence(actualIndex, 'startTime', parseFloat(e.target.value))}
                                                                        placeholder="Start"
                                                                        className="w-16 px-1 py-1 text-center bg-transparent border-none focus:ring-0 outline-none text-sm font-mono font-medium text-slate-600 appearance-none"
                                                                    />
                                                                    <span className="text-slate-300 text-xs">→</span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.1"
                                                                        value={sentence.endTime}
                                                                        onChange={(e) => handleUpdateSentence(actualIndex, 'endTime', parseFloat(e.target.value))}
                                                                        placeholder="End"
                                                                        className="w-16 px-1 py-1 text-center bg-transparent border-none focus:ring-0 outline-none text-sm font-mono font-medium text-slate-600 appearance-none"
                                                                    />
                                                                </div>

                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {actualIndex < analysis.sentences.length - 1 && (
                                                                        <button
                                                                            onClick={() => handleMergeSentence(actualIndex)}
                                                                            className="p-1.5 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-100 hover:text-amber-700 transition-colors"
                                                                            title="Gộp với câu tiếp theo"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleRemoveSentence(actualIndex)}
                                                                        className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                                                                        title="Xóa câu"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Pagination UI */}
                                                {totalItems > itemsPerPage && (
                                                    <div className="flex flex-wrap justify-between items-center mt-5 pt-4 border-t border-slate-200/60 gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-slate-500">Hiển thị:</span>
                                                            <select
                                                                value={itemsPerPage}
                                                                onChange={(e) => {
                                                                    setItemsPerPage(Number(e.target.value));
                                                                    setCurrentPage(1);
                                                                }}
                                                                className="border-none bg-white shadow-sm ring-1 ring-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 cursor-pointer"
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

                                                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg ring-1 ring-slate-200 shadow-sm">
                                                            <button
                                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                disabled={currentPage === 1}
                                                                className="px-3 py-1.5 rounded-md hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 text-sm font-semibold text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                                                            >
                                                                <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                                                Trước
                                                            </button>
                                                            <span className="text-sm font-medium text-slate-400 px-2 flex items-center gap-1">
                                                                <span className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded text-xs">{currentPage}</span>
                                                                /
                                                                <span className="text-xs">{totalPages}</span>
                                                            </span>
                                                            <button
                                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                                disabled={currentPage === totalPages || totalPages === 0}
                                                                className="px-3 py-1.5 rounded-md hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 text-sm font-semibold text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                                                            >
                                                                Sau
                                                                <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Results Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {/* Vocabulary Section */}
                                    {analysis.vocabulary && analysis.vocabulary.length > 0 && (
                                        <div className="glass-panel rounded-2xl p-6 h-full border border-slate-200/60 shadow-sm">
                                            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                                                Từ Vựng Nổi Bật <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs ml-1">{analysis.vocabulary.length}</span>
                                            </h3>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {analysis.vocabulary.map((word, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 bg-white border border-emerald-100 shadow-sm text-emerald-800 rounded-lg text-sm font-medium hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-default"
                                                    >
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-auto">
                                                <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                                Tự động chuyển thành Flashcards khi học
                                            </p>
                                        </div>
                                    )}

                                    {/* Summary Section */}
                                    <div className="flex flex-col gap-6">
                                        {analysis.summary && (
                                            <div className="glass-panel rounded-2xl p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 flex-1 border border-indigo-100/60 shadow-sm">
                                                <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                                    Tóm Tắt Nội Dung
                                                </h3>
                                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                    {analysis.summary}
                                                </p>
                                            </div>
                                        )}

                                        {/* Duration Info */}
                                        {analysis.duration && (
                                            <div className="glass-panel rounded-xl p-4 flex items-center justify-between border-l-4 border-l-sky-500 shadow-sm bg-white/80">
                                                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                    Thời lượng Audio/Video
                                                </span>
                                                <span className="text-lg font-mono font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-lg border border-sky-100">
                                                    {Math.floor(analysis.duration / 60)}:{String(Math.floor(analysis.duration % 60)).padStart(2, '0')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-slate-200/60">
                                    <button
                                        onClick={handleReset}
                                        className="sm:w-1/3 py-4 bg-white border border-slate-200/80 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                        Tạo Lại (Hủy Bỏ)
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className={`sm:w-2/3 py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 relative overflow-hidden group ${loading
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-emerald-500/30 hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {loading ? null : <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />}
                                        <span className="relative z-10 flex items-center gap-2">
                                            {loading ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Đang lưu vào thư viện...
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/0000.svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                                                    Hoàn Tất & Lưu Bài Học
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateDictation;
