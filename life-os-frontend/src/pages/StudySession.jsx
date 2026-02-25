import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Flashcard from '../components/learning/Flashcard';
import api, { activityService } from '../services/api';
import { Loader2, ArrowLeft, CheckCircle2, Trophy } from 'lucide-react';

const StudySession = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [results, setResults] = useState({ remembered: 0, forgot: 0 });
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        fetchDueItems();
    }, []);

    const fetchDueItems = async () => {
        try {
            const response = await api.get('/learning/today-reviews');
            setItems(response.data.data);
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResult = async (result) => {
        const currentItem = items[currentIndex];

        try {
            await api.patch(`/learning/items/${currentItem.id}/review`, { result });
            activityService.log('REVIEW_FLASHCARD').catch(e => console.error("Log error", e));

            setResults(prev => ({
                ...prev,
                [result]: prev[result] + 1
            }));

            if (currentIndex < items.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setCompleted(true);
            }
        } catch (error) {
            console.error("Error updating progress:", error);
            alert("Failed to save progress. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                <p className="text-slate-600 font-medium">Preparing your session...</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full mb-6">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">You're all caught up!</h2>
                <p className="text-slate-600 mb-8 max-w-sm">No items due for review today. Keep adding new knowledge to stay sharp!</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="max-w-md mx-auto py-12 text-center">
                <div className="inline-block bg-amber-100 text-amber-600 p-4 rounded-full mb-6">
                    <Trophy size={48} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Session Complete!</h2>
                <p className="text-slate-600 mb-8">Great job staying consistent with your learning.</p>

                <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <p className="text-emerald-600 font-bold text-3xl">{results.remembered}</p>
                        <p className="text-emerald-700 text-sm font-medium">Remembered</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                        <p className="text-red-600 font-bold text-3xl">{results.forgot}</p>
                        <p className="text-red-700 text-sm font-medium">To Review Again</p>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                >
                    Finish Session
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <header className="flex items-center justify-between mb-12">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 text-slate-400 hover:text-slate-600 transition"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 px-8">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
                        />
                    </div>
                </div>
                <span className="text-sm font-bold text-slate-400">
                    {currentIndex + 1} / {items.length}
                </span>
            </header>

            <main className="mb-12">
                <h1 className="text-center text-slate-500 text-sm font-bold uppercase tracking-widest mb-8">
                    Reviewing from: <span className="text-slate-900">{items[currentIndex].item.resource?.title || "Quick Add"}</span>
                </h1>

                <Flashcard
                    key={items[currentIndex].id}
                    item={items[currentIndex].item}
                    onResult={handleResult}
                />
            </main>
        </div>
    );
};

export default StudySession;
