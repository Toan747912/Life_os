import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, BookOpen, Clock, Layers, FileText, CheckCircle2, Volume2, Mic, Youtube } from 'lucide-react';
import ShadowingPractice from '../components/ShadowingPractice';
import { playTextToSpeech } from '../utils/speech';

const ResourceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [shadowingItem, setShadowingItem] = useState(null);

    const playAudio = (text, e) => {
        if (e) e.stopPropagation();
        playTextToSpeech(text, 0.9);
    };
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await api.get(`/learning/${id}`);
                setResource(res.data.data);
            } catch (error) {
                console.error("Lỗi tải chi tiết:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;
    if (!resource) return <div className="p-10 text-center text-red-500">Không tìm thấy tài liệu!</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Back Button */}
            <button
                onClick={() => navigate('/learning')}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
            >
                <ArrowLeft size={20} /> Quay lại thư viện
            </button>

            {/* Header Section */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900">{resource.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Clock size={16} /> {new Date(resource.createdAt).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><Layers size={16} /> {resource.learningItems.length} từ vựng</span>
                        </div>
                    </div>
                    <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold">
                        {resource.aiMetadata?.difficulty || 'General'}
                    </span>
                </div>

                {/* AI Summary */}
                <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                    <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-3">
                        <BookOpen size={20} /> Tóm tắt nội dung
                    </h2>
                    <p className="text-blue-800 leading-relaxed">
                        {resource.aiMetadata?.summary}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                            <FileText size={20} /> Nội dung chi tiết
                        </h2>
                        <div className="prose prose-blue max-w-none whitespace-pre-wrap text-gray-700 leading-loose">
                            {resource.rawContent}
                        </div>
                    </div>
                </div>

                {/* Vocabulary Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                            <CheckCircle2 size={20} /> Từ vựng / Thuật ngữ
                        </h2>
                        <div className="space-y-4">
                            {resource.learningItems.map((item) => {
                                const proficiency = item.progress?.[0]?.proficiency || 0;
                                return (
                                    <div key={item.id} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all group">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors uppercase text-sm flex items-center gap-2">
                                                {item.term}
                                                <button
                                                    onClick={(e) => playAudio(item.term, e)}
                                                    className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
                                                    title="Nghe phát âm"
                                                >
                                                    <Volume2 size={16} />
                                                </button>
                                                {item.extraInfo?.ipa && (
                                                    <span className="text-xs font-mono text-slate-400 normal-case font-medium">
                                                        [{item.extraInfo.ipa}]
                                                    </span>
                                                )}
                                                {resource.aiMetadata?.sourceUrl && item.extraInfo?.timestamp !== null && item.extraInfo?.timestamp !== undefined && (
                                                    <a
                                                        href={`${resource.aiMetadata.sourceUrl}${resource.aiMetadata.sourceUrl.includes('?') ? '&' : '?'}t=${item.extraInfo.timestamp}s`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-1 text-rose-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors ml-1"
                                                        title="Xem ngữ cảnh trên YouTube"
                                                    >
                                                        <Youtube size={16} />
                                                    </a>
                                                )}
                                            </div>
                                            {/* Mastery Dots */}
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((dot) => (
                                                    <div
                                                        key={dot}
                                                        className={`w-1.5 h-1.5 rounded-full ${dot <= proficiency ? 'bg-emerald-500' : 'bg-slate-200'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-600 leading-snug mb-2">
                                            {item.definition}
                                        </div>
                                        {item.extraInfo?.synonyms && item.extraInfo.synonyms.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {item.extraInfo.synonyms.map((syn, idx) => (
                                                    <span key={idx} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                                                        {syn}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setShadowingItem(item)}
                                            className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-xl text-sm font-semibold transition-colors"
                                        >
                                            <Mic size={16} /> Luyện phát âm (Shadowing)
                                        </button>
                                    </div>
                                );
                            })}
                            {resource.learningItems.length === 0 && (
                                <p className="text-gray-400 text-sm text-center py-4 italic">
                                    Không có từ vựng nào được trích xuất.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Shadowing Practice Modal */}
            <ShadowingPractice
                isOpen={!!shadowingItem}
                onClose={() => setShadowingItem(null)}
                targetText={shadowingItem?.term || ''}
                targetIpa={shadowingItem?.extraInfo?.ipa || ''}
            />
        </div>
    );
};

export default ResourceDetail;
