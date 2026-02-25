import React, { useState, useEffect } from 'react';
import { dictationApi } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';

const EditDictation = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [dictation, setDictation] = useState(null);

    useEffect(() => {
        const fetchDictation = async () => {
            try {
                const response = await dictationApi.getById(id);
                setDictation(response.data);
            } catch (err) {
                console.error('Error fetching dictation:', err);
                setError('Không thể tải dữ liệu bài học. ' + (err.response?.data?.error || err.message));
            } finally {
                setLoading(false);
            }
        };
        fetchDictation();
    }, [id]);

    const handleUpdateSentence = (index, field, value) => {
        const newSentences = [...dictation.sentences];
        newSentences[index] = { ...newSentences[index], [field]: value };
        setDictation({ ...dictation, sentences: newSentences });
    };

    const handleAddSentence = () => {
        setDictation({
            ...dictation,
            sentences: [...(dictation.sentences || []), { text: '', startTime: 0, endTime: 0 }]
        });
    };

    const handleRemoveSentence = (index) => {
        setDictation({
            ...dictation,
            sentences: dictation.sentences.filter((_, i) => i !== index)
        });
    };

    const handleMergeSentence = (index) => {
        if (!dictation.sentences || index >= dictation.sentences.length - 1) return;
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
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error && !dictation) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-center">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 mb-4">
                    ❌ {error}
                </div>
                <button
                    onClick={() => navigate('/dictations')}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                    ← Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        ✏️ Chỉnh Sửa Bài Học
                    </h1>
                    <p className="text-gray-600">
                        Sửa thông tin, nội dung transcript hoặc điều chỉnh thời gian các câu
                    </p>
                </div>
                <button
                    onClick={() => navigate('/dictations')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                    ← Trở về
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                    ❌ {error}
                </div>
            )}

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
                                    value={dictation.title}
                                    onChange={(e) => setDictation({ ...dictation, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ngôn ngữ
                                </label>
                                <select
                                    value={dictation.language}
                                    onChange={(e) => setDictation({ ...dictation, language: e.target.value })}
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
                                    value={dictation.difficulty}
                                    onChange={(e) => setDictation({ ...dictation, difficulty: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="easy">🟢 Dễ</option>
                                    <option value="medium">🟡 Trung bình</option>
                                    <option value="hard">🔴 Khó</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">📊 Thống kê</h4>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p>📁 Nguồn: {dictation.sourceType === 'youtube' ? 'YouTube' : dictation.sourceType === 'manual' ? 'Thủ công' : 'Upload File'}</p>
                                    <p>📝 Số câu: {dictation.sentences?.length || 0}</p>
                                    <p>📖 Từ vựng: {dictation.vocabulary?.length || 0}</p>
                                    {dictation.duration && <p>⏱️ Thời lượng: {Math.round(dictation.duration)}s</p>}
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`w-full py-3 mt-4 rounded-lg font-medium transition ${saving
                                    ? 'bg-blue-300 text-white cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {saving ? 'Đang lưu...' : '💾 Lưu Thay Đổi'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Main Content */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        {/* Transcript Editor */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                📝 Transcript (Toàn bộ nội dung)
                            </label>
                            <textarea
                                value={dictation.transcript}
                                onChange={(e) => setDictation({ ...dictation, transcript: e.target.value })}
                                className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Sentences Editor */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    📋 Danh Sách Câu ({dictation.sentences?.length || 0})
                                </label>
                                <button
                                    onClick={handleAddSentence}
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                                >
                                    + Thêm câu
                                </button>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {dictation.sentences?.map((sentence, index) => (
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

                                        {index < dictation.sentences.length - 1 && (
                                            <button
                                                onClick={() => handleMergeSentence(index)}
                                                className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm font-medium transition whitespace-nowrap"
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

                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditDictation;
