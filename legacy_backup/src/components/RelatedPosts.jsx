import React, { useEffect, useState } from 'react';
import { Link2, Loader2, Sparkles } from 'lucide-react';

export const RelatedPosts = ({ content, apiUrl, onSelect }) => {
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(false);
    const [insight, setInsight] = useState(null);
    const [insightLoading, setInsightLoading] = useState(false);

    useEffect(() => {
        const fetchRelated = async () => {
            if (!content || content.length < 20) return;
            setLoading(true);
            try {
                const res = await fetch(`${apiUrl}/ai/related`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                });
                const data = await res.json();
                if (Array.isArray(data)) setRelated(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        // Debounce
        const timeout = setTimeout(fetchRelated, 1500);
        return () => clearTimeout(timeout);
    }, [content, apiUrl]);

    const handleConnect = async (post) => {
        setInsightLoading(post.id);
        setInsight(null);
        try {
            const res = await fetch(`${apiUrl}/ai/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentA: content, contentB: post.content, titleB: post.title })
            });
            const data = await res.json();
            if (data.insight) setInsight({ ...data, relatedPostId: post.id });
        } catch (e) {
            console.error(e);
            alert("Could not generate insight");
        } finally {
            setInsightLoading(false);
        }
    };

    if (related.length === 0 && !loading) return null;

    return (
        <div className="w-full lg:w-72 shrink-0 lg:border-l border-slate-100 lg:pl-6 space-y-4">
            <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider flex items-center gap-2">
                <Link2 className="w-3 h-3" /> Related Notes
            </h3>

            {loading && (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                </div>
            )}

            <div className="space-y-3">
                {related.map(item => (
                    <div key={item.id} className="group relative">
                        <div
                            onClick={() => onSelect && onSelect(item)}
                            className="p-3 bg-slate-50 hover:bg-white border border-transparent hover:border-indigo-100 rounded-xl cursor-pointer transition-all hover:shadow-sm"
                        >
                            <h4 className="font-bold text-sm text-slate-700 group-hover:text-indigo-600 line-clamp-2">{item.title}</h4>
                            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                                <span>Similarity</span>
                                <span className="font-mono text-indigo-400">{item.distance ? (1 - item.distance).toFixed(2) : '0.00'}</span>
                            </div>
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); handleConnect(item); }}
                            className="absolute -right-2 -top-2 bg-white text-yellow-500 shadow-sm border border-yellow-100 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:shadow-md"
                            title="Find Creative Connection"
                        >
                            {insightLoading === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        </button>

                        {insight && insight.relatedPostId === item.id && (
                            <div className="my-2 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-slate-700 animate-fade-in relative">
                                <button onClick={() => setInsight(null)} className="absolute top-1 right-2 text-slate-400 hover:text-slate-600">×</button>
                                <div className="font-bold text-yellow-600 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Insight</div>
                                <div className="whitespace-pre-line">{insight.insight}</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
