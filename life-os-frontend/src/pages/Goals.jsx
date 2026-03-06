import React, { useState, useEffect } from 'react';
import { gamificationApi } from '../services/api';
import { Target, PlusCircle, CheckCircle2, Flame, Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        targetValue: 10,
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        goalType: 'WORDS_LEARNED'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await gamificationApi.getDashboard();
            if (res.data?.data) {
                setGoals(res.data.data.goals || []);
            }
        } catch (error) {
            console.error("Failed to load goals", error);
            toast.error("Không tải được danh sách mục tiêu");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const submitData = {
                ...formData,
                targetValue: parseInt(formData.targetValue, 10),
                deadline: new Date(formData.deadline).toISOString()
            };
            await gamificationApi.createGoal(submitData);
            toast.success("Đã tạo mục tiêu mới!");
            setShowModal(false);

            // Reset form
            setFormData({
                title: '',
                description: '',
                targetValue: 10,
                deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
                goalType: 'WORDS_LEARNED'
            });
            fetchData();
        } catch (error) {
            console.error("Error creating goal:", error);
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tạo mục tiêu");
        } finally {
            setSubmitting(false);
        }
    };

    const getGoalTypeLabel = (type) => {
        switch (type) {
            case 'WORDS_LEARNED': return 'Học từ vựng mới';
            case 'DICTATIONS_COMPLETED': return 'Hoàn thành bài Dictation';
            case 'CONVERSATIONS_FINISHED': return 'Luyện nói AI';
            case 'DAYS_STREAK': return 'Chuỗi ngày học liên tục';
            default: return 'Khác';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-200/50 block">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Mục Tiêu Học Tập</h1>
                        <p className="text-slate-500 text-sm mt-1">Thiết lập mục tiêu dài hạn để duy trì động lực học.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-indigo-200"
                >
                    <Plus className="w-5 h-5" />
                    Thêm Mục Tiêu
                </button>
            </div>

            {/* Goals List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(goal => {
                    const progressPercent = Math.min(100, Math.round((goal.currentProgress / goal.targetValue) * 100));
                    const isCompleted = goal.isCompleted;
                    const isExpired = !isCompleted && new Date(goal.deadline) < new Date();

                    return (
                        <div
                            key={goal.id}
                            className={`bg-white rounded-2xl p-6 border ${isCompleted ? 'border-emerald-200 shadow-emerald-500/5' : isExpired ? 'border-rose-200' : 'border-slate-100'} shadow-sm relative overflow-hidden`}
                            style={{ opacity: isExpired ? 0.7 : 1 }}
                        >
                            {/* Status badge */}
                            <div className="absolute top-4 right-4">
                                {isCompleted ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                                    </span>
                                ) : isExpired ? (
                                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                                        Quá hạn
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                        Đang thực hiện
                                    </span>
                                )}
                            </div>

                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
                                {goal.goalType === 'WORDS_LEARNED' ? <span className="text-xl">📚</span> :
                                    goal.goalType === 'DICTATIONS_COMPLETED' ? <span className="text-xl">🎧</span> :
                                        goal.goalType === 'CONVERSATIONS_FINISHED' ? <span className="text-xl">💬</span> :
                                            <Flame className="w-5 h-5 text-orange-500" />}
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">{goal.title}</h3>
                            <p className="text-xs text-slate-500 mb-4 h-8 line-clamp-2">{goal.description}</p>

                            <div className="mb-4">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-medium text-slate-600">{getGoalTypeLabel(goal.goalType)}</span>
                                    <span className="text-sm font-bold text-slate-800">{goal.currentProgress} / {goal.targetValue}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className={`h-2.5 rounded-full transition-all duration-1000 ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                                <span className="text-slate-500">
                                    Hạn chót: <span className="font-medium text-slate-700">{new Date(goal.deadline).toLocaleDateString('vi-VN')}</span>
                                </span>
                                {goal.xpReward > 0 && (
                                    <span className="font-bold text-amber-500 flex items-center gap-1">
                                        ⭐ {goal.xpReward} XP
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {goals.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <Target className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có mục tiêu nào</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-6">Tạo một vài mục tiêu dài hạn để hệ thống giúp bạn theo dõi tiến độ một cách khoa học nhất.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium px-6 py-2.5 rounded-xl transition-colors"
                        >
                            Tạo Mục Tiêu Đầu Tiên
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-600" /> Tạo Mục Tiêu Mới
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên mục tiêu <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Vd: Chinh phục 3000 từ vựng cốt lõi"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả thêm</label>
                                <textarea
                                    rows="2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Khuyến khích ghi rõ tham vọng của bạn..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 bg-white resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Loại mục tiêu</label>
                                    <select
                                        value={formData.goalType}
                                        onChange={(e) => setFormData({ ...formData, goalType: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-700"
                                    >
                                        <option value="WORDS_LEARNED">Học từ mới</option>
                                        <option value="DICTATIONS_COMPLETED">Làm bài Dictation</option>
                                        <option value="CONVERSATIONS_FINISHED">Luyện nói AI</option>
                                        <option value="DAYS_STREAK">Chuỗi ngày (Streak)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Mục tiêu đạt tới</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={formData.targetValue}
                                        onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-indigo-700 bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Thời hạn (Deadline) <span className="text-rose-500">*</span></label>
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 bg-white"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !formData.title.trim()}
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Tạo Mục Tiêu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Goals;
