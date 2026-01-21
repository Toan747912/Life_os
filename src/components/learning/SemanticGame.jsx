import React, { useState, useEffect } from 'react';

// API BASE URL - Adjust if needed
const API_URL = 'http://localhost:8080/api';

export default function SemanticGame({ onBack, lessonId }) {
    const [mode, setMode] = useState('MENU'); // MENU | SYNONYM | COLLOCATION | ADD_DATA
    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // --- GAME 1: SYNONYM/ANTONYM SORTER ---
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [buckets, setBuckets] = useState({ synonym: [], antonym: [] });
    // For this simple version, we'll pick one option at a time to sort
    const [currentOption, setCurrentOption] = useState(null);



    // --- HELPER: DATA FETCHING ---
    const fetchGameData = async (type, wordId = 1) => {
        setLoading(true);
        setResult(null);
        try {
            let endpoint;

            if (lessonId) {
                // Unified Endpoint for Lesson Mode
                endpoint = `${API_URL}/semantic/game/lesson/${lessonId}?type=${type}`;
            } else {
                // Legacy / Generic Mode
                endpoint = type === 'SYNONYM'
                    ? `${API_URL}/semantic/synonym-game/${wordId}`
                    : `${API_URL}/semantic/collocation-game/${wordId}`;
            }

            const res = await fetch(endpoint);
            const data = await res.json();

            if (res.ok) {
                setGameData(data);
                if (type === 'SYNONYM') {
                    // Setup first option to sort
                    if (data.options && data.options.length > 0) {
                        setCurrentOption(data.options[0]);
                        setCurrentWordIndex(0);
                        setBuckets({ synonym: [], antonym: [] });
                    }
                }
            } else {
                alert(data.error || "Không tìm thấy dữ liệu! Hãy vào phần 'Thêm Dữ Liệu' để tạo từ vựng trước.");
                if (lessonId) setMode('ADD_DATA');
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối Server!");
        }
        setLoading(false);
    };

    // --- HANDLER: SYNONYM GAME ---
    const handleSort = (bucketType) => {
        // bucketType: 'SYNONYM' or 'ANTONYM'
        // Check correctness immediate? Or store?
        // Let's validate immediately for fun
        const isCorrect = (bucketType === currentOption.relation_type) ||
            (bucketType === 'ANTONYM' && currentOption.relation_type === 'ANTONYM') ||
            (bucketType === 'SYNONYM' && currentOption.relation_type === 'SYNONYM');

        if (isCorrect) {
            setResult({ correct: true, msg: "Chính xác!" });
            // Move to next option
            const nextIdx = currentWordIndex + 1;
            if (nextIdx < gameData.options.length) {
                setTimeout(() => {
                    setResult(null);
                    setCurrentWordIndex(nextIdx);
                    setCurrentOption(gameData.options[nextIdx]);
                }, 800);
            } else {
                setTimeout(() => setResult({ correct: true, msg: "Hoàn thành xuất sắc!" }), 500);
            }
        } else {
            setResult({ correct: false, msg: `Sai rồi! ${currentOption.word} là ${currentOption.relation_type}` });
        }
    };

    // --- HANDLER: COLLOCATION GAME ---
    const handleCollocationParams = (selectedWord) => {
        if (selectedWord === gameData.correctAnswer) {
            setResult({ correct: true, msg: "Chính xác! Cụm từ hay." });
        } else {
            setResult({ correct: false, msg: "Chưa đúng, thử lại nhé." });
        }
    };

    // --- RENDER: ADD DATA FORM (Internal Tool) ---
    const AddDataForm = () => {
        const [formData, setFormData] = useState({ word: '', part_of_speech: 'Noun', definition: '' });
        const [relData, setRelData] = useState({ word1_id: '', word2_id: '', type: 'SYNONYM', example: '' });

        const submitVocab = async () => {
            if (!formData.word) return alert("Chưa nhập từ!");
            try {
                const res = await fetch(`${API_URL}/semantic/vocabulary`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);

                alert(`Đã thêm từ: ${data.word} (ID: ${data.id})`);
                setFormData({ ...formData, word: '' });

                // Auto-link to lesson
                if (lessonId) {
                    await fetch(`${API_URL}/semantic/lessons/${lessonId}/vocab`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ vocab_id: data.id })
                    });
                    alert(`Đã liên kết từ ${data.word} vào bài học này!`);
                }
            } catch (e) { alert(e.message) }
        };

        const submitRel = async () => {
            try {
                const res = await fetch(`${API_URL}/semantic/relation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(relData)
                });
                const d = await res.json();
                alert(d.id ? 'Đã thêm quan hệ!' : 'Lỗi');
            } catch (e) { alert(e.message) }
        };

        const handleForceAnalyze = async () => {
            if (!lessonId) return alert("Tính năng này chỉ dùng được khi đang mở một bài học cụ thể.");
            if (!confirm("AI sẽ đọc nội dung bài học và tự động điền dữ liệu. Bạn có muốn tiếp tục?")) return;

            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/semantic/lessons/${lessonId}/analyze`, { method: 'POST' });
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                alert(`Thành công! AI đã tìm thấy và thêm ${data.count} từ vựng mới.`);
                setMode('MENU'); // Return to menu to play
            } catch (e) {
                alert("Lỗi AI: " + e.message);
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl mx-auto space-y-8 animate-slide-up">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xl text-slate-700">⚙️ Quản Lý Dữ Liệu (Admin)</h3>
                    <button onClick={() => setMode('MENU')} className="text-sm text-red-500 hover:bg-red-50 px-3 py-1 rounded">Đóng</button>
                </div>

                {/* 0. AUTO ANALYZE */}
                {lessonId && (
                    <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-indigo-700">✨ AI Auto-Analysis {loading && "(Running...)"}</h4>
                            <p className="text-xs text-indigo-500">Tự động phân tích nội dung bài học và điền dữ liệu.</p>
                        </div>
                        <button onClick={handleForceAnalyze} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50">
                            {loading ? 'Đang xử lý...' : 'Chạy Ngay 🚀'}
                        </button>
                    </div>
                )}

                <div className="space-y-4 opacity-50 hover:opacity-100 transition-opacity">
                    <h4 className="font-bold border-b pb-2">1. Thêm Từ Vựng (Thủ công)</h4>
                    <div className="space-y-2">
                        <input className="border p-2 w-full rounded" placeholder="Word (e.g. Happy)" value={formData.word} onChange={e => setFormData({ ...formData, word: e.target.value })} />
                        <input className="border p-2 w-full rounded" placeholder="Type (Noun/Verb...)" value={formData.part_of_speech} onChange={e => setFormData({ ...formData, part_of_speech: e.target.value })} />
                        <button onClick={submitVocab} className="bg-blue-600 text-white px-4 py-2 rounded">Lưu Từ</button>
                    </div>
                </div>

                <div className="space-y-4 opacity-50 hover:opacity-100 transition-opacity">
                    <h4 className="font-bold border-b pb-2">2. Thêm Quan Hệ (Thủ công)</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex gap-2">
                            <input className="border p-2 w-1/2 rounded" placeholder="ID Từ 1 (Gốc)" onChange={e => setRelData({ ...relData, word1_id: e.target.value })} />
                            <input className="border p-2 w-1/2 rounded" placeholder="ID Từ 2 (Liên quan)" onChange={e => setRelData({ ...relData, word2_id: e.target.value })} />
                        </div>
                        <select className="border p-2 w-full rounded" onChange={e => setRelData({ ...relData, type: e.target.value })}>
                            <option value="SYNONYM">Đồng nghĩa (SYNONYM)</option>
                            <option value="ANTONYM">Trái nghĩa (ANTONYM)</option>
                            <option value="COLLOCATION">Đi chung (COLLOCATION)</option>
                        </select>
                        <input className="border p-2 w-full rounded" placeholder="Ví dụ (nếu là Collocation)" onChange={e => setRelData({ ...relData, example: e.target.value })} />
                        <button onClick={submitRel} className="bg-green-600 text-white px-4 py-2 rounded">Lưu Quan Hệ</button>
                        <p className="text-xs text-gray-500 italic">Mẹo: Nhớ ID của từ vừa tạo ở trên để điền vào đây.</p>
                    </div>
                </div>
            </div>
        );
    };

    // --- EFFECT: WARM UP WORDS ---
    const [voicesLoaded, setVoicesLoaded] = useState(false);
    useEffect(() => {
        const loadVoices = () => {
            const vs = window.speechSynthesis.getVoices();
            if (vs.length > 0) {
                setVoicesLoaded(true);
                console.log("TTS Voices loaded:", vs.length);
            }
        };

        loadVoices();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        return () => {
            if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    // --- HELPER: TTS ---
    const speak = (text) => {
        if (!('speechSynthesis' in window)) {
            console.error("Browser does not support TTS");
            return;
        }
        console.log("Speaking:", text);

        window.speechSynthesis.cancel(); // Reset previous

        // Handle object case for target
        const textToSpeak = (typeof text === 'object' && text?.word) ? text.word : text;

        if (!textToSpeak) {
            console.error("Nothing to speak found:", text);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'en-US';

        // Retry getting voices if empty
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google US") || v.name.includes("Samantha") || v.lang.includes("en-US"));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
            console.log("Using voice:", preferredVoice.name);
        } else {
            console.warn("No preferred voice found, using default.");
        }

        utterance.onerror = (e) => console.error("TTS Error:", e);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="text-gray-500 hover:text-black">← Quay lại</button>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-600 to-pink-600">Semantic Master {lessonId && "(Bài học)"}</h2>
                <button onClick={() => setMode('ADD_DATA')} className="text-xs bg-gray-200 px-2 py-1 rounded">⚙️ Data</button>
            </div>

            {mode === 'MENU' && (
                <div className="grid gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-md cursor-pointer hover:border-purple-400 border-2 border-transparent transition"
                        onClick={() => { setMode('SYNONYM'); fetchGameData('SYNONYM', 1); }}>
                        <h3 className="text-lg font-bold text-purple-700">🎭 Đồng nghĩa / Trái nghĩa</h3>
                        <p className="text-gray-500 text-sm">Phân loại từ vào đúng giỏ ngữ nghĩa.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md cursor-pointer hover:border-pink-400 border-2 border-transparent transition"
                        onClick={() => { setMode('COLLOCATION'); fetchGameData('COLLOCATION', 1); }}>
                        <h3 className="text-lg font-bold text-pink-700">🔗 Collocation Builder</h3>
                        <p className="text-gray-500 text-sm">Tìm bạn đồng hành hoàn hảo cho từ.</p>
                    </div>
                </div>
            )}

            {mode === 'ADD_DATA' && <AddDataForm />}

            {loading && <div className="text-center py-10">Đang tải dữ liệu trí tuệ...</div>}

            {/* GAME UI: SYNONYM */}
            {mode === 'SYNONYM' && gameData && !loading && (
                <div className="text-center space-y-8 animate-fade-in">
                    <div className="bg-white p-4 rounded-lg shadow inline-block hover:bg-slate-50 cursor-pointer transition" onClick={() => speak(gameData.target)}>
                        <span className="text-gray-400 text-xs uppercase tracking-wider">Từ Gốc (Nghe)</span>
                        <h1 className="text-4xl font-black text-slate-800">
                            {typeof gameData.target === 'object' ? gameData.target.word : gameData.target}
                        </h1>
                    </div>

                    {currentOption && (
                        <div className="py-10">
                            <div className="text-sm text-gray-500 mb-2">Từ đang rơi xuống:</div>
                            <div className="text-3xl font-bold text-indigo-600 animate-bounce cursor-pointer border-2 border-dashed border-indigo-300 p-4 rounded-md inline-block hover:bg-indigo-50 transition" onClick={() => speak(currentOption.word)}>
                                {currentOption.word}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => handleSort('SYNONYM')}
                            className="w-1/2 bg-green-50 border-2 border-green-200 p-6 rounded-xl hover:bg-green-100 transition group"
                        >
                            <div className="text-2xl mb-2">🤝</div>
                            <div className="font-bold text-green-700 group-hover:scale-105 transition">Đồng Nghĩa</div>
                        </button>

                        <button
                            onClick={() => handleSort('ANTONYM')}
                            className="w-1/2 bg-red-50 border-2 border-red-200 p-6 rounded-xl hover:bg-red-100 transition group"
                        >
                            <div className="text-2xl mb-2">⚔️</div>
                            <div className="font-bold text-red-700 group-hover:scale-105 transition">Trái Nghĩa</div>
                        </button>
                    </div>

                    {result && (
                        <div className={`p-4 rounded-lg font-bold text-white ${result.correct ? 'bg-green-500' : 'bg-red-500'} animate-fade-in-up`}>
                            {result.msg}
                        </div>
                    )}
                </div>
            )}

            {/* GAME UI: COLLOCATION */}
            {mode === 'COLLOCATION' && gameData && !loading && (
                <div className="space-y-8 text-center animate-fade-in">
                    <div className="bg-white p-8 rounded-2xl shadow-lg">
                        <p className="text-2xl font-serif text-slate-700 leading-relaxed">
                            {gameData.sentence}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {gameData.options && gameData.options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => handleCollocationParams(opt)}
                                className="bg-white border hover:bg-indigo-50 hover:border-indigo-500 text-lg py-4 rounded-xl font-medium shadow-sm transition"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>

                    {result && (
                        <div className={`p-4 rounded-lg font-bold text-white ${result.correct ? 'bg-green-500' : 'bg-red-500'} animate-fade-in-up`}>
                            {result.msg}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
