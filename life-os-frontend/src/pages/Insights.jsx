import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PlusIcon, TagIcon, TrashIcon, ExclamationTriangleIcon, LightBulbIcon, CodeBracketSquareIcon, SparklesIcon } from '@heroicons/react/24/outline';
import insightService from '../services/insight.service';
import { aiFeatureApi } from '../services/api';

const CATEGORIES = [
    { id: 'Error', name: 'Lỗi thường gặp', icon: ExclamationTriangleIcon, color: 'text-red-500', bg: 'bg-red-100' },
    { id: 'Snippet', name: 'Đoạn code hay', icon: CodeBracketSquareIcon, color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'Pattern', name: 'Design Pattern', icon: LightBulbIcon, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { id: 'AI Analysis', name: 'Phân tích AI', icon: SparklesIcon, color: 'text-indigo-500', bg: 'bg-indigo-100' }
];

export default function Insights() {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [filter, setFilter] = useState('All');

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'Error',
        tags: ''
    });

    useEffect(() => {
        fetchInsights();
    }, [filter]);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const res = await insightService.getInsights({ category: filter });
            setInsights(res.data.insights);
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu bí quyết');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAI = async () => {
        try {
            setGeneratingAI(true);
            const res = await aiFeatureApi.generateInsight();
            if (res.data?.data) {
                toast.success('AI đã phân tích và tạo lời khuyên thành công!');
                setFilter('AI Analysis');
                fetchInsights();
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi yêu cầu AI phân tích.');
        } finally {
            setGeneratingAI(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const dataToSubmit = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
            };

            await insightService.createInsight(dataToSubmit);
            toast.success('Đã lưu bí quyết thành công!');
            setIsModalOpen(false);
            setFormData({ title: '', content: '', category: 'Error', tags: '' });
            fetchInsights();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xoá mục này?')) return;
        try {
            await insightService.deleteInsight(id);
            toast.success('Đã xoá thành công');
            setInsights(insights.filter(i => i.id !== id));
        } catch (error) {
            toast.error('Không thể xoá');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bí Quyết & Lỗi Lập Trình</h1>
                    <p className="text-gray-500 mt-1">Lưu trữ các kinh nghiệm, thuật toán, và lỗi đã giải quyết</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleGenerateAI}
                        disabled={generatingAI}
                        className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold hover:bg-indigo-200 transition disabled:opacity-50"
                    >
                        {generatingAI ? (
                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                            <SparklesIcon className="w-5 h-5 mr-2 text-indigo-500" />
                        )}
                        {generatingAI ? 'AI đang phân tích...' : 'AI Khuyên Nhủ'}
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Thêm thủ công
                    </button>
                </div>
            </div>

            {/* Tabs Filter */}
            <div className="flex space-x-2 mb-6 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setFilter('All')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg ${filter === 'All' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Tất cả
                </button>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg ${filter === cat.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Insights List */}
            {loading && insights.length === 0 ? (
                <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
            ) : insights.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-2">Chưa có dữ liệu cho danh mục này</p>
                    <button onClick={() => setIsModalOpen(true)} className="text-blue-600 hover:underline">Hãy thêm bí quyết đầu tiên của bạn</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {insights.map(item => {
                        const cat = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[0];
                        const Icon = cat.icon;

                        return (
                            <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 relative group">
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>

                                <div className="flex items-center mb-3">
                                    <span className={`p-2 rounded-lg ${cat.bg} mr-3`}>
                                        <Icon className={`w-5 h-5 ${cat.color}`} />
                                    </span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{cat.name}</span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>

                                <div className="text-sm text-gray-600 mb-4 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg font-mono text-xs overflow-x-auto max-h-32 border border-gray-100">
                                    {item.content}
                                </div>

                                <div className="flex flex-wrap gap-2 mt-auto">
                                    {item.tags?.map((tag, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs text-gray-600">
                                            <TagIcon className="w-3 h-3 mr-1" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative">
                        <h2 className="text-xl font-bold mb-4">Thêm Bí quyết / Lỗi lập trình</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ví dụ: Lỗi CORS khi fetch API Node.js"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phân loại</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thẻ (Tags) - Phân cách bằng dấu phẩy</label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="react, api, bug"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết (Code/Giải pháp)</label>
                                <textarea
                                    required
                                    rows="6"
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                    placeholder="Mô tả chi tiết nguyên nhân lỗi hoặc đoạn code giải quyết..."
                                ></textarea>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                >
                                    Huỷ bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    {loading ? 'Đang lưu...' : 'Lưu lại'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
