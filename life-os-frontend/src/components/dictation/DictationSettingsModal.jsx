import React, { useState, useEffect } from 'react';

const DictationSettingsModal = ({ settings, setSettings, onClose }) => {
    const [voices, setVoices] = useState([]);

    useEffect(() => {
        const loadVoices = () => {
            if ('speechSynthesis' in window) {
                let availableVoices = window.speechSynthesis.getVoices();
                // If Chrome/Safari haven't loaded them yet
                if (availableVoices.length === 0) {
                    window.speechSynthesis.onvoiceschanged = () => {
                        availableVoices = window.speechSynthesis.getVoices();
                        setVoices(availableVoices.filter(v => v.lang.startsWith('en')));
                    };
                } else {
                    setVoices(availableVoices.filter(v => v.lang.startsWith('en')));
                }
            }
        };
        loadVoices();
    }, []);

    const handleChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <div className="glass-panel rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200/60 bg-white/50 backdrop-blur-md">
                    <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-600 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/0000.svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#settings-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><defs><linearGradient id="settings-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#4338ca" /><stop offset="100%" stopColor="#7c3aed" /></linearGradient></defs><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                        Cài đặt (Settings)
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/0000.svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-white/40">

                    {/* Replay Key */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="font-bold text-slate-800">Phím tắt Nghe lại</p>
                            <p className="text-sm font-medium text-slate-500 truncate mt-0.5">Phím + Space để phát lại</p>
                        </div>
                        <div className="relative">
                            <select
                                value={settings.replayKey}
                                onChange={(e) => handleChange('replayKey', e.target.value)}
                                className="pl-4 pr-9 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-slate-700 outline-none appearance-none cursor-pointer shadow-sm text-sm"
                            >
                                <option value="Ctrl">Ctrl</option>
                                <option value="Shift">Shift</option>
                                <option value="Alt">Alt</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Auto Replay */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="font-bold text-slate-800">Tự động lặp lại</p>
                            <p className="text-sm font-medium text-slate-500 truncate mt-0.5">Số lần lặp sau khi chạy hết câu</p>
                        </div>
                        <div className="relative">
                            <select
                                value={settings.autoReplay}
                                onChange={(e) => handleChange('autoReplay', e.target.value)}
                                className="pl-4 pr-9 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-slate-700 outline-none appearance-none cursor-pointer shadow-sm text-sm"
                            >
                                <option value="0">Không lặp</option>
                                <option value="1">1 lần</option>
                                <option value="2">2 lần</option>
                                <option value="3">3 lần</option>
                                <option value="5">5 lần</option>
                                <option value="Infinity">Vô hạn</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Time between replays */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="font-bold text-slate-800">Thời gian chờ</p>
                            <p className="text-sm font-medium text-slate-500 truncate mt-0.5">Khoảng nghỉ giữa các lần lặp</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 bg-white border border-slate-200 rounded-xl p-1 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={settings.replayDelay}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        handleChange('replayDelay', '');
                                    } else {
                                        const parsed = parseFloat(val);
                                        if (!isNaN(parsed) && parsed >= 0) {
                                            handleChange('replayDelay', val);
                                        }
                                    }
                                }}
                                className="w-16 py-1 px-2 text-center outline-none font-bold text-slate-700 bg-transparent text-sm"
                            />
                            <span className="text-slate-400 font-bold text-sm pr-2">giây</span>
                        </div>
                    </div>

                    {/* Always show Original */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="font-bold text-slate-800">Luôn hiện Transcript</p>
                            <p className="text-sm font-medium text-slate-500 truncate mt-0.5">Tự động mở khi load câu hỏi</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.alwaysShowOriginal}
                                onChange={(e) => handleChange('alwaysShowOriginal', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 transition-colors shadow-inner"></div>
                        </label>
                    </div>

                    {/* Always show Hint */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="font-bold text-slate-800">Luôn hiện Gợi ý</p>
                            <p className="text-sm font-medium text-slate-500 truncate mt-0.5">Hiển thị dạng _ _ _ ngay từ đầu</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.alwaysShowHint}
                                onChange={(e) => handleChange('alwaysShowHint', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 transition-colors shadow-inner"></div>
                        </label>
                    </div>

                    {/* Continuous Playback */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="font-bold text-slate-800">Chạy liên tục các câu</p>
                            <p className="text-sm font-medium text-slate-500 truncate mt-0.5">Tự động chuyển câu tiếp theo</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.continuousPlayback}
                                onChange={(e) => handleChange('continuousPlayback', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 transition-colors shadow-inner"></div>
                        </label>
                    </div>

                    {/* Continuous Delay */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="font-bold text-slate-800 truncate">Khoảng nghỉ phát liên tục</p>
                            <p className="text-sm font-medium text-slate-500 truncate mt-0.5">Thời gian nghỉ giữa các câu</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 bg-white border border-slate-200 rounded-xl p-1 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={settings.continuousDelay !== undefined ? settings.continuousDelay : 2.0}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        handleChange('continuousDelay', '');
                                    } else {
                                        const parsed = parseFloat(val);
                                        if (!isNaN(parsed) && parsed >= 0) {
                                            handleChange('continuousDelay', val);
                                        }
                                    }
                                }}
                                className="w-16 py-1 px-2 text-center outline-none font-bold text-slate-700 bg-transparent text-sm"
                            />
                            <span className="text-slate-400 font-bold text-sm pr-2">giây</span>
                        </div>
                    </div>

                    {/* TTS Voice */}
                    <div className="flex flex-col gap-3 border-b border-slate-200/50 pb-5">
                        <div>
                            <p className="font-bold text-slate-800">Giọng đọc mẫu (AI)</p>
                            <p className="text-sm font-medium text-slate-500 mt-0.5">Giọng phát âm hệ thống</p>
                        </div>
                        <div className="relative">
                            <select
                                value={settings.ttsVoiceURI || ''}
                                onChange={(e) => handleChange('ttsVoiceURI', e.target.value)}
                                className="w-full pl-4 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-slate-700 outline-none appearance-none cursor-pointer shadow-sm text-sm"
                            >
                                <option value="">(Mặc định)</option>
                                {voices.map((voice, idx) => (
                                    <option key={idx} value={voice.voiceURI}>
                                        {voice.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* TTS Speed */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="font-bold text-slate-800">Tốc độ đọc mẫu</p>
                            <p className="text-sm font-medium text-slate-500 truncate mt-0.5">Chỉnh tốc độ giọng AI</p>
                        </div>
                        <div className="relative">
                            <select
                                value={settings.ttsSpeed || 1}
                                onChange={(e) => handleChange('ttsSpeed', parseFloat(e.target.value))}
                                className="pl-4 pr-9 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-slate-700 outline-none appearance-none cursor-pointer shadow-sm text-sm"
                            >
                                <option value="0.5">0.5x (Rất chậm)</option>
                                <option value="0.75">0.75x (Chậm)</option>
                                <option value="1">1.0x (Bình thường)</option>
                                <option value="1.25">1.25x (Nhanh)</option>
                                <option value="1.5">1.5x (Rất nhanh)</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Strict Highlight Toggle */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="font-bold text-slate-800">Soi lỗi phát âm chi tiết</p>
                            <p className="text-sm font-medium text-slate-500 truncate mt-0.5">Tô màu từng chữ cái đọc sai (Shadowing)</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.strictPronunciation !== undefined ? settings.strictPronunciation : true}
                                onChange={(e) => handleChange('strictPronunciation', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 transition-colors shadow-inner"></div>
                        </label>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-200/60 bg-white/50 backdrop-blur-md flex justify-end">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all text-base shadow-md"
                    >
                        Xong
                    </button>
                </div>

            </div>
        </div>
    );
};

export default DictationSettingsModal;
