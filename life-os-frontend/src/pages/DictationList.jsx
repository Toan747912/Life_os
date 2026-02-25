import React, { useState, useEffect } from 'react';
import { dictationApi } from '../services/api';
import { Link } from 'react-router-dom';

const DictationList = () => {
    const [dictations, setDictations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ language: '', difficulty: '' });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadDictations();
    }, [filter]);

    const loadDictations = async () => {
        try {
            setLoading(true);
            const response = await dictationApi.getAll(filter);
            setDictations(response.data);
        } catch (error) {
            console.error('Error loading dictations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id, title) => {
        e.preventDefault(); // Ngăn navigate của thẻ Link parent
        if (window.confirm(`Bạn có chắc muốn xóa bài học "${title}" không?\nHành động này không thể hoàn tác.`)) {
            try {
                await dictationApi.delete(id);
                setDictations(dictations.filter(d => d.id !== id));
            } catch (error) {
                console.error('Error deleting dictation:', error);
                alert('Lỗi khi xóa bài học: ' + (error.response?.data?.error || error.message));
            }
        }
    };

    const filteredDictations = dictations.filter(d =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDifficultyColor = (difficulty) => {
        const colors = {
            easy: 'bg-green-100 text-green-700',
            medium: 'bg-yellow-100 text-yellow-700',
            hard: 'bg-red-100 text-red-700'
        };
        return colors[difficulty] || colors.medium;
    };

    const getLanguageLabel = (lang) => {
        const labels = {
            en: '🇺🇸 Tiếng Anh',
            vi: '🇻🇳 Tiếng Việt',
            ja: '🇯🇵 Tiếng Nhật',
            ko: '🇰🇷 Tiếng Hàn',
            zh: '🇨🇳 Tiếng Trung',
            fr: '🇫🇷 Tiếng Pháp',
            de: '🇩🇪 Tiếng Đức',
            es: '🇪🇸 Tiếng Tây Ban Nha'
        };
        return labels[lang] || lang;
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        📝 Luyện Nghe Chép Chính Tả
                    </h1>
                    <p className="text-gray-600">
                        Chọn một bài tập để bắt đầu luyện tập kỹ năng nghe và viết của bạn
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/dictation/create"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        ➕ Thêm Bài Học Mới
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-64">
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm bài tập..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Language Filter */}
                    <select
                        value={filter.language}
                        onChange={(e) => setFilter({ ...filter, language: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">🌍 Tất cả ngôn ngữ</option>
                        <option value="en">🇺🇸 Tiếng Anh</option>
                        <option value="vi">🇻🇳 Tiếng Việt</option>
                        <option value="ja">🇯🇵 Tiếng Nhật</option>
                        <option value="ko">🇰🇷 Tiếng Hàn</option>
                    </select>

                    {/* Difficulty Filter */}
                    <select
                        value={filter.difficulty}
                        onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">📊 Tất cả độ khó</option>
                        <option value="easy">🟢 Dễ</option>
                        <option value="medium">🟡 Trung bình</option>
                        <option value="hard">🔴 Khó</option>
                    </select>
                </div>
            </div>

            {/* Dictation Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredDictations.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        Chưa có bài tập nào
                    </h3>
                    <p className="text-gray-500">
                        Hãy thử thay đổi bộ lọc hoặc quay lại sau nhé!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDictations.map((dictation) => (
                        <Link
                            key={dictation.id}
                            to={`/dictation/${dictation.id}`}
                            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition">
                                    {dictation.title}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(dictation.difficulty)}`}>
                                    {dictation.difficulty === 'easy' ? 'Dễ' : dictation.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm text-gray-500">
                                    {getLanguageLabel(dictation.language)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-4">
                                <span className="text-xs text-gray-400">
                                    {new Date(dictation.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                                <div className="flex gap-2">
                                    <Link
                                        to={`/dictation/edit/${dictation.id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        title="Chỉnh sửa bài học"
                                    >
                                        ✏️
                                    </Link>
                                    <button
                                        onClick={(e) => handleDelete(e, dictation.id, dictation.title)}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Xóa bài học"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                        <p className="text-3xl font-bold">{dictations.length}</p>
                        <p className="text-sm opacity-80">Bài tập có sẵn</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold">
                            {dictations.filter(d => d.difficulty === 'easy').length}
                        </p>
                        <p className="text-sm opacity-80">Bài dễ</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold">
                            {dictations.filter(d => d.difficulty === 'hard').length}
                        </p>
                        <p className="text-sm opacity-80">Bài khó</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DictationList;