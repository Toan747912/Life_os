import React, { useState, useEffect, useRef } from 'react';

// --- 1. CORE UTILS & PERSISTENCE ---

const loadStorage = (key, def) => {
    if (typeof window !== 'undefined') {
        const s = localStorage.getItem(key);
        return s ? JSON.parse(s) : def;
    }
    return def;
};

// --- 2. SPECIALIZED COMPONENTS (ADAPTIVE UI) ---

// Component: Đồng hồ đếm ngược áp lực cao (Cho chế độ thi)
const ExamTimer = ({ duration, onTimeUp }) => {
    const [left, setLeft] = useState(duration * 60);

    useEffect(() => {
        if (left <= 0) { onTimeUp(); return; }
        const timer = setInterval(() => setLeft(l => l - 1), 1000);
        return () => clearInterval(timer);
    }, [left, onTimeUp]);

    const mins = Math.floor(left / 60);
    const secs = left % 60;
    const isUrgent = left < 60; // Dưới 1 phút chuyển màu đỏ

    return (
        <div className={`text-center font-mono text-2xl font-bold border-b-4 mb-4 p-2 transition-colors ${isUrgent ? 'border-red-600 text-red-600 animate-pulse' : 'border-gray-800 text-gray-800'
            }`}>
            {mins}:{secs < 10 ? '0' : ''}{secs}
        </div>
    );
};

// Component: Bảng nháp cho môn Tự nhiên
const Scratchpad = () => {
    return (
        <div className="bg-yellow-50 border border-yellow-200 p-2 rounded mb-4 h-32 overflow-hidden relative">
            <span className="absolute top-1 right-2 text-xs text-yellow-600 opacity-50 font-bold">NHÁP</span>
            <textarea
                className="w-full h-full bg-transparent resize-none outline-none text-sm font-mono text-gray-600"
                placeholder="Viết nháp tính toán tại đây..."
            />
        </div>
    );
};

// Component: Xây dựng dàn ý cho môn Văn/Luận
const OutlineBuilder = ({ onComplete }) => {
    const [outline, setOutline] = useState({ intro: '', body1: '', body2: '', conclusion: '' });

    return (
        <div className="space-y-3 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <h3 className="text-indigo-800 font-bold text-sm uppercase">🏗 Xây dựng dàn ý trước khi viết</h3>
            <input
                className="w-full p-2 text-sm border rounded" placeholder="Mở bài: Luận điểm chính là gì?"
                value={outline.intro} onChange={e => setOutline({ ...outline, intro: e.target.value })}
            />
            <input
                className="w-full p-2 text-sm border rounded" placeholder="Thân bài 1: Ý triển khai đầu tiên"
                value={outline.body1} onChange={e => setOutline({ ...outline, body1: e.target.value })}
            />
            <input
                className="w-full p-2 text-sm border rounded" placeholder="Thân bài 2: Ý triển khai tiếp theo"
                value={outline.body2} onChange={e => setOutline({ ...outline, body2: e.target.value })}
            />
            <input
                className="w-full p-2 text-sm border rounded" placeholder="Kết bài: Tổng kết lại"
                value={outline.conclusion} onChange={e => setOutline({ ...outline, conclusion: e.target.value })}
            />
        </div>
    );
};

// --- 3. MAIN LOGIC ---

