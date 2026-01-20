import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause } from 'lucide-react';

const PomodoroTimer = ({ durationMinutes = 25, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (onComplete) onComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, onComplete]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/20 text-center transition-all shadow-sm">
            <div className="flex items-center justify-center gap-2 text-red-800 dark:text-red-400 font-bold mb-4">
                <Timer size={20} />
                <h3 className="text-lg">Pomodoro Focus</h3>
            </div>

            <div className="text-6xl font-mono text-red-600 dark:text-red-400 mb-6 font-bold tracking-wider">
                {formatTime(timeLeft)}
            </div>

            <button
                onClick={() => setIsActive(!isActive)}
                className={`
          flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-lg transition-all mx-auto
          ${isActive
                        ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-linear-to-r from-red-500 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5'}
        `}
            >
                {isActive ? <><Pause size={20} /> Tạm dừng</> : <><Play size={20} /> Bắt đầu</>}
            </button>
        </div>
    );
};

export default PomodoroTimer;
