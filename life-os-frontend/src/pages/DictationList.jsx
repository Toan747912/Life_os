import React, { useState, useEffect } from 'react';
import { dictationApi, userApi } from '../services/api';
import { Link } from 'react-router-dom';

const DictationList = () => {
    const [dictations, setDictations] = useState([]);
    const [customCategories, setCustomCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ language: '', difficulty: '', category: '', tags: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFolder, setSelectedFolder] = useState(null); // null = show folders, string = show dictations in folder


    useEffect(() => {
        loadDictations();
        loadPreferences();
    }, [filter]);

    const loadPreferences = async () => {
        try {
            const res = await userApi.getPreferences();
            if (res.data && res.data.dictationFolders) {
                setCustomCategories(res.data.dictationFolders);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    };


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

    // Dynamic categories from dictations and preferences
    const allDictationCategories = dictations.map(d => d.category || 'General');
    const uniqueCategories = [...new Set([...allDictationCategories, ...customCategories])].sort();

    // Group dictations by category
    const dictationsByCategory = uniqueCategories.reduce((acc, cat) => {
        acc[cat] = dictations.filter(d => (d.category || 'General') === cat);
        return acc;
    }, {});

    return (
        <div className="max-w-6xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-600 mb-3 tracking-tight">
                        Luyện Nghe Chép Chính Tả
                    </h1>
                    {selectedFolder ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setSelectedFolder(null);
                                    setFilter({ ...filter, category: '' });
                                }}
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                            >
                                ← Quay lại danh sách thư mục
                            </button>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600 font-medium">📂 {selectedFolder === 'ALL_DICTATIONS' ? 'Tất cả bài học' : selectedFolder}</span>
                        </div>
                    ) : (
                        <p className="text-slate-500 text-lg">
                            Chọn một thư mục để bắt đầu luyện tập kỹ năng nghe và viết của bạn
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        to="/dictation/create"
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <span className="text-xl">+</span> Mới
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel rounded-2xl p-5 mb-8">
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Search */}
                    <div className="flex-1 min-w-[16rem] relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-slate-400">🔍</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài tập..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-slate-700 placeholder:text-slate-400"
                        />
                    </div>

                    {/* Language Filter */}
                    <select
                        value={filter.language}
                        onChange={(e) => setFilter({ ...filter, language: e.target.value })}
                        className="px-4 py-2.5 bg-white/60 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all text-slate-700"
                    >
                        <option value="">🌍 Tất cả ngôn ngữ</option>
                        <option value="en">🇺🇸 Tiếng Anh</option>
                        <option value="vi">🇻🇳 Tiếng Việt</option>
                        <option value="ja">🇯🇵 Tiếng Nhật</option>
                        <option value="ko">🇰🇷 Tiếng Hàn</option>
                    </select>

                    {/* Category Filter */}
                    <select
                        value={filter.category}
                        onChange={(e) => {
                            setFilter({ ...filter, category: e.target.value });
                            if (e.target.value) {
                                setSelectedFolder(e.target.value);
                            }
                        }}
                        className="px-4 py-2.5 bg-white/60 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all text-slate-700"
                    >
                        <option value="">📂 Tất cả chủ đề</option>
                        {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    {/* Difficulty Filter */}
                    <select
                        value={filter.difficulty}
                        onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
                        className="px-4 py-2.5 bg-white/60 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all text-slate-700"
                    >
                        <option value="">📊 Tất cả độ khó</option>
                        <option value="easy">🟢 Dễ</option>
                        <option value="medium">🟡 Trung bình</option>
                        <option value="hard">🔴 Khó</option>
                    </select>

                    {/* Tag Filter */}
                    <div className="flex-1 min-w-[12rem] relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-slate-400">🏷️</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Lọc theo tag..."
                            value={filter.tags}
                            onChange={(e) => setFilter({ ...filter, tags: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-slate-700 placeholder:text-slate-400"
                            title="Nhập các tags cách nhau bằng dấu phẩy"
                        />
                    </div>
                </div>
            </div>

            {/* Content Grid */}
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
            ) : !selectedFolder && !searchTerm && !filter.language && !filter.difficulty && !filter.tags && !filter.category ? (
                /* FOLDER VIEW */
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* All Dictations Folder */}
                    <div
                        onClick={() => setSelectedFolder('ALL_DICTATIONS')}
                        className="glass-card rounded-2xl p-6 cursor-pointer group flex flex-col items-center justify-center text-center h-52 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/10 pointer-events-none" />
                        <div className="text-6xl mb-4 group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">📚</div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">Tất cả bài học</h3>
                        <p className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-xs font-bold tracking-wide">{dictations.length} bài học</p>
                    </div>

                    {/* Category Folders */}
                    {Object.entries(dictationsByCategory).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, items]) => (
                        <div
                            key={category}
                            onClick={() => {
                                setSelectedFolder(category);
                                setFilter({ ...filter, category: category });
                            }}
                            className="glass-card rounded-2xl p-6 cursor-pointer group flex flex-col items-center justify-center text-center h-52 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100/50 pointer-events-none group-hover:from-indigo-50/50 group-hover:to-violet-50/30 transition-colors duration-500" />
                            <div className="text-6xl mb-4 group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">📁</div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors z-10">{category}</h3>
                            <p className="text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold tracking-wide z-10 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">{items.length} bài học</p>
                        </div>
                    ))}
                </div>
            ) : (
                /* DICTATION LIST VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDictations.map((dictation) => (
                        <Link
                            key={dictation.id}
                            to={`/dictation/${dictation.id}`}
                            className="glass-card rounded-2xl p-6 group flex flex-col h-full bg-white/70"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                                    {dictation.title}
                                </h3>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold shrink-0 ml-3 ${getDifficultyColor(dictation.difficulty)}`}>
                                    {dictation.difficulty === 'easy' ? 'Dễ' : dictation.difficulty === 'medium' ? 'T.Bình' : 'Khó'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-sm font-medium text-slate-500 bg-slate-100/80 px-2 py-1 rounded-lg">
                                    {getLanguageLabel(dictation.language)}
                                </span>
                                {dictation.category && (
                                    <span className="text-sm font-semibold text-indigo-600 bg-indigo-50/80 border border-indigo-100 px-2.5 py-1 rounded-lg flex items-center gap-1 truncate max-w-[150px]">
                                        📂 {dictation.category}
                                    </span>
                                )}
                            </div>

                            {dictation.tags && dictation.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {dictation.tags.slice(0, 3).map((tag, index) => (
                                        <span key={index} className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200/60 max-w-[100px] truncate">
                                            #{tag}
                                        </span>
                                    ))}
                                    {dictation.tags.length > 3 && (
                                        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200/60">
                                            +{dictation.tags.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-100/80">
                                <span className="text-xs font-medium text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded">
                                    {new Date(dictation.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                                <div className="flex gap-2">
                                    <Link
                                        to={`/dictation/edit/${dictation.id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        title="Chỉnh sửa bài học"
                                    >
                                        <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                    </Link>
                                    <button
                                        onClick={(e) => handleDelete(e, dictation.id, dictation.title)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Xóa bài học"
                                    >
                                        <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="mt-10 overflow-hidden rounded-2xl relative shadow-xl shadow-indigo-500/10">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-30" />
                <div className="relative p-8 text-white grid grid-cols-3 gap-8 text-center divide-x divide-white/20">
                    <div className="flex flex-col items-center justify-center group">
                        <p className="text-4xl font-black mb-1 group-hover:scale-110 transition-transform">{dictations.length}</p>
                        <p className="text-sm font-medium text-white/80 uppercase tracking-widest">Bài tập</p>
                    </div>
                    <div className="flex flex-col items-center justify-center group">
                        <p className="text-4xl font-black mb-1 group-hover:scale-110 transition-transform">
                            {dictations.filter(d => d.difficulty === 'easy').length}
                        </p>
                        <p className="text-sm font-medium text-white/80 uppercase tracking-widest">Bài dễ</p>
                    </div>
                    <div className="flex flex-col items-center justify-center group">
                        <p className="text-4xl font-black mb-1 group-hover:scale-110 transition-transform">
                            {dictations.filter(d => d.difficulty === 'hard').length}
                        </p>
                        <p className="text-sm font-medium text-white/80 uppercase tracking-widest">Bài khó</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DictationList;