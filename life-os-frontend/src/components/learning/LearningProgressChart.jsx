import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Trophy } from 'lucide-react';

const COLORS = ['#10b981', '#f3f4f6']; // Emerald for learned, Gray for remaining

const LearningProgressChart = ({ learnedCount = 0, totalCount = 100 }) => {
    const remainingCount = Math.max(0, totalCount - learnedCount);

    const data = [
        { name: 'Đã thuộc', value: learnedCount },
        { name: 'Chưa học', value: remainingCount },
    ];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4 w-full justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-gray-800">Tiến độ Magic Vocab</h3>
            </div>

            <div className="w-full h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            animationBegin={0}
                            animationDuration={1500}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => [`${value} từ`, 'Số lượng']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-gray-800">{learnedCount}</span>
                    <span className="text-xs text-gray-500 font-medium">Từ</span>
                </div>
            </div>

            <div className="flex gap-4 mt-2 text-sm justify-center w-full">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-gray-600 font-medium">Đã thuộc ({learnedCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                    <span className="text-gray-500 font-medium">Tổng ({totalCount})</span>
                </div>
            </div>
        </div>
    );
};

export default LearningProgressChart;
