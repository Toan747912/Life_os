import React, { useState, useEffect } from 'react';
import { aiFeatureApi, deckApi } from '../services/api';
import { BookOpen, HelpCircle, Loader2, Sparkles, RefreshCw, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const AIPractice = () => {
    const [decks, setDecks] = useState([]);
    const [selectedDeck, setSelectedDeck] = useState('');
    const [loading, setLoading] = useState(false);

    // Feature Tabs
    const [activeTab, setActiveTab] = useState('STORY'); // 'STORY' | 'CLOZE'

    // Result State
    const [storyResult, setStoryResult] = useState(null);
    const [clozeResult, setClozeResult] = useState(null);

    // Config State
    const [difficulty, setDifficulty] = useState('intermediate');

    useEffect(() => {
        const fetchDecks = async () => {
            try {
                const res = await deckApi.getAll();
                setDecks(res.data.data.filter(d => d._count?.items > 0)); // Only decks with items
            } catch (error) {
                console.error("Failed to load decks for AI:", error);
            }
        };
        fetchDecks();
    }, []);

    const generateContent = async () => {
        if (!selectedDeck) {
            toast.error("Vui lòng chọn một bộ thẻ để AI lấy từ vựng!");
            return;
        }

        try {
            setLoading(true);
            setStoryResult(null);
            setClozeResult(null);

            // Fetch vocabularies of selected deck
            const deckRes = await deckApi.getById(selectedDeck);
            const items = deckRes.data.data.items;

            if (!items || items.length === 0) {
                toast.error("Bộ thẻ này không có từ vựng nào.");
                return;
            }

            // Extract terms
            // Take up to 10 random words to avoid too long prompt
            const shuffled = [...items].sort(() => 0.5 - Math.random());
            const words = shuffled.slice(0, 10).map(i => i.learningItem.item.term);

            if (activeTab === 'STORY') {
                const res = await aiFeatureApi.generateStory(words, difficulty);
                if (res.data?.data) {
                    setStoryResult(res.data.data);
                }
            } else {
                // For Cloze, we need sentences. We can send words and ask AI to generate cloze containing those words.
                // Wait, our AI service expects 'sentences' array for generateCloze.
                // Let's modify the prompt on backend if needed, or pass sentences if we have them.
                // Actually, let's just pass the terms and let AI build sentences, or use the example sentences if available.
                const sentences = shuffled.slice(0, 5).map(i => {
                    return i.learningItem.item.exampleSentence || `Can you generate a sentence using the word ${i.learningItem.item.term}?`;
                }).filter(Boolean);

                const res = await aiFeatureApi.generateCloze(sentences);
                if (res.data?.data) {
                    setClozeResult(res.data.data);
                }
            }
            toast.success("AI đã tạo xong nội dung!");
        } catch (error) {
            console.error("AI Generation failed:", error);
            toast.error("Thất bại khi gọi AI. Có thể do quá tải.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 via-transparent to-transparent p-6 rounded-2xl flex items-center justify-between border-l-4 border-indigo-500 bg-white/50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Phòng Luyện Tập AI</h1>
                        <p className="text-slate-600 text-sm mt-1">Dùng AI sinh ra đoạn văn hoặc bài tập tự động từ Sổ tay từ vựng của bạn.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Control Panel */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-500" /> Cấu hình Sinh AI
                        </h3>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Nguồn từ vựng (Bộ Thẻ)</label>
                            <select
                                value={selectedDeck}
                                onChange={e => setSelectedDeck(e.target.value)}
                                className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 ring-indigo-500/20"
                            >
                                <option value="">-- Chọn bộ thẻ --</option>
                                {decks.map(d => (
                                    <option key={d.id} value={d.id}>{d.title} ({d._count?.items} từ)</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Chế độ hiển thị</label>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setActiveTab('STORY')}
                                    className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-all ${activeTab === 'STORY' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                >
                                    Đọc Truyện
                                </button>
                                <button
                                    onClick={() => setActiveTab('CLOZE')}
                                    className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-all ${activeTab === 'CLOZE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                >
                                    Điền Từ
                                </button>
                            </div>
                        </div>

                        {activeTab === 'STORY' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Độ khó bài đọc</label>
                                <select
                                    value={difficulty}
                                    onChange={e => setDifficulty(e.target.value)}
                                    className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 ring-indigo-500/20"
                                >
                                    <option value="beginner">Dễ (Beginner)</option>
                                    <option value="intermediate">Vừa (Intermediate)</option>
                                    <option value="advanced">Khó (Advanced)</option>
                                </select>
                            </div>
                        )}

                        <button
                            onClick={generateContent}
                            disabled={loading || !selectedDeck}
                            className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex flex-center items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            Bắt đầu Sinh AI
                        </button>
                    </div>
                </div>

                {/* Display Area */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 min-h-[400px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-indigo-500 gap-3 py-20">
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-full blur-xl bg-indigo-400/30 animate-pulse"></div>
                                    <RefreshCw className="w-10 h-10 animate-spin relative z-10" />
                                </div>
                                <span className="text-slate-500 font-medium animate-pulse">AI đang phân tích và sáng tạo...</span>
                            </div>
                        ) : activeTab === 'STORY' && storyResult ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <h2 className="text-2xl font-black text-slate-800">{storyResult.title}</h2>
                                <div className="prose prose-indigo max-w-none text-slate-700 leading-loose text-lg">
                                    {/* Render paragraphs */}
                                    {storyResult.englishContent.split('\n').map((p, i) => (
                                        <p key={i}>{p}</p>
                                    ))}
                                </div>
                                <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="font-bold text-slate-500 mb-2 uppercase text-xs tracking-wider">Từ vựng mục tiêu xuất hiện:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {storyResult.targetWordsUsed?.map((w, i) => (
                                            <span key={i} className="px-3 py-1 bg-white border border-indigo-100 text-indigo-600 rounded-lg text-sm font-bold shadow-sm">
                                                {w}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'CLOZE' && clozeResult ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                                    <HelpCircle className="w-6 h-6 text-indigo-500" /> Bài tập điền từ
                                </h2>
                                <div className="space-y-5">
                                    {clozeResult.exercises?.map((ex, idx) => (
                                        <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                                            <span className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center border-4 border-white">
                                                {idx + 1}
                                            </span>
                                            <p className="text-lg text-slate-700 leading-relaxed ml-2 font-medium">
                                                {ex.sentenceWithBlank.split('___').map((part, i, arr) => (
                                                    <React.Fragment key={i}>
                                                        {part}
                                                        {i < arr.length - 1 && (
                                                            <input
                                                                type="text"
                                                                placeholder="......"
                                                                className="mx-2 w-24 border-b-2 border-slate-300 bg-transparent text-center focus:outline-none focus:border-indigo-500 text-indigo-600 font-bold transition-colors"
                                                            />
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </p>
                                            <div className="mt-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded">Đáp án: {ex.answer}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center h-full text-slate-400 gap-4 py-20">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-10 h-10 text-slate-300" />
                                </div>
                                <p>Cấu hình ở menu bên trái và nhấn Bắt đầu Sinh AI <br /> để tạo bài luyện tập cá nhân hóa.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AIPractice;
