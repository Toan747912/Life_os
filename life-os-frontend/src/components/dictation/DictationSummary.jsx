import React from 'react';
import { useNavigate } from 'react-router-dom';

const DictationSummary = ({
    dictation,
    sentences,
    sentenceResults,
    setShowSummary,
    setCurrentSentenceIndex,
    dictationId
}) => {
    const navigate = useNavigate();
    const resultsArray = Object.values(sentenceResults);
    const totalSentences = sentences?.length || 0;
    const completedCount = resultsArray.length;
    const averageAccuracy = completedCount > 0
        ? resultsArray.reduce((acc, curr) => acc + curr.analysis.accuracy, 0) / completedCount
        : 0;

    return (
        <div className="max-w-4xl mx-auto p-10 mt-10 glass-panel rounded-3xl shadow-2xl text-center border border-slate-200/50 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="text-8xl mb-6 drop-shadow-xl animate-bounce-slow">🏆</div>
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 mb-3 tracking-tight">Hoàn Thành Bài Tập!</h2>
            <p className="text-slate-500 mb-10 max-w-lg mx-auto leading-relaxed font-medium text-lg">{dictation?.title}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="p-6 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-2xl border border-blue-100/50 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4 shadow-sm">
                        <svg xmlns="http://www.w3.org/0000.svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 11-6 6-4-4" /><path d="M12 22a10 10 0 1 1 10-10" /></svg>
                    </div>
                    <div className="text-sm font-bold text-blue-600/80 uppercase tracking-widest mb-1">Tiến độ</div>
                    <div className="text-4xl font-black text-blue-700 tracking-tight">{completedCount}<span className="text-2xl text-blue-400 font-bold">/{totalSentences}</span></div>
                </div>
                <div className="p-6 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl border border-emerald-100/50 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4 shadow-sm">
                        <svg xmlns="http://www.w3.org/0000.svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                    </div>
                    <div className="text-sm font-bold text-emerald-600/80 uppercase tracking-widest mb-1">Độ chính xác</div>
                    <div className="text-4xl font-black text-emerald-700 tracking-tight">{averageAccuracy.toFixed(1)}%</div>
                </div>
                <div className="p-6 bg-gradient-to-br from-purple-50/80 to-fuchsia-50/50 rounded-2xl border border-purple-100/50 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mx-auto mb-4 shadow-sm">
                        <svg xmlns="http://www.w3.org/0000.svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>
                    </div>
                    <div className="text-sm font-bold text-purple-600/80 uppercase tracking-widest mb-1">Ngôn ngữ</div>
                    <div className="text-3xl font-black text-purple-700 tracking-tight">{dictation?.language}</div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button
                    onClick={() => {
                        setShowSummary(false);
                        setCurrentSentenceIndex(0);
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                    Xem Lại Bài Làm
                </button>
                <button
                    onClick={() => {
                        localStorage.removeItem(`dictation_${dictationId}`);
                        navigate('/dictation');
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                    Trở Về Danh Sách
                    <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </button>
            </div>
        </div>
    );
};

export default DictationSummary;
