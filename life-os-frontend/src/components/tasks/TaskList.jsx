import React, { useEffect, useState } from 'react';
import TaskItem from './TaskItem';
import taskService from '../../services/taskService';
import { Loader2, RefreshCw } from 'lucide-react';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Hardcoded for now until auth is ready
    const userId = 1;

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const result = await taskService.getDailyTasks(userId);
            setTasks(result.data || []);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
            setError("Unable to load tasks. Ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleToggle = async (taskId) => {
        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
        ));

        try {
            await taskService.toggleTask(taskId, userId);
        } catch (err) {
            console.error("Toggle failed:", err);
            // Rollback on error
            setTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
            ));
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Today's Habits & Tasks</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {tasks.filter(t => t.isCompleted).length}/{tasks.length} completed
                    </p>
                </div>
                <button
                    onClick={fetchTasks}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                    title="Refresh"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="p-6">
                {loading && tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p className="font-medium">Loading your tasks...</p>
                    </div>
                ) : error ? (
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-center">
                        {error}
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="font-medium">No tasks for today. Take a break!</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {tasks.map(task => (
                            <TaskItem key={task.id} task={task} onToggle={handleToggle} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskList;
