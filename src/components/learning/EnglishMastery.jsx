import React, { useState, useEffect } from 'react';

// --- 1. DỮ LIỆU BÀI TẬP (MOCK DATA) ---
// Trong thực tế, dữ liệu này sẽ lấy từ Database hoặc AI sinh ra
const EXERCISE_DATA = {
    EASY: {
        reorder: [
            { id: 1, words: ["is", "name", "My", "John"], answer: "My name is John" },
            { id: 2, words: ["like", "I", "apples", "red"], answer: "I like red apples" }
        ],
        cloze: [
            { id: 1, text: "I ___ to school yesterday.", answer: "went", hint: "Go (Past tense)" },
            { id: 2, text: "She ___ a beautiful song.", answer: "sings", hint: "Verb (Present)" }
        ],
        error: [
            { id: 1, text: "She don't like pizza.", errorWord: "don't", correct: "doesn't" },
            { id: 2, text: "I has a cat.", errorWord: "has", correct: "have" }
        ],
        dictation: [
            { id: 1, text: "Good morning teacher", speed: 0.8 },
            { id: 2, text: "Open your book", speed: 0.8 }
        ]
    },
    MEDIUM: {
        reorder: [
            { id: 3, words: ["you", "Where", "do", "live", "?"], answer: "Where do you live?" },
            { id: 4, words: ["been", "have", "I", "working", "here"], answer: "I have been working here" }
        ],
        cloze: [
            { id: 3, text: "The weather is ___ than yesterday.", answer: "better", hint: "Good (Comparative)" },
            { id: 4, text: "I am interested ___ learning music.", answer: "in", hint: "Preposition" }
        ],
        error: [
            { id: 3, text: "He go to school by bus every day.", errorWord: "go", correct: "goes" },
            { id: 4, text: "This is the more beautiful flower I have seen.", errorWord: "more", correct: "most" }
        ],
        dictation: [
            { id: 3, text: "Can you repeat that please?", speed: 1 },
            { id: 4, text: "I would like to order a coffee.", speed: 1 }
        ]
    },
    HARD: {
        reorder: [
            { id: 5, words: ["Not", "until", "did", "he", "speak", "yesterday"], answer: "Not until yesterday did he speak" },
        ],
        cloze: [
            { id: 5, text: "Despite ___ tired, he kept working.", answer: "being", hint: "Gerund" },
        ],
        error: [
            { id: 5, text: "Hardly had I arrived when the phone ring.", errorWord: "ring", correct: "rang" },
        ],
        dictation: [
            { id: 5, text: "Artificial intelligence is transforming the world.", speed: 1.1 },
        ]
    }
};

// --- 2. UTILS: TEXT-TO-SPEECH ---
const speakText = (text, rate = 1) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop previous
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Giọng Mỹ
        utterance.rate = rate;    // Tốc độ
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Trình duyệt của bạn không hỗ trợ đọc âm thanh!");
    }
};

// --- 3. SUB-COMPONENTS (GAME MODES) ---

