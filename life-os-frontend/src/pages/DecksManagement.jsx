import React, { useState, useEffect } from 'react';
import { deckApi } from '../services/api';
import { Plus, Edit2, Trash2, Library, BookOpen, Clock, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const DecksManagement = () => {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDeck, setEditingDeck] = useState(null);
    const [formData, setFormData] = useState({ title: '', description: '', isPublic: false });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDecks();
    }, []);

    const fetchDecks = async () => {
        try {
            setLoading(true);
            const response = await deckApi.getAll();
            setDecks(response.data.data);
        } catch (error) {
            console.error("Error fetching decks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (deck = null) => {
        if (deck) {
            setEditingDeck(deck);
            setFormData({ title: deck.title, description: deck.description || '', isPublic: deck.isPublic });
        } else {
            setEditingDeck(null);
            setFormData({ title: '', description: '', isPublic: false });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (editingDeck) {
                await deckApi.update(editingDeck.id, formData);
            } else {
                await deckApi.create(formData);
            }
            setShowModal(false);
            fetchDecks();
        } catch (error) {
            console.error("Error saving deck:", error);
            alert("Có lỗi xảy ra khi lưu bộ thẻ!");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa bộ thẻ này không? Các từ vựng bên trong sẽ không bị xóa, chỉ bị gỡ khỏi bộ thẻ.")) {
            try {
                await deckApi.delete(id);
                fetchDecks();
            } catch (error) {
                console.error("Error deleting deck:", error);
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Library className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Bộ Thẻ Của Tôi</h1>
                        <p className="text-slate-500 text-sm mt-1">Quản lý và nhóm các từ vựng theo chủ đề để ôn tập dễ dàng hơn.</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-indigo-200"
                >
                    <Plus className="w-5 h-5" />
                    Tạo Bộ Thẻ Mới
                </button>
            </div>

            {/* Grid Decks */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            ) : decks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <Library className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có bộ thẻ nào</h3>
                    <p className="text-slate-500 mb-6">Hãy tạo một bộ thẻ mới để bắt đầu nhóm các từ vựng lại với nhau.</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-6 py-2 rounded-xl font-medium transition-colors"
                    >
                        Tạo Bộ Thẻ Đầu Tiên
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {decks.map((deck) => (
                        <div key={deck.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col h-full">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(deck)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(deck.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl flex items-center justify-center text-indigo-500 mb-4 border border-indigo-100/50 block">
                                <Library className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">{deck.title}</h3>
                            <p className="text-slate-500 text-sm line-clamp-2 mb-6 flex-grow">{deck.description || 'Không có mô tả'}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                    <BookOpen className="w-4 h-4" />
                                    <span>{deck._count?.items || 0} từ vựng</span>
                                </div>
                                {deck._count?.items > 0 ? (
                                    <Link to={`/flashcards?deck=${deck.id}`} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                                        Ôn Tập Ngay
                                    </Link>
                                ) : (
                                    <span className="text-sm text-slate-400 italic">Trống</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingDeck ? 'Thỉnh Sửa Bộ Thẻ' : 'Tạo Bộ Thẻ Mới'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên bộ thẻ <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Vd: 3000 từ vựng Oxford..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả chi tiết</label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Vd: Dành cho việc ôn tập chứng chỉ IELTS..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 bg-slate-50 focus:bg-white resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="isPublic"
                                    checked={formData.isPublic}
                                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                />
                                <label htmlFor="isPublic" className="text-sm font-medium text-slate-700 cursor-pointer">
                                    Công khai (mọi người có thể xem)
                                </label>
                            </div>

                            <div className="pt-6 flex justify-end gap-3">
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
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {editingDeck ? 'Lưu Thay Đổi' : 'Tạo Bộ Thẻ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DecksManagement;
