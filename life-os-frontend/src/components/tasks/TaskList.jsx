import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Đường dẫn tới file cấu hình axios
import { CheckCircle2, Circle, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TaskList = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch tasks khi component load
    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const date = new Date().toISOString();
            const res = await api.get(`/tasks?date=${date}`);
            setTasks(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = async (taskId) => {
        // Optimistic UI Update (Cập nhật giao diện ngay lập tức)
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, status: t.status === 'DONE' ? 'TODO' : 'DONE' } : t
        ));

        // Gọi API cập nhật ngầm
        try {
            await api.patch(`/tasks/${taskId}/toggle`);
        } catch (error) {
            console.error("Error toggling task", error);
            fetchTasks(); // Revert nếu lỗi
        }
    };

    if (loading) return <div className="py-10 text-center text-slate-400">Loading tasks...</div>;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-lg text-slate-900">Today's Tasks</h3>
                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                    {tasks.filter(t => t.status === 'DONE').length}/{tasks.length} Completed
                </span>
            </div>

            <div className="divide-y divide-slate-50">
                {tasks.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No tasks for today. Add something using AI!
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div
                            key={task.id}
                            className={`group p-4 flex items-start gap-4 transition-all hover:bg-slate-50/50
                                ${task.status === 'DONE' ? 'opacity-50' : ''}
                            `}
                        >
                            <button
                                onClick={() => toggleTask(task.id)}
                                className={`mt-1 transition-colors ${task.status === 'DONE' ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}
                            >
                                {task.status === 'DONE' ? <CheckCircle2 size={24} weight="fill" /> : <Circle size={24} />}
                            </button>

                            <div className="flex-1">
                                <p className={`font-medium text-base ${task.status === 'DONE' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                    {task.title}
                                </p>
                                {task.description && (
                                    <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                                )}
                                <div className="flex gap-2 mt-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border 
                                        ${task.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-200'}
                                    `}>
                                        {task.priority}
                                    </span>
                                    {task.resource && (
                                        <span className="text-[10px] flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                            Resource
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {tasks.length > 0 && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1 mx-auto">
                        View All Tasks <ArrowRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default TaskList;