// GAME: XẾP TỪ (REORDER)
const GameReorder = ({ data, onFinish }) => {
    const [shuffled, setShuffled] = useState([]);
    const [selected, setSelected] = useState([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // Shuffle words ban đầu
        setShuffled([...data.words].sort(() => Math.random() - 0.5));
        setSelected([]);
    }, [data]);

    const handleSelect = (word, index) => {
        const newShuffled = [...shuffled];
        newShuffled.splice(index, 1);
        setShuffled(newShuffled);
        setSelected([...selected, word]);
    };

    const handleUndo = (word, index) => {
        const newSelected = [...selected];
        newSelected.splice(index, 1);
        setSelected(newSelected);
        setShuffled([...shuffled, word]);
    };

    const checkAnswer = () => {
        setProcessing(true);
        setTimeout(() => {
            const sentence = selected.join(" ");
            // Xử lý dấu câu dính liền (vd: "live ?" -> "live?")
            const normalized = sentence.replace(/\s([?.!,])/g, '$1');
            const isCorrect = normalized === data.answer || sentence === data.answer;
            onFinish(isCorrect, data.answer);
            setProcessing(false);
        }, 600);
    };

    return (
        <div className="space-y-6">
            <div className="min-h-[60px] bg-white border-b-2 border-indigo-200 p-4 rounded-t-lg flex flex-wrap gap-2 items-center">
                {selected.length === 0 && <span className="text-gray-400 text-sm italic">Chọn từ bên dưới để ghép câu...</span>}
                {selected.map((w, i) => (
                    <button key={i} onClick={() => handleUndo(w, i)} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded shadow-sm hover:bg-red-100">
                        {w}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-2 justify-center p-4 bg-gray-50 rounded-b-lg">
                {shuffled.map((w, i) => (
                    <button key={i} onClick={() => handleSelect(w, i)} className="bg-white border border-gray-300 px-4 py-2 rounded shadow hover:bg-indigo-50 active:scale-95 transition">
                        {w}
                    </button>
                ))}
            </div>

            <button
                onClick={checkAnswer}
                disabled={processing}
                className={`w-full text-white py-3 rounded-lg font-bold transition ${processing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                {processing ? 'Đang xử lý...' : 'Kiểm tra'}
            </button>
        </div>
    );
};

// GAME: TÌM LỖI SAI (ERROR HUNT)
const GameErrorHunt = ({ data, onFinish }) => {
    const words = data.text.split(" ");

    const handleWordClick = (word) => {
        // So sánh từ (bỏ dấu câu nếu có)
        const cleanWord = word.replace(/[.,!?]/g, "");
        if (cleanWord === data.errorWord) {
            onFinish(true, `Lỗi sai: "${data.errorWord}" ➔ Sửa thành: "${data.correct}"`);
        } else {
            onFinish(false, "Đó không phải là lỗi sai!");
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-center text-sm text-gray-500">Bấm vào từ bị dùng sai trong câu sau:</p>
            <div className="flex flex-wrap gap-2 justify-center text-lg leading-loose">
                {words.map((w, i) => (
                    <span
                        key={i}
                        onClick={() => handleWordClick(w)}
                        className="cursor-pointer hover:bg-red-100 hover:text-red-600 px-1 rounded transition border-b border-transparent hover:border-red-300"
                    >
                        {w}
                    </span>
                ))}
            </div>
        </div>
    );
};

// GAME: DICTATION (NGHE CHÉP)
const GameDictation = ({ data, onFinish }) => {
    const [input, setInput] = useState("");
    const [processing, setProcessing] = useState(false);

    const check = () => {
        setProcessing(true);
        setTimeout(() => {
            const isCorrect = input.trim().toLowerCase().replace(/[.,!?]/g, "") === data.text.trim().toLowerCase().replace(/[.,!?]/g, "");
            onFinish(isCorrect, data.text);
            setProcessing(false);
        }, 600);
    };

    return (
        <div className="space-y-4 text-center">
            <div
                onClick={() => speakText(data.text, data.speed)}
                className="w-20 h-20 mx-auto bg-indigo-500 rounded-full flex items-center justify-center text-white text-3xl shadow-lg cursor-pointer hover:bg-indigo-600 active:scale-95 transition"
            >
                🔊
            </div>
            <p className="text-xs text-gray-500">Bấm loa để nghe và chép lại chính xác</p>

            <input
                className="w-full p-3 border rounded text-center text-lg outline-none focus:border-indigo-500"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Gõ lại những gì bạn nghe..."
            />

            <button
                onClick={check}
                disabled={processing}
                className={`w-full text-white py-3 rounded-lg font-bold transition ${processing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                {processing ? 'Đang xử lý...' : 'Nộp bài'}
            </button>
        </div>
    );
};

// GAME: CLOZE (ĐIỀN TỪ)
const GameCloze = ({ data, onFinish }) => {
    const [val, setVal] = useState("");
    const [processing, setProcessing] = useState(false);

    const parts = data.text.split("___");

    const check = () => {
        setProcessing(true);
        setTimeout(() => {
            onFinish(val.toLowerCase().trim() === data.answer.toLowerCase(), data.answer);
            setProcessing(false);
        }, 600);
    };

    return (
        <div className="space-y-4">
            <div className="text-xl text-center leading-loose">
                {parts[0]}
                <input
                    className="border-b-2 border-indigo-400 outline-none text-center text-indigo-700 w-24 mx-2 focus:border-indigo-600"
                    autoFocus
                    value={val}
                    onChange={e => setVal(e.target.value)}
                />
                {parts[1]}
            </div>
            <p className="text-center text-xs text-gray-400 italic">Gợi ý: {data.hint}</p>
            <button
                onClick={check}
                disabled={processing}
                className={`w-full text-white py-3 rounded-lg font-bold transition ${processing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                {processing ? 'Đang xử lý...' : 'Kiểm tra'}
            </button>
        </div>
    );
};

// --- 4. MAIN APP CONTAINER ---

export default function EnglishMastery() {
    const [level, setLevel] = useState('EASY'); // EASY | MEDIUM | HARD
    const [mode, setMode] = useState('MENU');   // MENU | PLAYING | RESULT
    const [gameType, setGameType] = useState('reorder');
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [lastResult, setLastResult] = useState(null); // { isCorrect, msg }

    const currentQuestions = EXERCISE_DATA[level][gameType] || [];
    const currentData = currentQuestions[currentQIndex];

    const startGame = (type) => {
        setGameType(type);
        setCurrentQIndex(0);
        setScore(0);
        setMode('PLAYING');
    };

    const handleFinishTurn = (isCorrect, correctMsg) => {
        if (isCorrect) setScore(s => s + 10);
        setLastResult({ isCorrect, msg: correctMsg });
        setMode('RESULT');
    };

    const nextQuestion = () => {
        if (currentQIndex < currentQuestions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
            setMode('PLAYING');
        } else {
            setMode('SUMMARY');
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-50 font-sans text-gray-800 shadow-xl border-x">

            {/* HEADER */}
            <header className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <h1 className="font-extrabold text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
                    English Coach
                </h1>
                {mode !== 'MENU' && (
                    <div className="text-xs font-bold px-2 py-1 bg-gray-100 rounded">
                        Level: {level}
                    </div>
                )}
            </header>

            <main className="p-4 pb-20">

                {/* --- MENU SCREEN --- */}
                {mode === 'MENU' && (
                    <div className="space-y-6 animate-fade-in-up">

                        {/* Level Selector */}
                        <div className="flex bg-gray-200 p-1 rounded-lg">
                            {['EASY', 'MEDIUM', 'HARD'].map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLevel(l)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition ${level === l ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => startGame('reorder')} className="p-4 bg-white border border-indigo-100 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition text-left">
                                <div className="text-2xl mb-2">🧩</div>
                                <div className="font-bold text-gray-800">Sắp xếp từ</div>
                                <div className="text-xs text-gray-400">Luyện cấu trúc câu</div>
                            </button>

                            <button onClick={() => startGame('cloze')} className="p-4 bg-white border border-green-100 rounded-xl shadow-sm hover:shadow-md hover:border-green-300 transition text-left">
                                <div className="text-2xl mb-2">📝</div>
                                <div className="font-bold text-gray-800">Điền từ</div>
                                <div className="text-xs text-gray-400">Từ vựng & Ngữ pháp</div>
                            </button>

                            <button onClick={() => startGame('error')} className="p-4 bg-white border border-red-100 rounded-xl shadow-sm hover:shadow-md hover:border-red-300 transition text-left">
                                <div className="text-2xl mb-2">🔍</div>
                                <div className="font-bold text-gray-800">Tìm lỗi sai</div>
                                <div className="text-xs text-gray-400">Sửa lỗi ngữ pháp</div>
                            </button>

                            <button onClick={() => startGame('dictation')} className="p-4 bg-white border border-yellow-100 rounded-xl shadow-sm hover:shadow-md hover:border-yellow-300 transition text-left">
                                <div className="text-2xl mb-2">🎧</div>
                                <div className="font-bold text-gray-800">Nghe chép</div>
                                <div className="text-xs text-gray-400">Nghe & Viết chuẩn</div>
                            </button>
                        </div>
                    </div>
                )}

                {/* --- PLAYING SCREEN --- */}
                {mode === 'PLAYING' && currentData && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setMode('MENU')} className="text-gray-400 hover:text-gray-600 text-sm">✕ Thoát</button>
                            <div className="flex gap-1">
                                {currentQuestions.map((_, i) => (
                                    <div key={i} className={`h-1 w-6 rounded-full ${i <= currentQIndex ? 'bg-indigo-500' : 'bg-gray-200'}`}></div>
                                ))}
                            </div>
                        </div>

                        {/* Render Game Logic based on Type */}
                        <div className="bg-white p-6 rounded-xl shadow-lg min-h-[300px] flex flex-col justify-center">
                            {gameType === 'reorder' && <GameReorder data={currentData} onFinish={handleFinishTurn} />}
                            {gameType === 'error' && <GameErrorHunt data={currentData} onFinish={handleFinishTurn} />}
                            {gameType === 'dictation' && <GameDictation data={currentData} onFinish={handleFinishTurn} />}
                            {gameType === 'cloze' && <GameCloze data={currentData} onFinish={handleFinishTurn} />}
                        </div>
                    </div>
                )}

                {/* --- TURN RESULT POPUP --- */}
                {mode === 'RESULT' && lastResult && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center shadow-2xl transform scale-100">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl ${lastResult.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {lastResult.isCorrect ? '✓' : '✕'}
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${lastResult.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                {lastResult.isCorrect ? 'Chính xác!' : 'Chưa đúng'}
                            </h3>

                            <div className="bg-gray-50 p-3 rounded mb-6 text-left">
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Đáp án đúng:</p>
                                <p className="font-medium text-gray-800">{lastResult.msg}</p>
                            </div>

                            {/* Shadowing Feature Button */}
                            <button
                                onClick={() => speakText(lastResult.msg)}
                                className="w-full mb-3 border border-indigo-200 text-indigo-600 py-2 rounded-lg font-bold hover:bg-indigo-50 flex items-center justify-center gap-2"
                            >
                                🗣️ Nghe & Đọc lại (Shadowing)
                            </button>

                            <button
                                onClick={nextQuestion}
                                className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold"
                            >
                                Tiếp tục ➜
                            </button>
                        </div>
                    </div>
                )}

                {/* --- SUMMARY SCREEN --- */}
                {mode === 'SUMMARY' && (
                    <div className="text-center pt-10 animate-fade-in">
                        <h2 className="text-2xl font-bold mb-2">Hoàn thành bài tập!</h2>
                        <div className="text-6xl font-extrabold text-indigo-600 mb-4">{score} <span className="text-xl text-gray-400">pts</span></div>
                        <p className="text-gray-500 mb-8">Bạn đã hoàn thành level {level} kỹ năng {gameType}.</p>
                        <button onClick={() => setMode('MENU')} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700">
                            Về Menu Chính
                        </button>
                    </div>
                )}

            </main>
        </div>
    );
}