export default function SmartStudyCoach() {
    const [step, setStep] = useState('SETUP'); // SETUP | LEARNING | RESULT

    // -- CONFIG STATE --
    const [config, setConfig] = useState(() => loadStorage('sc_config', {
        subjectType: 'MATH', // MATH | LIT | FACT
        examMode: 'REVIEW',  // REVIEW (Học thong thả) | EXAM (Thi thử)
        format: 'MCQ'        // MCQ (Trắc nghiệm) | ESSAY (Tự luận)
    }));

    const [content, setContent] = useState(() => loadStorage('sc_content', {
        topic: '', question: '', answer: '', keyPoints: ''
    }));

    // Auto-save
    useEffect(() => { localStorage.setItem('sc_config', JSON.stringify(config)); }, [config]);
    useEffect(() => { localStorage.setItem('sc_content', JSON.stringify(content)); }, [content]);

    // -- LOGIC: STRATEGY MAPPER --
    // Đây là bộ não của App: Quyết định giao diện dựa trên Input
    const getStrategyName = () => {
        if (config.examMode === 'EXAM') return "🔥 CHẾ ĐỘ THI THỬ (HARDCORE)";
        if (config.subjectType === 'MATH') return "📐 Tư duy Logic & Giải quyết vấn đề";
        if (config.subjectType === 'LIT') return "🖋 Tư duy Cấu trúc & Diễn giải";
        return "🧠 Ghi nhớ & Lặp lại";
    };

    const startLearning = () => {
        if (!content.topic) return alert("Vui lòng nhập chủ đề!");
        setStep('LEARNING');
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-100 font-sans text-gray-800 shadow-xl border-x relative">

            {/* HEADER */}
            <header className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-md">
                <div>
                    <h1 className="text-lg font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-400">
                        Smart Coach AI
                    </h1>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Phase 1: Exam Master</p>
                </div>
                {step !== 'SETUP' && (
                    <button onClick={() => setStep('SETUP')} className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600">
                        Thoát
                    </button>
                )}
            </header>

            <main className="p-4 pb-20">

                {/* === SCREEN 1: INTELLIGENT SETUP === */}
                {step === 'SETUP' && (
                    <div className="space-y-6 animate-fade-in-up">

                        {/* 1. Nhập liệu cơ bản */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Chủ đề cần ôn</label>
                            <input
                                value={content.topic}
                                onChange={e => setContent({ ...content, topic: e.target.value })}
                                className="w-full mt-1 p-3 border rounded-lg font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="VD: Hàm số lượng giác, Văn học 12..."
                            />
                        </div>

                        {/* 2. Ma trận cấu hình (Strategy Matrix) */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border space-y-4">
                            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                ⚙️ Thiết lập Chiến lược học
                            </h2>

                            {/* Chọn Môn */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'MATH', label: 'Tự nhiên', icon: '📐' },
                                    { id: 'LIT', label: 'Xã hội/Văn', icon: '🖋' },
                                    { id: 'FACT', label: 'Ghi nhớ', icon: '🧠' }
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setConfig({ ...config, subjectType: type.id })}
                                        className={`p-2 rounded-lg text-xs font-bold border transition ${config.subjectType === type.id ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="text-xl mb-1">{type.icon}</div>
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            {/* Chọn Mục tiêu */}
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setConfig({ ...config, examMode: 'REVIEW' })}
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition ${config.examMode === 'REVIEW' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}
                                >
                                    🌱 Học hiểu (Review)
                                </button>
                                <button
                                    onClick={() => setConfig({ ...config, examMode: 'EXAM' })}
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition ${config.examMode === 'EXAM' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}
                                >
                                    🔥 Thi thử (Exam)
                                </button>
                            </div>

                            {/* Chọn Dạng bài */}
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-500 font-medium">Dạng bài:</span>
                                <label className="flex items-center cursor-pointer">
                                    <input type="radio" name="format" checked={config.format === 'MCQ'} onChange={() => setConfig({ ...config, format: 'MCQ' })} className="mr-2" />
                                    Trắc nghiệm
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input type="radio" name="format" checked={config.format === 'ESSAY'} onChange={() => setConfig({ ...config, format: 'ESSAY' })} className="mr-2" />
                                    Tự luận
                                </label>
                            </div>
                        </div>

                        {/* 3. Dynamic Input Area (Thay đổi theo cấu hình) */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Nạp dữ liệu đề bài</h3>

                            <textarea
                                className="w-full p-2 border rounded mb-2 text-sm h-20"
                                placeholder={config.format === 'MCQ' ? "Nhập câu hỏi..." : "Nhập đề bài luận/bài toán..."}
                                value={content.question}
                                onChange={e => setContent({ ...content, question: e.target.value })}
                            />

                            {config.format === 'MCQ' ? (
                                <input
                                    className="w-full p-2 border rounded text-sm"
                                    placeholder="Nhập đáp án đúng..."
                                    value={content.answer}
                                    onChange={e => setContent({ ...content, answer: e.target.value })}
                                />
                            ) : (
                                <textarea
                                    className="w-full p-2 border rounded text-sm h-20"
                                    placeholder="Gợi ý đáp án / Các ý chính (để đối chiếu sau khi làm xong)..."
                                    value={content.keyPoints}
                                    onChange={e => setContent({ ...content, keyPoints: e.target.value })}
                                />
                            )}
                        </div>

                        <button onClick={startLearning} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black shadow-lg transform transition active:scale-95">
                            BẮT ĐẦU {config.examMode === 'EXAM' ? 'THI' : 'HỌC'}
                        </button>
                    </div>
                )}

                {/* === SCREEN 2: ADAPTIVE LEARNING SESSION === */}
                {step === 'LEARNING' && (
                    <div className="animate-fade-in space-y-4">

                        {/* 1. Context Bar */}
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-indigo-500">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Phương pháp tối ưu</p>
                                <p className="text-sm font-bold text-indigo-700">{getStrategyName()}</p>
                            </div>
                            <div className="text-2xl">
                                {config.subjectType === 'MATH' ? '📐' : config.subjectType === 'LIT' ? '🖋' : '🧠'}
                            </div>
                        </div>

                        {/* 2. Timer (Chỉ hiện nếu chọn chế độ Thi hoặc Trắc nghiệm) */}
                        {(config.examMode === 'EXAM' || config.format === 'MCQ') && (
                            <ExamTimer duration={config.examMode === 'EXAM' ? 15 : 45} onTimeUp={() => alert("Hết giờ!")} />
                        )}

                        {/* 3. Display Question */}
                        <div className="bg-white p-6 rounded-lg shadow-md min-h-[150px] flex items-center justify-center text-center">
                            <div>
                                <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider">
                                    Đề bài
                                </span>
                                <p className="text-lg font-medium mt-3 text-gray-800 leading-relaxed">
                                    {content.question || "(Chưa có dữ liệu câu hỏi)"}
                                </p>
                            </div>
                        </div>

                        {/* 4. ADAPTIVE WORKSPACE (Thay đổi theo môn) */}

                        {/* TRƯỜNG HỢP A: TOÁN/LÝ (Cần nháp) */}
                        {config.subjectType === 'MATH' && (
                            <div className="animate-slide-up">
                                <p className="text-xs font-bold text-gray-500 mb-2 ml-1">Khu vực tính toán</p>
                                <Scratchpad />
                            </div>
                        )}

                        {/* TRƯỜNG HỢP B: VĂN/LUẬN (Cần dàn ý) */}
                        {config.subjectType === 'LIT' && config.format === 'ESSAY' && (
                            <div className="animate-slide-up">
                                <OutlineBuilder />
                            </div>
                        )}

                        {/* TRƯỜNG HỢP C: NHẬP KẾT QUẢ CUỐI CÙNG */}
                        <div className="bg-white p-4 rounded-lg border shadow-sm mt-4">
                            <h3 className="text-sm font-bold text-gray-700 mb-2">Bài làm của bạn</h3>
                            {config.format === 'MCQ' ? (
                                <div className="grid grid-cols-4 gap-2">
                                    {['A', 'B', 'C', 'D'].map(opt => (
                                        <button key={opt} className="bg-gray-100 py-3 rounded hover:bg-indigo-100 font-bold border hover:border-indigo-300">
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <textarea
                                    className="w-full h-40 p-3 border rounded focus:ring-2 focus:ring-green-500 outline-none resize-none"
                                    placeholder="Viết câu trả lời chi tiết tại đây..."
                                />
                            )}
                        </div>

                        {/* Action: Xem đáp án */}
                        <button
                            onClick={() => setStep('RESULT')}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold mt-4 shadow hover:bg-indigo-700"
                        >
                            Nộp bài & Check đáp án
                        </button>
                    </div>
                )}

                {/* === SCREEN 3: RESULT & REFLECTION === */}
                {step === 'RESULT' && (
                    <div className="space-y-6 animate-fade-in bg-white p-6 rounded-xl shadow-lg border">
                        <h2 className="text-xl font-bold text-center border-b pb-4">Kết quả & Đối chiếu</h2>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Câu hỏi</p>
                                <p className="font-medium text-gray-800">{content.question}</p>
                            </div>

                            <div className="bg-green-50 p-4 rounded border border-green-200">
                                <p className="text-xs text-green-700 font-bold uppercase mb-1">Đáp án chuẩn / Ý chính</p>
                                <p className="text-green-900 font-bold">
                                    {config.format === 'MCQ' ? content.answer : content.keyPoints}
                                </p>
                            </div>
                        </div>

                        <p className="text-center text-sm text-gray-500 mt-4">Bạn đánh giá mức độ hoàn thành thế nào?</p>
                        <div className="flex gap-2 justify-center">
                            <button onClick={() => setStep('SETUP')} className="bg-red-100 text-red-600 px-4 py-2 rounded font-bold">Làm lại</button>
                            <button onClick={() => setStep('SETUP')} className="bg-green-100 text-green-600 px-4 py-2 rounded font-bold">Đã hiểu</button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
