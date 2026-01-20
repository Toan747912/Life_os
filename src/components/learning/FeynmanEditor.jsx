import React, { useState } from 'react';
import { Brain } from 'lucide-react';

const FeynmanEditor = ({ topic }) => {
    const [text, setText] = useState("");

    return (
        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20 transition-all shadow-sm">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400 font-bold mb-4">
                <Brain size={20} />
                <h3 className="text-lg">Feynman Technique</h3>
            </div>

            <p className="text-sm text-blue-600 dark:text-blue-300 mb-4 bg-blue-100/50 dark:bg-blue-900/20 p-3 rounded-lg">
                Hãy giải thích <strong>{topic}</strong> bằng ngôn ngữ đơn giản nhất (như đang dạy một đứa trẻ 5 tuổi):
            </p>

            <textarea
                className="w-full h-40 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950/30 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-blue-100 placeholder-blue-300/50 resize-none transition-all text-base leading-relaxed"
                placeholder="Bắt đầu diễn giải kiến thức tại đây..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
        </div>
    );
};

export default FeynmanEditor;
