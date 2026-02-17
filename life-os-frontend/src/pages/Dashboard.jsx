import React from 'react';
import TaskList from '../components/tasks/TaskList';
import { Sparkles, Target, Zap } from 'lucide-react';

const Dashboard = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your Daily Overview</h1>
                <p className="mt-2 text-slate-600">Focus on what matters today.</p>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={Zap}
                    label="Energy Level"
                    value="High"
                    color="text-amber-500"
                    bgColor="bg-amber-50"
                />
                <StatCard
                    icon={Target}
                    label="Current Goal"
                    value="Web Mastery"
                    color="text-emerald-500"
                    bgColor="bg-emerald-50"
                />
                <StatCard
                    icon={Sparkles}
                    label="AITip"
                    value="Start with tasks"
                    color="text-indigo-500"
                    bgColor="bg-indigo-50"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    <TaskList />
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Focus Timer</h2>
                        <div className="text-4xl font-mono text-center py-8 text-indigo-600 bg-slate-50 rounded-xl mb-4">
                            25:00
                        </div>
                        <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
                            Start Focus Session
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className={`${bgColor} ${color} p-3 rounded-xl`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
    </div>
);

export default Dashboard;
