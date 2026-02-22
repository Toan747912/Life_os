import React from 'react';
import { Cpu, Info } from 'lucide-react';

const ModelSelector = ({ models, selectedModel, onSelect }) => {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Cpu size={14} /> Selected AI Engine
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {models.map((model) => {
                    const isFlash = model.id.includes('flash');
                    const isSelected = selectedModel === model.id;

                    const limits = isFlash
                        ? { rpm: 15, tpm: '1M', rpd: 1500 }
                        : { rpm: 2, tpm: '32K', rpd: 50 };

                    const health = model.health || { status: 'ok' };
                    const isError = health.status === 'error';

                    return (
                        <button
                            key={model.id}
                            onClick={() => onSelect(model.id)}
                            className={`flex flex-col p-3 rounded-xl border-2 transition-all text-left group relative ${isSelected
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-100 hover:border-slate-200 bg-white'
                                } ${isError ? 'opacity-80' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1 pr-6">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                                        {model.displayName.replace('(Fallback)', '').trim()}
                                    </span>
                                    {isSelected && !isError && (
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                                    )}
                                    {isError && (
                                        <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title={health.reason} />
                                    )}
                                </div>
                                {isError && (
                                    <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md uppercase tracking-tight">
                                        {health.reason}
                                    </span>
                                )}
                            </div>

                            <p className="text-[10px] text-slate-500 line-clamp-1 mb-2">
                                {model.description}
                            </p>

                            <div className="flex gap-2 mt-auto">
                                <LimitBadge label={`${limits.rpm} RPM`} color={isFlash ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} />
                                <LimitBadge label={`${limits.tpm} TPM`} color="bg-slate-100 text-slate-600" />
                                <LimitBadge label={`${limits.rpd} RPD`} color="bg-indigo-50 text-indigo-500" />
                            </div>

                            {/* Tooltip on Info hover */}
                            <div className="absolute top-2 right-2 group/info">
                                <Info size={14} className="text-slate-300 hover:text-indigo-400 transition-colors" />
                                <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] rounded-xl opacity-0 group-hover/info:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-2xl border border-white/10 translate-y-2 group-hover/info:translate-y-0">
                                    <p className="font-bold text-indigo-300 border-b border-white/10 pb-1.5 mb-1.5 flex items-center gap-1.5">
                                        <Info size={10} /> AI Usage Limits Explained
                                    </p>
                                    <ul className="space-y-1.5 text-slate-300">
                                        <li className="flex gap-1.5">
                                            <b className="text-white shrink-0">RPM:</b>
                                            <span>Requests Per Minute (Số yêu cầu tối đa/phút)</span>
                                        </li>
                                        <li className="flex gap-1.5">
                                            <b className="text-white shrink-0">TPM:</b>
                                            <span>Tokens Per Minute (Khối lượng văn bản/phút)</span>
                                        </li>
                                        <li className="flex gap-1.5">
                                            <b className="text-white shrink-0">RPD:</b>
                                            <span>Requests Per Day (Tổng yêu cầu/ngày)</span>
                                        </li>
                                    </ul>
                                    <div className="absolute top-full right-2 border-8 border-transparent border-t-slate-900/95" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const LimitBadge = ({ label, color }) => (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${color}`}>
        {label}
    </span>
);

export default ModelSelector;
