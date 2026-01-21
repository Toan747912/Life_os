import React, { useState } from 'react';
import { Zap, RotateCw } from 'lucide-react';

const FlashcardView = ({ question, answer }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-100 dark:border-green-900/20 text-center transition-all shadow-sm">
            <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-400 font-bold mb-4">
                <Zap size={20} />
                <h3 className="text-lg">Active Recall</h3>
            </div>

            <div
                className={`
          relative bg-white dark:bg-green-950/30 p-10 rounded-2xl shadow-sm border border-green-100 dark:border-green-900/30 
          cursor-pointer min-h-[200px] flex items-center justify-center group transition-all duration-300 perspective-1000
          ${isFlipped ? 'ring-2 ring-green-400 bg-green-50/50' : 'hover:scale-[1.02] hover:shadow-green-200/50'}
        `}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <p className="text-2xl font-medium text-gray-800 dark:text-green-100 px-4 leading-normal">
                    {isFlipped ? answer : question}
                </p>

                <div className="absolute bottom-4 right-4 text-green-300 dark:text-green-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <RotateCw size={20} />
                </div>
            </div>

            <p className="text-xs text-green-600 dark:text-green-500 mt-4 font-medium uppercase tracking-wide opacity-70">
                (Nhấn vào thẻ để lật)
            </p>
        </div>
    );
};

export default FlashcardView;











