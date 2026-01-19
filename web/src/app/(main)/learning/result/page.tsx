"use client";

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ResultContent() {
    const params = useSearchParams();
    const router = useRouter();
    const score = parseInt(params.get('score') || '0');
    const total = parseInt(params.get('total') || '1');

    const percentage = Math.round((score / total) * 100);

    let message = "Keep Practicing!";
    let colorClass = "text-red-500";

    if (percentage >= 80) {
        message = "Excellent Job!";
        colorClass = "text-green-500";
    } else if (percentage >= 50) {
        message = "Good Effort!";
        colorClass = "text-orange-500";
    }

    return (
        <div className="max-w-md mx-auto p-6 text-center pt-20">
            <h1 className="text-3xl font-bold text-slate-800 mb-8">Session Complete</h1>

            <div className="relative inline-flex justify-center items-center mb-10">
                <svg className="w-48 h-48 transform -rotate-90">
                    <circle
                        className="text-slate-200"
                        strokeWidth="12"
                        stroke="currentColor"
                        fill="transparent"
                        r="70"
                        cx="96"
                        cy="96"
                    />
                    <circle
                        className={colorClass}
                        strokeWidth="12"
                        strokeDasharray={440}
                        strokeDashoffset={440 - (440 * percentage) / 100}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="70"
                        cx="96"
                        cy="96"
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-bold text-slate-800">{score}</span>
                    <span className="text-slate-400 text-sm uppercase font-bold tracking-wider">of {total}</span>
                </div>
            </div>

            <h2 className={`text-2xl font-bold mb-8 ${colorClass}`}>{message}</h2>

            <div className="space-y-3">
                <button
                    onClick={() => router.push('/memorizer')}
                    className="w-full py-3 px-6 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition"
                >
                    Back to Memorizer
                </button>
                <button
                    onClick={() => router.push('/activities')}
                    className="w-full py-3 px-6 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
}

export default function ResultPage() {
    return (
        <Suspense fallback={<div>Loading Result...</div>}>
            <ResultContent />
        </Suspense>
    );
}
