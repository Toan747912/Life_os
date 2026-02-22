import React, { useState } from 'react';
import { PenTool, Send, CheckCircle2, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { learningService } from '../services/api';

const WritingPractice = ({ targetWords = [] }) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!text.trim()) {
            setError('Vui lòng nhập đoạn văn của bạn.');
            return;
        }

        if (text.trim().split(' ').length < 10) {
            setError('Đoạn văn quá ngắn, hãy viết ít nhất 10 từ nhé.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await learningService.evaluateWriting({
                text,
                targetWords
            });
            setResult(response.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Đã xảy ra lỗi khi chấm bài. Vui lòng thử lại.');
            console.error("Lỗi khi gọi API evaluate-writing:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setText('');
        setError('');
    };

    return (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                    <PenTool size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">AI Writing Evaluator</h2>
                    <p className="text-gray-500 text-sm">Cải thiện kỹ năng viết tiếng Anh với giám khảo AI Gemini</p>
                </div>
            </div>

            {!result ? (
                <div className="space-y-6">
                    {targetWords.length > 0 && (
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                            <h3 className="text-sm font-semibold text-indigo-900 mb-2">Từ vựng mục tiêu cần sử dụng:</h3>
                            <div className="flex flex-wrap gap-2">
                                {targetWords.map((word, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-sm font-medium shadow-sm">
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Viết đoạn văn của bạn ở đây (khuyến nghị 30-100 từ)..."
                            className="w-full h-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none leading-relaxed transition-all"
                            disabled={loading}
                        />
                        {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${loading
                                ? 'bg-purple-100 text-purple-400 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200/50'
                            }`}
                    >
                        {loading ? (
                            <>
                                <RefreshCw size={20} className="animate-spin" />
                                Đang chấm bài...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Gửi cho AI chấm điểm
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Score Card */}
                    <div className="flex items-center justify-center p-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl text-white shadow-xl shadow-purple-200/50">
                        <div className="text-center">
                            <p className="text-purple-100 font-medium mb-1 uppercase tracking-wider text-sm">Điểm số</p>
                            <div className="text-6xl font-black drop-shadow-md">
                                {result.score}<span className="text-2xl text-purple-200 font-bold">/100</span>
                            </div>
                        </div>
                    </div>

                    {/* Grammar Feedback */}
                    <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
                        <h3 className="font-bold text-rose-900 flex items-center gap-2 mb-4">
                            <AlertTriangle size={18} /> Lỗi ngữ pháp
                        </h3>
                        {result.grammarFeedback && result.grammarFeedback.length > 0 ? (
                            <div className="space-y-3">
                                {result.grammarFeedback.map((issue, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm text-sm">
                                        <div className="flex gap-2 items-start mb-2">
                                            <span className="text-rose-500 line-through font-medium">{issue.error}</span>
                                            <span className="text-emerald-500 font-bold">→ {issue.correction}</span>
                                        </div>
                                        <p className="text-slate-600">{issue.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-emerald-600 font-medium flex items-center gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                <CheckCircle2 size={16} /> Tuyệt vời! AI không bắt được lỗi ngữ pháp nào.
                            </p>
                        )}
                    </div>

                    {/* Vocabulary Usage */}
                    <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                        <h3 className="font-bold text-emerald-900 flex items-center gap-2 mb-2">
                            <CheckCircle2 size={18} /> Nhận xét Từ vựng
                        </h3>
                        <p className="text-emerald-800 text-sm leading-relaxed whitespace-pre-wrap">
                            {result.vocabularyUsage}
                        </p>
                    </div>

                    {/* Suggested Revision */}
                    <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl"></div>
                        <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-3">
                            <Lightbulb size={18} className="text-blue-600" /> Bản sửa mẫu (Native-like)
                        </h3>
                        <p className="text-blue-800 leading-relaxed italic">
                            "{result.suggestedRevision}"
                        </p>
                    </div>

                    <button
                        onClick={handleReset}
                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <RefreshCw size={18} />
                        Viết lại bài khác
                    </button>
                </div>
            )}
        </div>
    );
};

export default WritingPractice;
