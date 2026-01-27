import React, { useState } from 'react';
import { Lightbulb, MessageSquare, Loader2 } from 'lucide-react';

export const SocraticReview = ({ content, apiUrl }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleReview = async () => {
        if (!content || content.trim().length < 10) return alert("Write a bit more before reviewing!");
        setLoading(true);
        setIsOpen(true);
        try {
            const res = await fetch(`${apiUrl}/ai/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            const data = await res.json();
            if (data.questions) setQuestions(data.questions);
        } catch (e) {
            console.error(e);
            setQuestions(["AI is currently unavailable. Please try again later."]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen && questions.length === 0) {
        return (
            <button
                onClick={handleReview}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-bold hover:bg-indigo-200 transition-all text-sm"
            >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                Review with AI
            </button>
        );
    }

    return (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 mt-4 animate-fade-in">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                    <UserIcon /> Socratic Tutor
                </h3>
                <button
                    onClick={() => { setIsOpen(false); setQuestions([]); }}
                    className="text-indigo-400 hover:text-indigo-600 text-xs font-bold"
                >
                    Close
                </button>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-indigo-600 text-sm py-4">
                    <Loader2 className="animate-spin w-4 h-4" /> Thinking...
                </div>
            ) : (
                <div className="space-y-3">
                    {questions.map((q, i) => (
                        <div key={i} className="flex gap-3 text-indigo-800 text-sm bg-white p-3 rounded-xl shadow-sm">
                            <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                            <p>{q}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);
