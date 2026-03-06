import React, { useState, useEffect } from 'react';
import { gamificationApi } from '../services/api';
import { Swords, Star, Flame, Target, Trophy, CheckCircle2, Loader2, ArrowRight, BookOpen, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Quests = () => {
    const [quests, setQuests] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await gamificationApi.getDashboard();
                if (res.data?.data) {
                    setQuests(res.data.data.dailyQuests || []);
                    setStats({
                        xp: res.data.data.xp,
                        level: res.data.data.level,
                        streak: res.data.data.streak
                    });
                }
            } catch (error) {
                console.error("Failed to load gamification data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getQuestIcon = (type) => {
        switch (type) {
            case 'DICTATION': return <Target className="w-6 h-6 text-orange-500" />;
            case 'REVIEW': return <Star className="w-6 h-6 text-yellow-500" />;
            case 'LESSON': return <BookOpen className="w-6 h-6 text-blue-500" />;
            case 'SPEAKING': return <Volume2 className="w-6 h-6 text-green-500" />;
            default: return <Swords className="w-6 h-6 text-indigo-500" />;
        }
    };

    const getQuestActionLink = (type) => {
        switch (type) {
            case 'DICTATION': return '/dictations';
            case 'REVIEW': return '/flashcards';
            case 'SPEAKING': return '/speaking';
            default: return '/learning';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    const allCompleted = quests.length > 0 && quests.every(q => q.isCompleted);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header / Stats Summary */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/30">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                            <Trophy className="w-10 h-10 text-yellow-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black mb-1">Nhiệm Vụ Hàng Ngày</h1>
                            <p className="text-indigo-100 font-medium">Hoàn thành nhiệm vụ mỗi ngày để nhận XP và thăng cấp!</p>
                        </div>
                    </div>

                    {stats && (
                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 min-w-[120px] text-center">
                                <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Cấp độ</div>
                                <div className="text-2xl font-black text-white">{stats.level}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 min-w-[120px] text-center">
                                <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Chuỗi ngày</div>
                                <div className="text-2xl font-black text-orange-400 flex items-center justify-center gap-1">
                                    <Flame className="w-5 h-5" /> {stats.streak}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quests List */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Nhiệm vụ hôm nay</h2>
                    {allCompleted && (
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Đã hoàn thành tất cả
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quests.map(quest => {
                        const progressPercent = Math.min(100, Math.round((quest.currentProgress / quest.targetValue) * 100));
                        return (
                            <div
                                key={quest.id}
                                className={`rounded-2xl border p-5 transition-all ${quest.isCompleted
                                    ? 'bg-slate-50 border-emerald-100/50 opacity-80'
                                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${quest.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100'}`}>
                                        {quest.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : getQuestIcon(quest.questType)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-bold ${quest.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                                {quest.title}
                                            </h3>
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                                +{quest.xpReward} XP
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-3">{quest.description}</p>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-1000 ${quest.isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                style={{ width: `${progressPercent}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-semibold text-slate-500">
                                                {quest.currentProgress} / {quest.targetValue}
                                            </span>

                                            {!quest.isCompleted && (
                                                <Link
                                                    to={getQuestActionLink(quest.questType)}
                                                    className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800"
                                                >
                                                    Thực hiện <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {quests.length === 0 && (
                        <div className="col-span-full text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Swords className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 font-medium">Bạn chưa có nhiệm vụ nào hôm nay.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Quests;
