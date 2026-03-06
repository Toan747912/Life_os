import React, { useState, useEffect } from 'react';
import { vocabularyApi, flashcardApi, deckApi } from '../services/api';
import { Link } from 'react-router-dom';
import {
    Trash2, BookOpen, Zap, RefreshCw, LayoutGrid,
    List, Table2, AlignLeft, Volume2, PlusCircle, CheckSquare, X
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ============================
   FLIP CARD COMPONENT
   ============================ */
const FlipCard = ({ vocab, onDelete, deletingId }) => {
    const [flipped, setFlipped] = useState(false);
    const isDeleting = deletingId === vocab.id;
    const extraInfo = vocab.item.extraInfo || {};

    const speak = (e, word) => {
        e.stopPropagation();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(word);
            u.lang = 'en-US';
            window.speechSynthesis.speak(u);
        }
    };

    return (
        <div
            className={`relative cursor-pointer select-none ${isDeleting ? 'opacity-40 scale-95' : ''} transition-all duration-200`}
            style={{ perspective: '1000px', height: '200px' }}
            onClick={() => setFlipped(f => !f)}
        >
            {/* Select checkbox */}
            {vocab.selectable && (
                <div
                    className="absolute top-2 left-2 z-20"
                    onClick={e => { e.stopPropagation(); vocab.onSelect(vocab.id); }}
                >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${vocab.selected ? 'bg-indigo-500 border-indigo-500' : 'bg-white/50 border-white/80'}`}>
                        {vocab.selected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                    </div>
                </div>
            )}

            {/* Delete btn */}
            <button
                className="absolute top-2 right-2 z-20 w-7 h-7 flex items-center justify-center rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-rose-100"
                style={{ opacity: 1 }}
                onClick={e => { e.stopPropagation(); onDelete(vocab); }}
                title="Xóa"
            >
                {isDeleting
                    ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-rose-400" />
                    : <Trash2 className="w-3.5 h-3.5" />}
            </button>

            <div
                className="relative w-full h-full transition-transform duration-500 ease-in-out"
                style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
                {/* Front */}
                <div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex flex-col items-center justify-center p-5 shadow-lg shadow-indigo-500/30"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <span className="text-3xl font-black mb-2">{vocab.item.term}</span>
                    {extraInfo.phonetic && <span className="text-sm font-mono opacity-80">{extraInfo.phonetic}</span>}
                    <div className="flex items-center gap-2 mt-3">
                        {extraInfo.partOfSpeech && (
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">{extraInfo.partOfSpeech}</span>
                        )}
                        <button onClick={e => speak(e, vocab.item.term)} className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
                            <Volume2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <p className="text-xs opacity-60 mt-auto">Bấm để xem nghĩa ↗</p>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 rounded-2xl bg-white border border-indigo-100 shadow-lg p-5 flex flex-col justify-between overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div>
                        <p className="text-base font-bold text-slate-800 mb-1">{vocab.item.definition}</p>
                        {vocab.item.exampleSentence && (
                            <p className="text-xs text-slate-500 italic border-l-2 border-indigo-200 pl-2 mt-2">"{vocab.item.exampleSentence}"</p>
                        )}
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-2 mt-2">
                        <span>Độ thành thạo: <b className="text-indigo-500">{vocab.proficiency}/5</b></span>
                        <span>↗ Bấm để lật lại</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ============================
   MAIN PAGE
   ============================ */
const VocabularyVault = () => {
    const [vocabularies, setVocabularies] = useState([]);
    const [dueCount, setDueCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [viewMode, setViewMode] = useState('card');
    const [search, setSearch] = useState('');

    // Decks integration
    const [decks, setDecks] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [showDeckModal, setShowDeckModal] = useState(false);
    const [savingToDeck, setSavingToDeck] = useState(false);

    useEffect(() => { loadData(); fetchDecks(); }, []);

    const fetchDecks = async () => {
        try {
            const res = await deckApi.getAll();
            setDecks(res.data.data);
        } catch (error) {
            console.error("Failed to load decks", error);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [vocabRes, dueRes] = await Promise.all([
                vocabularyApi.getAll(),
                flashcardApi.getDue()
            ]);
            setVocabularies(vocabRes.data.data);
            setDueCount(dueRes.data.count);
        } catch (error) {
            toast.error('Không thể tải danh sách từ vựng.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSaveToDeck = async (deckId) => {
        if (selectedIds.size === 0) return;
        try {
            setSavingToDeck(true);
            await deckApi.addItems(deckId, Array.from(selectedIds));
            toast.success(`Đã thêm ${selectedIds.size} từ vào bộ thẻ!`);
            setShowDeckModal(false);
            setIsSelectMode(false);
            setSelectedIds(new Set());
        } catch (error) {
            toast.error("Có lỗi xảy ra khi lưu vào bộ thẻ.");
        } finally {
            setSavingToDeck(false);
        }
    };

    const handleDelete = async (vocab) => {
        if (!window.confirm(`Xóa từ "${vocab.item.term}" khỏi sổ tay?`)) return;
        setDeletingId(vocab.id);
        try {
            await vocabularyApi.delete(vocab.id);
            setVocabularies(prev => prev.filter(v => v.id !== vocab.id));
            toast.success(`Đã xóa "${vocab.item.term}"!`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xóa thất bại.');
        } finally {
            setDeletingId(null);
        }
    };

    const proficiencyBadge = (level) => {
        if (level === 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-100">Mới</span>;
        if (level <= 2) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">Đang học</span>;
        if (level <= 4) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Khá tốt</span>;
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Thuộc rồi</span>;
    };

    const filtered = vocabularies.filter(v =>
        v.item.term.toLowerCase().includes(search.toLowerCase()) ||
        (v.item.definition || '').toLowerCase().includes(search.toLowerCase())
    );

    // Group by first letter (for alpha view)
    const grouped = filtered.reduce((acc, v) => {
        const letter = v.item.term.charAt(0).toUpperCase();
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(v);
        return acc;
    }, {});
    const sortedLetters = Object.keys(grouped).sort();

    const VIEW_MODES = [
        { key: 'card', icon: LayoutGrid, label: 'Thẻ lật' },
        { key: 'list', icon: AlignLeft, label: 'Danh sách' },
        { key: 'table', icon: Table2, label: 'Bảng' },
        { key: 'alpha', icon: List, label: 'Theo chữ' },
    ];

    return (
        <div className="max-w-6xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-600 tracking-tight">
                        📖 Sổ Tay Từ Vựng
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">{vocabularies.length} từ vựng đã lưu</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setIsSelectMode(!isSelectMode);
                            if (isSelectMode) setSelectedIds(new Set());
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isSelectMode ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        <CheckSquare className="w-4 h-4" />
                        {isSelectMode ? 'Hủy chọn' : 'Chọn Nhiều'}
                    </button>
                    <button onClick={loadData} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-sm font-medium">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Floating Action Bar (When items are selected) */}
            {isSelectMode && selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10">
                    <span className="font-bold">Đã chọn {selectedIds.size} từ</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowDeckModal(true)}
                            className="bg-indigo-500 hover:bg-indigo-400 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <PlusCircle className="w-4 h-4" /> Thêm vào Bộ thẻ
                        </button>
                        <button
                            onClick={() => { setIsSelectMode(false); setSelectedIds(new Set()); }}
                            className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            {/* Due Banner */}
            {dueCount > 0 && (
                <div className="bg-gradient-to-r from-orange-100 to-red-100 border-l-4 border-orange-500 text-orange-800 p-4 rounded-xl mb-6 flex justify-between items-center shadow-sm">
                    <div>
                        <p className="font-bold">🔥 Đã đến lúc ôn tập!</p>
                        <p className="text-sm">Bạn có <b className="text-red-600 text-lg mx-1">{dueCount}</b> từ cần ôn tập hôm nay.</p>
                    </div>
                    <Link to="/flashcards" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl font-bold transition-all shadow flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4" /> Ôn Ngay
                    </Link>
                </div>
            )}

            {/* Toolbar: Search + View Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="🔍 Tìm kiếm từ vựng..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm shadow-sm"
                />
                <div className="flex items-center bg-white/80 border border-slate-200 rounded-xl overflow-hidden shadow-sm p-1 gap-1">
                    {VIEW_MODES.map(m => (
                        <button
                            key={m.key}
                            onClick={() => setViewMode(m.key)}
                            title={m.label}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === m.key ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <m.icon className="w-3.5 h-3.5" /> {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    <p className="text-slate-400 text-sm animate-pulse">Đang tải sổ tay...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-100 shadow-xl">
                    <div className="text-5xl mb-4 opacity-60">📭</div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">
                        {search ? 'Không tìm thấy từ nào khớp' : 'Chưa có từ vựng nào'}
                    </h3>
                    <p className="text-slate-500 text-sm mb-4">Bấm vào từ trong bài Dictation để lưu vào sổ tay.</p>
                    {!search && (
                        <Link to="/dictations" className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-100 transition-colors text-sm">
                            <BookOpen className="w-4 h-4" /> Đến bài Dictation
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    {/* ---- CARD / FLIP VIEW ---- */}
                    {viewMode === 'card' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filtered.map(vocab => (
                                <FlipCard
                                    key={vocab.id}
                                    vocab={{
                                        ...vocab,
                                        selectable: isSelectMode,
                                        selected: selectedIds.has(vocab.id),
                                        onSelect: toggleSelection
                                    }}
                                    onDelete={handleDelete}
                                    deletingId={deletingId}
                                />
                            ))}
                        </div>
                    )}

                    {/* ---- LIST VIEW ---- */}
                    {viewMode === 'list' && (
                        <div className="flex flex-col gap-2">
                            {filtered.map(vocab => {
                                const extra = vocab.item.extraInfo || {};
                                return (
                                    <div
                                        key={vocab.id}
                                        onClick={() => isSelectMode ? toggleSelection(vocab.id) : null}
                                        className={`group bg-white/90 rounded-2xl border ${isSelectMode && selectedIds.has(vocab.id) ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-100'} shadow-sm hover:shadow-md transition-all px-5 py-4 flex items-start gap-4 ${isSelectMode ? 'cursor-pointer' : ''}`}
                                    >
                                        {isSelectMode && (
                                            <div className="pt-1">
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${selectedIds.has(vocab.id) ? 'bg-indigo-500 border-indigo-500' : 'bg-slate-100 border-slate-300'}`}>
                                                    {selectedIds.has(vocab.id) && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-lg font-bold text-slate-800">{vocab.item.term}</span>
                                                {extra.phonetic && <span className="text-xs font-mono text-slate-400">{extra.phonetic}</span>}
                                                {extra.partOfSpeech && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">{extra.partOfSpeech}</span>
                                                )}
                                                {proficiencyBadge(vocab.proficiency)}
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1">{vocab.item.definition}</p>
                                            {vocab.item.exampleSentence && (
                                                <p className="text-xs text-slate-400 italic mt-1 truncate">"{vocab.item.exampleSentence}"</p>
                                            )}
                                            {extra.synonyms?.length > 0 && (
                                                <div className="flex gap-1 mt-2 flex-wrap">
                                                    {extra.synonyms.slice(0, 3).map((s, i) => (
                                                        <span key={i} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">{s}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="shrink-0 flex flex-col items-end gap-2">
                                            <span className="text-xs text-slate-400 font-mono">{new Date(vocab.nextReviewDate).toLocaleDateString('vi-VN')}</span>
                                            <button
                                                onClick={() => handleDelete(vocab)}
                                                disabled={deletingId === vocab.id}
                                                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                                            >
                                                {deletingId === vocab.id ? <div className="animate-spin h-3 w-3 border-b-2 border-rose-400 rounded-full" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ---- TABLE VIEW ---- */}
                    {viewMode === 'table' && (
                        <div className="bg-white/90 rounded-2xl border border-slate-100 shadow-md overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-slate-100">
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Từ vựng</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Phiên âm</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Nghĩa</th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Từ loại</th>
                                        <th className="px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Trình độ</th>
                                        <th className="px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Ôn tiếp</th>
                                        <th className="px-3 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((vocab, idx) => {
                                        const extra = vocab.item.extraInfo || {};
                                        return (
                                            <tr key={vocab.id} className={`border-b border-slate-50 hover:bg-indigo-50/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                                                <td className="px-5 py-3">
                                                    <span className="font-bold text-slate-800">{vocab.item.term}</span>
                                                </td>
                                                <td className="px-5 py-3 font-mono text-slate-500 text-xs">{extra.phonetic || '—'}</td>
                                                <td className="px-5 py-3 text-slate-700 max-w-[220px] truncate">{vocab.item.definition || '—'}</td>
                                                <td className="px-5 py-3">
                                                    {extra.partOfSpeech ? (
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">{extra.partOfSpeech}</span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-5 py-3 text-center">{proficiencyBadge(vocab.proficiency)}</td>
                                                <td className="px-5 py-3 text-center font-mono text-xs text-slate-400">
                                                    {new Date(vocab.nextReviewDate).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <button
                                                        onClick={() => handleDelete(vocab)}
                                                        disabled={deletingId === vocab.id}
                                                        className="w-7 h-7 flex items-center justify-center mx-auto rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                    >
                                                        {deletingId === vocab.id ? <div className="animate-spin h-3 w-3 border-b-2 border-rose-400 rounded-full" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ---- ALPHABET GROUP VIEW ---- */}
                    {viewMode === 'alpha' && (
                        <div className="space-y-8">
                            {sortedLetters.map(letter => (
                                <div key={letter}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">{letter}</div>
                                        <div className="flex-1 h-px bg-gradient-to-r from-indigo-100 to-transparent"></div>
                                        <span className="text-xs text-slate-400">{grouped[letter].length} từ</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {grouped[letter].map(vocab => {
                                            const extra = vocab.item.extraInfo || {};
                                            return (
                                                <div key={vocab.id} className="group bg-white/90 rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-start justify-between hover:shadow-md transition-all">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-800">{vocab.item.term}</span>
                                                            {extra.phonetic && <span className="text-[11px] font-mono text-slate-400">{extra.phonetic}</span>}
                                                        </div>
                                                        <p className="text-sm text-slate-600 mt-0.5 truncate">{vocab.item.definition}</p>
                                                        <div className="mt-1.5 flex items-center gap-1.5">
                                                            {extra.partOfSpeech && (
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">{extra.partOfSpeech}</span>
                                                            )}
                                                            {proficiencyBadge(vocab.proficiency)}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(vocab)}
                                                        disabled={deletingId === vocab.id}
                                                        className="ml-2 mt-0.5 w-7 h-7 flex items-center justify-center shrink-0 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 opacity-0 group-hover:opacity-100"
                                                    >
                                                        {deletingId === vocab.id ? <div className="animate-spin h-3 w-3 border-b-2 border-rose-400 rounded-full" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Deck Selection Modal */}
            {showDeckModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">Chọn Bộ Thẻ</h2>
                            <button onClick={() => setShowDeckModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {decks.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-slate-500 mb-4">Bạn chưa tạo bộ thẻ nào.</p>
                                    <Link to="/decks" className="text-indigo-600 font-medium hover:underline">
                                        Đến trang Quản lý Bộ Thẻ để tạo mới
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {decks.map(deck => (
                                        <button
                                            key={deck.id}
                                            disabled={savingToDeck}
                                            onClick={() => handleSaveToDeck(deck.id)}
                                            className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                                        >
                                            <div>
                                                <h3 className="font-bold text-slate-800 group-hover:text-indigo-700">{deck.title}</h3>
                                                <p className="text-xs text-slate-500 mt-1">{deck._count?.items || 0} từ vựng hiện tại</p>
                                            </div>
                                            <PlusCircle className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VocabularyVault;
