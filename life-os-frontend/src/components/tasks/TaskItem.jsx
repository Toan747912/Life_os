import React from 'react';
import { Check, Circle } from 'lucide-react';
import { clsx } from 'clsx';

const TaskItem = ({ task, onToggle }) => {
    return (
        <div
            className={clsx(
                "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer",
                task.isCompleted
                    ? "bg-slate-50 border-slate-100 opacity-75"
                    : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md"
            )}
            onClick={() => onToggle(task.id)}
        >
            <button
                className={clsx(
                    "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    task.isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-slate-300 group-hover:border-indigo-400"
                )}
            >
                {task.isCompleted && <Check size={14} strokeWidth={3} />}
            </button>

            <div className="flex-1 min-w-0">
                <h3 className={clsx(
                    "font-semibold truncate",
                    task.isCompleted ? "text-slate-500 line-through" : "text-slate-900"
                )}>
                    {task.title}
                </h3>
                {task.description && (
                    <p className="text-sm text-slate-500 truncate">{task.description}</p>
                )}
            </div>

            <div className="flex items-center gap-2">
                <span className={clsx(
                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                    task.priority === 'HIGH' ? "bg-rose-100 text-rose-600" :
                        task.priority === 'MEDIUM' ? "bg-amber-100 text-amber-600" :
                            "bg-indigo-100 text-indigo-600"
                )}>
                    {task.priority || 'LOW'}
                </span>
            </div>
        </div>
    );
};

export default TaskItem;
