import React, { useState, useRef } from 'react';
import { dictationApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const CreateDictation = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('upload'); // upload, youtube, manual
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Nhập liệu, 2: Xem lại, 3: Hoàn thành
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);

    // Form data chung
    const [formData, setFormData] = useState({
        title: '',
        difficulty: 'medium',
        language: 'en'
    });

    // Form cho YouTube
    const [youtubeUrl, setYoutubeUrl] = useState('');

    // Form cho upload file
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

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
            if (selectedFile.size > 50 * 1024 * 1024) {
                setError('File quá lớn (tối đa 50MB)');
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
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

            const response = await dictationApi.analyzeAudio(data);
            setAnalysis({
                ...response.data,
                sourceType: 'upload',
                file: file
            });
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Lỗi khi phân tích file');
        } finally {
            setLoading(false);
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
            const response = await dictationApi.analyzeYouTube({
                youtubeUrl,
                title: formData.title,
                difficulty: formData.difficulty,
                language: formData.language
            });

            setAnalysis({
                ...response.data,
                sourceType: 'youtube',
                sourceUrl: youtubeUrl
            });
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

    const handleAddSentence = () => {
        setAnalysis({
            ...analysis,
            sentences: [...analysis.sentences, { text: '', startTime: 0, endTime: 0 }]
        });
    };

    const handleRemoveSentence = (index) => {
        setAnalysis({
            ...analysis,
            sentences: analysis.sentences.filter((_, i) => i !== index)
        });
    };

    const handleMergeSentence = (index) => {
        if (index >= analysis.sentences.length - 1) return;
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
        setYoutubeUrl('');
        setManualData({ audioUrl: '', transcript: '', sentences: [] });
        setError(null);
    };

    // ================== RENDER ==================
    return (
        <div className="max-w-5xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    📚 Thêm Bài Học Dictation Mới
                </h1>
                <p className="text-gray-600">
                    Chọn phương thức phù hợp để thêm bài học vào thư viện của bạn
                </p>
            </div>

            {/* Success State */}
            {step === 3 ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Tạo bài học thành công!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Bài học đã được lưu và sẵn sàng để sử dụng.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => navigate('/dictations')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            📚 Xem danh sách bài học
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                        >
                            ➕ Thêm bài học khác
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Settings */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                            <h3 className="font-semibold text-gray-800 mb-4">⚙️ Cài Đặt Chung</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tiêu đề bài học
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Nhập tiêu đề..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngôn ngữ
                                    </label>
                                    <select
                                        value={formData.language}
                                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Độ khó
                                    </label>
                                    <select
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="easy">🟢 Dễ - Dành cho người mới bắt đầu</option>
                                        <option value="medium">🟡 Trung bình - Cần có nền tảng cơ bản</option>
                                        <option value="hard">🔴 Khó - Thử thách cho người học nâng cao</option>
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">📊 Thống kê</h4>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>📁 Phương thức: {activeTab === 'upload' ? 'Upload File' : activeTab === 'youtube' ? 'YouTube' : 'Thủ công'}</p>
                                        {analysis && (
                                            <>
                                                <p>📝 Số câu: {analysis.sentences?.length || 0}</p>
                                                <p>📖 Từ vựng: {analysis.vocabulary?.length || 0}</p>
                                                {analysis.duration && <p>⏱️ Thời lượng: {Math.round(analysis.duration)}s</p>}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Main Content */}
                    <div className="lg:col-span-2">
                        {/* Step 1: Input Methods */}
                        {step === 1 && (
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                {/* Tabs */}
                                <div className="flex gap-2 mb-6">
                                    {[
                                        { id: 'upload', icon: '📤', label: 'Upload File' },
                                        { id: 'youtube', icon: '▶️', label: 'YouTube' },
                                        { id: 'manual', icon: '✏️', label: 'Thủ công' }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${activeTab === tab.id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            <span className="mr-2">{tab.icon}</span>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-600 text-sm">❌ {error}</p>
                                    </div>
                                )}

                                {/* Upload Tab */}
                                {activeTab === 'upload' && (
                                    <div>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                                        >
                                            {file ? (
                                                <div>
                                                    <div className="text-4xl mb-2">🎵</div>
                                                    <p className="font-medium text-gray-800">{file.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFile(null);
                                                        }}
                                                        className="mt-2 text-sm text-red-500 hover:text-red-600"
                                                    >
                                                        ✖ Xóa file
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="text-4xl mb-2">📁</div>
                                                    <p className="font-medium text-gray-700">
                                                        Click để chọn file audio/video
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Hỗ trợ: MP3, WAV, M4A, MP4, WebM
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Tối đa 50MB
                                                    </p>
                                                </div>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="audio/*,video/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </div>

                                        <button
                                            onClick={handleUploadAnalyze}
                                            disabled={!file || loading}
                                            className={`w-full mt-4 py-3 rounded-lg font-medium transition ${!file || loading
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                                }`}
                                        >
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    🔍 AI đang phân tích...
                                                </span>
                                            ) : (
                                                '🔍 Phân Tích Với AI'
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* YouTube Tab */}
                                {activeTab === 'youtube' && (
                                    <div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nhập URL Video YouTube
                                            </label>
                                            <input
                                                type="text"
                                                value={youtubeUrl}
                                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                                placeholder="https://www.youtube.com/watch?v=..."
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-sm text-gray-500 mt-2">
                                                💡 Gợi ý: Chọn video có phụ đề tiếng Anh để kết quả tốt nhất
                                            </p>
                                        </div>

                                        <button
                                            onClick={handleYouTubeAnalyze}
                                            disabled={!youtubeUrl || loading}
                                            className={`w-full py-3 rounded-lg font-medium transition ${!youtubeUrl || loading
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-red-600 text-white hover:bg-red-700'
                                                }`}
                                        >
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    🔍 Đang tải và phân tích...
                                                </span>
                                            ) : (
                                                '▶️ Phân Tích Video YouTube'
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Manual Tab */}
                                {activeTab === 'manual' && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                URL Audio/Video (có sẵn)
                                            </label>
                                            <input
                                                type="text"
                                                value={manualData.audioUrl}
                                                onChange={(e) => setManualData({ ...manualData, audioUrl: e.target.value })}
                                                placeholder="https://... hoặc /uploads/..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Transcript (toàn bộ nội dung)
                                            </label>
                                            <textarea
                                                value={manualData.transcript}
                                                onChange={(e) => setManualData({ ...manualData, transcript: e.target.value })}
                                                placeholder="Nhập nội dung transcript..."
                                                className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={handleManualAutoSplit}
                                                disabled={!manualData.transcript}
                                                className="mt-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                            >
                                                🔄 Tự động chia thành câu
                                            </button>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Danh sách câu ({manualData.sentences.length})
                                                </label>
                                            </div>

                                            {/* Add Sentence Form */}
                                            <div className="p-4 bg-gray-50 rounded-lg mb-4">
                                                <input
                                                    type="text"
                                                    value={newSentence.text}
                                                    onChange={(e) => setNewSentence({ ...newSentence, text: e.target.value })}
                                                    placeholder="Nội dung câu mới..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={newSentence.startTime}
                                                        onChange={(e) => setNewSentence({ ...newSentence, startTime: parseFloat(e.target.value) })}
                                                        placeholder="Start (s)"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={newSentence.endTime}
                                                        onChange={(e) => setNewSentence({ ...newSentence, endTime: parseFloat(e.target.value) })}
                                                        placeholder="End (s)"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                    <button
                                                        onClick={handleManualAddSentence}
                                                        disabled={!newSentence.text.trim()}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Sentence List */}
                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                {manualData.sentences.map((sentence, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg"
                                                    >
                                                        <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                                            {index + 1}
                                                        </span>
                                                        <span className="flex-1 text-sm">{sentence.text}</span>
                                                        <span className="text-xs text-gray-500">
                                                            {sentence.startTime}s → {sentence.endTime}s
                                                        </span>
                                                        {index < manualData.sentences.length - 1 && (
                                                            <button
                                                                onClick={() => handleManualMergeSentence(index)}
                                                                className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-xs font-medium transition"
                                                                title="Gộp với câu tiếp theo"
                                                            >
                                                                🔗 Gộp
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleManualRemoveSentence(index)}
                                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                        >
                                                            ✖
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleManualSubmit}
                                            disabled={loading || !manualData.audioUrl || !manualData.transcript}
                                            className={`w-full py-3 rounded-lg font-medium transition ${loading || !manualData.audioUrl || !manualData.transcript
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                                }`}
                                        >
                                            {loading ? 'Đang lưu...' : '💾 Lưu Bài Học'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Review & Edit */}
                        {step === 2 && analysis && (
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-800">
                                        ✏️ Xem Lại & Chỉnh Sửa
                                    </h2>
                                    <button
                                        onClick={handleReset}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        ← Quay lại
                                    </button>
                                </div>

                                {/* Source Info */}
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Nguồn:</strong> {analysis.sourceType === 'youtube' ? 'YouTube' : 'Upload File'}
                                        {analysis.videoTitle && ` - ${analysis.videoTitle}`}
                                    </p>
                                </div>

                                {/* Transcript Editor */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        📝 Transcript (Có thể chỉnh sửa)
                                    </label>
                                    <textarea
                                        value={analysis.transcript}
                                        onChange={(e) => setAnalysis({ ...analysis, transcript: e.target.value })}
                                        className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Sentences Editor */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-medium text-gray-700">
                                            📋 Câu Với Timestamps ({analysis.sentences?.length || 0})
                                        </label>
                                        <button
                                            onClick={handleAddSentence}
                                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                                        >
                                            + Thêm câu
                                        </button>
                                    </div>

                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {analysis.sentences?.map((sentence, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                                            >
                                                <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-bold shrink-0">
                                                    {index + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={sentence.text}
                                                    onChange={(e) => handleUpdateSentence(index, 'text', e.target.value)}
                                                    placeholder="Nội dung câu..."
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={sentence.startTime}
                                                    onChange={(e) => handleUpdateSentence(index, 'startTime', parseFloat(e.target.value))}
                                                    placeholder="Start"
                                                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                                <span className="text-gray-400">→</span>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={sentence.endTime}
                                                    onChange={(e) => handleUpdateSentence(index, 'endTime', parseFloat(e.target.value))}
                                                    placeholder="End"
                                                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                                {index < analysis.sentences.length - 1 && (
                                                    <button
                                                        onClick={() => handleMergeSentence(index)}
                                                        className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm font-medium transition"
                                                        title="Gộp với câu tiếp theo"
                                                    >
                                                        🔗 Gộp
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveSentence(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                    title="Xóa câu"
                                                >
                                                    ✖
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Vocabulary Section */}
                                {analysis.vocabulary && analysis.vocabulary.length > 0 && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            📖 Từ Vựng Mới ({analysis.vocabulary.length})
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.vocabulary.map((word, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                                                >
                                                    {word}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            💡 Từ vựng này sẽ được tự động tạo thành flashcards
                                        </p>
                                    </div>
                                )}

                                {/* Summary Section */}
                                {analysis.summary && (
                                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                        <label className="block text-sm font-medium text-blue-800 mb-2">
                                            📋 Tóm Tắt Nội Dung
                                        </label>
                                        <p className="text-blue-700">{analysis.summary}</p>
                                    </div>
                                )}

                                {/* Duration Info */}
                                {analysis.duration && (
                                    <div className="mb-6 p-3 bg-gray-100 rounded-lg">
                                        <p className="text-sm text-gray-600">
                                            <strong>⏱️ Thời lượng:</strong> {Math.floor(analysis.duration / 60)}:{String(Math.floor(analysis.duration % 60)).padStart(2, '0')}
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={handleReset}
                                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
                                    >
                                        ← Quay Lại
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className={`flex-1 py-3 rounded-lg font-medium transition ${loading
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                    >
                                        {loading ? 'Đang lưu...' : '💾 Lưu Bài Học'}
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
