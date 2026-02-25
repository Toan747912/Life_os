import React, { useState, useEffect } from 'react';
import TaskList from '../components/tasks/TaskList';
import api from '../services/api';
import {
    Sparkles, Target, Zap, Play, Pause, RotateCcw,
    Send, Loader2, Youtube, Type, PenTool, Flame, Calendar, UploadCloud
} from 'lucide-react';
import WritingPractice from '../components/WritingPractice';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    // --- State cho Focus Timer ---
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isTimerActive, setIsTimerActive] = useState(false);

    // --- State cho AI Input ---
    const [inputType, setInputType] = useState('TEXT');
    const [inputValue, setInputValue] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [dueCount, setDueCount] = useState(0);
    const [dueItems, setDueItems] = useState([]);

    // --- State cho Habit Tracking ---
    const [userStats, setUserStats] = useState({ currentStreak: 0, longestStreak: 0, totalLearned: 0 });
    const [dailyQuests, setDailyQuests] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
    const [insights, setInsights] = useState(null);

    useEffect(() => {
        fetchDueCount();
        fetchHabitData();
    }, []);

    const fetchHabitData = async () => {
        try {
            const [streakRes, questsRes, heatmapRes] = await Promise.all([
                api.get('/activity/streak'),
                api.get('/activity/quests'),
                api.get('/activity/heatmap'),
            ]);

            // Note: insights was mocked, we will leave it as null or handle it later

            setUserStats({
                currentStreak: streakRes.data.currentStreak,
                longestStreak: streakRes.data.longestStreak,
                totalLearned: 0 // Mocked for now, need another API to count items
            });
            setDailyQuests({
                addVocab: questsRes.data.find(q => q.id === 1) || { current: 0, target: 10 },
                studySession: questsRes.data.find(q => q.id === 2) || { current: 0, target: 3 }
            });
            setHeatmapData(heatmapRes.data || []);
            setInsights(null); // Clear insights since no API yet
        } catch (error) {
            console.error("Error fetching habit data:", error);
        }
    };

    const fetchDueCount = async () => {
        try {
            const response = await api.get('/learning/today-reviews');
            setDueItems(response.data.data);
            setDueCount(response.data.data.length);
        } catch (error) {
            console.error("Error fetching due count:", error);
        }
    };

    // Lấy tối đa 5 từ vựng đến hạn để gợi ý viết bài
    const writingTargetWords = dueItems.slice(0, 5).map(item => item.item.term);

    // Logic đồng hồ đếm ngược
    useEffect(() => {
        let interval = null;
        if (isTimerActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0) {
            setIsTimerActive(false);
            alert("Hết giờ tập trung!");
            // Gọi API log hoạt động Focus Timer
            api.post('/learning/analyze', { type: 'FOCUS', content: 'Completed 25m Focus Session' })
                .catch(e => console.error("Could not log focus session")); // Tạm mượn API analyze hoặc tạo API riếng
        }
        return () => clearInterval(interval);
    }, [isTimerActive, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Logic gọi AI phân tích
    const handleAnalyze = async () => {
        if (inputType === 'MEDIA') {
            if (!selectedFile) {
                alert("Vui lòng chọn một file âm thanh hoặc video!");
                return;
            }
            setLoadingAI(true);
            try {
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('type', 'MEDIA');
                formData.append('title', `Media Insight - ${new Date().toLocaleDateString()}`);

                // Gửi file bằng endpoint upload với header đúng
                await api.post('/learning/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                setSelectedFile(null);
                alert("✅ AI đã tiếp nhận file và bắt đầu phân tích! Vui lòng đợi trong giây lát hoặc kiểm tra Library sau.");
                window.location.reload();
            } catch (error) {
                alert("Lỗi upload file: " + (error.response?.data?.error || error.message));
            } finally {
                setLoadingAI(false);
            }
        } else {
            if (!inputValue.trim()) return;
            setLoadingAI(true);
            try {
                await api.post('/learning/analyze', {
                    type: inputType,
                    content: inputValue,
                    title: `${inputType} Insight - ${new Date().toLocaleDateString()}`
                });
                // activityService.log('ADD_VOCAB').catch(e => console.error(e));

                setInputValue('');
                alert("✅ AI đã phân tích xong và thêm từ vựng mới!");
                window.location.reload(); // Reload trang để hiện task mới
            } catch (error) {
                alert("Lỗi AI: " + (error.response?.data?.error || error.message));
            } finally {
                setLoadingAI(false);
            }
        }
    };

    const navigate = (path) => {
        window.location.href = path; // Đơn giản hóa vì Dashboard không wrap bằng Link
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your Daily Overview</h1>
                    <p className="mt-2 text-slate-600">Focus on what matters today.</p>
                </div>
                {dueCount > 0 && (
                    <div className="animate-bounce">
                        <button
                            onClick={() => navigate('/study')}
                            className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-bold border border-amber-200 shadow-sm flex items-center gap-2"
                        >
                            <Sparkles size={16} /> {dueCount} items to review!
                        </button>
                    </div>
                )}
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={Flame}
                    label="Current Streak"
                    value={`${userStats.currentStreak} Days`}
                    color="text-orange-500"
                    bgColor="bg-orange-50"
                />
                <StatCard
                    icon={Target}
                    label="Longest Streak"
                    value={`${userStats.longestStreak} Days`}
                    color="text-emerald-500"
                    bgColor="bg-emerald-50"
                />
                <StatCard
                    icon={Sparkles}
                    label="Total Learned"
                    value={`${userStats.totalLearned} Items`}
                    color="text-indigo-500"
                    bgColor="bg-indigo-50"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Cột chính bên trái */}
                <div className="xl:col-span-2 space-y-6">

                    {/* --- Study Today Section --- */}
                    {dueCount > 0 && (
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-lg shadow-indigo-200 text-white relative overflow-hidden group">
                            <div className="relative z-10">
                                <h2 className="text-xl font-bold mb-2">Ready for your daily review?</h2>
                                <p className="text-indigo-100 mb-6 text-sm">You have {dueCount} items waiting to be mastered. Consistency is key!</p>
                                <button
                                    onClick={() => navigate('/study')}
                                    className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg transition-all transform group-hover:scale-105"
                                >
                                    Start Session Now
                                </button>
                            </div>
                            <Sparkles className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 rotate-12" />
                        </div>
                    )}

                    {/* --- Activity Heatmap --- */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Calendar size={20} className="text-indigo-500" /> Learning Activity
                        </h2>
                        <div className="w-full overflow-x-auto pb-4">
                            <ActivityHeatmap data={heatmapData} />
                        </div>
                    </div>

                    {/* --- Advanced Insights --- */}
                    {insights && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            {/* Weakest Words */}
                            <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Target size={20} className="text-rose-500" /> Needs Review (Weakest Points)
                                </h2>
                                <div className="space-y-3">
                                    {insights.weakestWords.length > 0 ? insights.weakestWords.map((word, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-rose-50 rounded-xl">
                                            <div>
                                                <p className="font-bold text-slate-800">{word.term}</p>
                                                <p className="text-sm text-slate-500">{word.translation}</p>
                                            </div>
                                            <div className="text-xs font-bold text-rose-600 bg-rose-200 px-2 py-1 rounded-md">
                                                Lvl {word.proficiency}
                                            </div>
                                        </div>
                                    )) : <p className="text-sm text-slate-500">You don't have any weak words yet! Great job.</p>}
                                </div>
                            </div>

                            {/* Learning Trend (Simple CSS Chart) */}
                            <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Sparkles size={20} className="text-indigo-500" /> Learning Trend (Last 14 Days)
                                </h2>
                                <div className="flex items-end gap-2 h-40 mt-4 rounded-xl p-4 bg-slate-50">
                                    {insights.wordsLearnedPerDay.length > 0 ? insights.wordsLearnedPerDay.slice(-14).map((day, idx) => {
                                        const maxCount = Math.max(...insights.wordsLearnedPerDay.map(d => d.count), 1);
                                        const heightPercent = (day.count / maxCount) * 100;
                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-2 group relative h-full">
                                                <div
                                                    className="w-full bg-indigo-500 rounded-t-md transition-all group-hover:bg-indigo-400 relative"
                                                    style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                                                >
                                                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                                                        {day.count}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {day.date.split('-')[2]}/{day.date.split('-')[1]}
                                                </span>
                                            </div>
                                        );
                                    }) : <p className="text-sm text-slate-500 w-full text-center my-auto">No data to display yet.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- 1. KHU VỰC NHẬP LIỆU AI --- */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                Add New Knowledge
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {/* Tabs chọn loại Text/YouTube */}
                            <div className="flex gap-2 border-b border-slate-100 pb-2">
                                <button
                                    onClick={() => setInputType('TEXT')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                        ${inputType === 'TEXT' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}
                                    `}
                                >
                                    <Type size={16} /> Text
                                </button>
                                <button
                                    onClick={() => setInputType('YOUTUBE')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                        ${inputType === 'YOUTUBE' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:text-slate-700'}
                                    `}
                                >
                                    <Youtube size={16} /> YouTube
                                </button>
                                <button
                                    onClick={() => { setInputType('MEDIA'); setInputValue(''); }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                        ${inputType === 'MEDIA' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-slate-700'}
                                    `}
                                >
                                    <UploadCloud size={16} /> Upload Audio/Video
                                </button>
                            </div>

                            {/* Ô nhập liệu / Upload */}
                            <div className="relative">
                                {inputType === 'MEDIA' ? (
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="file"
                                            accept="audio/*, video/*"
                                            onChange={(e) => setSelectedFile(e.target.files[0])}
                                            disabled={loadingAI}
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all border border-slate-200 rounded-xl bg-slate-50 p-2 focus:outline-none"
                                        />
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={loadingAI || !selectedFile}
                                            className="p-3 whitespace-nowrap bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                                        >
                                            {loadingAI ? <Loader2 size={18} className="animate-spin" /> : <><UploadCloud size={18} /> Upload & Analyze</>}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                            placeholder={inputType === 'YOUTUBE' ? "Dán link video YouTube vào đây..." : "Nhập nội dung bạn muốn học..."}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                                            disabled={loadingAI}
                                        />
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={loadingAI || !inputValue}
                                            className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                        >
                                            {loadingAI ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* HẾT KHU VỰC NHẬP LIỆU */}

                    {/* Writing Practice Section */}
                    <div className="mt-8">
                        <WritingPractice targetWords={writingTargetWords} />
                    </div>

                    {/* Danh sách Task */}
                    <div className="mt-8">
                        <TaskList />
                    </div>
                </div>

                {/* Cột phải: Sidebar (Daily Quests & Focus Timer) */}
                <div className="space-y-6">
                    {/* Daily Quests */}
                    {dailyQuests && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Target size={20} className="text-indigo-500" /> Daily Quests
                            </h2>
                            <div className="space-y-4">
                                <QuestItem
                                    title="Tạo 1 tài liệu mới"
                                    current={dailyQuests.addVocab.current}
                                    target={dailyQuests.addVocab.target}
                                />
                                <QuestItem
                                    title="Ôn tập 10 từ vựng"
                                    current={dailyQuests.studySession.current}
                                    target={dailyQuests.studySession.target}
                                />
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Focus Timer</h2>
                        <div className="text-5xl font-mono text-center py-10 text-indigo-600 bg-slate-50 rounded-2xl mb-6">
                            {formatTime(timeLeft)}
                        </div>
                        <button
                            onClick={() => setIsTimerActive(!isTimerActive)}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition mb-3"
                        >
                            {isTimerActive ? "Pause Focus Session" : "Start Focus Session"}
                        </button>
                        <button
                            onClick={() => { setIsTimerActive(false); setTimeLeft(25 * 60); }}
                            className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                        >
                            Reset Timer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Component StatCard giữ nguyên
const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className={`${bgColor} ${color} p-3 rounded-xl flex items-center justify-center w-12 h-12`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
    </div>
);

const QuestItem = ({ title, current, target }) => {
    const isCompleted = current >= target;
    const progressPerc = Math.min((current / target) * 100, 100);

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {title}
                </span>
                <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {current}/{target}
                </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${progressPerc}%` }}
                />
            </div>
        </div>
    );
};

// Component Heatmap (Tự build bằng Tailwind)
const ActivityHeatmap = ({ data }) => {
    // Generate dates for the last 150 days (approx 21 weeks)
    const renderBoxes = () => {
        const boxes = [];
        const today = new Date();
        const daysToRender = 150;

        for (let i = daysToRender - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            // Tìm data của ngày này
            const dayData = data.find(item => item.date === dateStr);
            const count = dayData ? dayData.count : 0;

            // Set màu dựa trên cường độ
            let bgClass = "bg-slate-100"; // 0
            if (count > 0 && count <= 2) bgClass = "bg-emerald-200";
            if (count > 2 && count <= 5) bgClass = "bg-emerald-400";
            if (count > 5 && count <= 10) bgClass = "bg-emerald-500";
            if (count > 10) bgClass = "bg-emerald-600";

            boxes.push(
                <div
                    key={i}
                    title={`${dateStr}: ${count} actions`}
                    className={`w-3.5 h-3.5 rounded-sm ${bgClass} transition-colors hover:ring-2 hover:ring-offset-1 hover:ring-emerald-400 cursor-pointer`}
                />
            );
        }
        return boxes;
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1 md:gap-1.5 w-full mx-auto" style={{
                display: 'grid',
                gridTemplateRows: 'repeat(7, 1fr)',
                gridAutoFlow: 'column',
                gridAutoColumns: 'max-content'
            }}>
                {renderBoxes()}
            </div>
            <div className="flex items-center justify-end gap-2 text-xs text-slate-500 mt-2">
                <span>Less</span>
                <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
                <div className="w-3 h-3 bg-emerald-200 rounded-sm"></div>
                <div className="w-3 h-3 bg-emerald-400 rounded-sm"></div>
                <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                <div className="w-3 h-3 bg-emerald-600 rounded-sm"></div>
                <span>More</span>
            </div>
        </div>
    );
};

export default Dashboard;