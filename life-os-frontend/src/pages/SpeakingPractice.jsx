import React, { useState, useEffect, useRef } from 'react';
import { conversationApi } from '../services/api';
import { MessageCircle, Send, Mic, Square, Play, Loader2, Star, Award, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const SpeakingPractice = () => {
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    // Chat state
    const [inputMsg, setInputMsg] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [evaluating, setEvaluating] = useState(false);

    // Voice recognition state
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchConversations();

        // Init Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setInputMsg(prev => prev + (prev ? ' ' : '') + finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsRecording(false);
                if (event.error === 'not-allowed') {
                    toast.error("Vui lòng cấp quyền sử dụng Microphone");
                }
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            toast.error("Trình duyệt không hỗ trợ nhận diện giọng nói (Vui lòng dùng Chrome/Edge)");
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            setInputMsg(''); // Clear input before speaking
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isSending]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const res = await conversationApi.getAll();
            if (res.data?.data) {
                setConversations(res.data.data);
            }
        } catch (error) {
            console.error("Failed to load conversations", error);
        } finally {
            setLoading(false);
        }
    };

    const startNewConversation = async (topic) => {
        try {
            setLoading(true);
            const res = await conversationApi.start(topic);
            const newConv = res.data.data;
            setActiveConv(newConv);
            setMessages(newConv.messages || []);
            setConversations(prev => [newConv, ...prev]);
        } catch (error) {
            toast.error("Không thể bắt đầu cuộc trò chuyện mới.");
        } finally {
            setLoading(false);
        }
    };

    const selectConversation = (conv) => {
        setActiveConv(conv);
        setMessages(conv.messages || []);
    };

    const sendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!inputMsg.trim() || !activeConv || isSending) return;

        const userText = inputMsg.trim();
        setInputMsg('');

        // Optimistic UI update for user message
        const optimisticUserMsg = { id: Date.now().toString(), sender: 'USER', content: userText, createdAt: new Date().toISOString() };
        setMessages(prev => [...prev, optimisticUserMsg]);
        setIsSending(true);

        try {
            const res = await conversationApi.sendMessage(activeConv.id, userText);
            // Replace with real data from server including AI response
            if (res.data?.data?.messages) {
                setMessages(res.data.data.messages);
            }

            // Call evaluation automatically after 5 messages
            if (messages.length > 0 && messages.length % 5 === 0 && activeConv.status !== 'EVALUATED') {
                handleEvaluate(activeConv.id, true); // silent evaluation update
            }

        } catch (error) {
            toast.error("Lỗi gửi tin nhắn");
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== optimisticUserMsg.id));
        } finally {
            setIsSending(false);
        }
    };

    const handleEvaluate = async (id, isSilent = false) => {
        try {
            if (!isSilent) setEvaluating(true);
            const res = await conversationApi.evaluate(id);
            if (res.data?.data) {
                setActiveConv(res.data.data);
                // Update in list
                setConversations(prev => prev.map(c => c.id === id ? res.data.data : c));
                if (!isSilent) toast.success("Đã hoàn thành phân tích độ lưu loát!");
            }
        } catch (error) {
            if (!isSilent) toast.error("Có lỗi khi phân tích đoạn hội thoại");
        } finally {
            if (!isSilent) setEvaluating(false);
        }
    };

    const Topics = [
        { id: 'coffee', icon: '☕', title: 'Tại quán Cà phê', desc: 'Gọi đồ và trò chuyện ngẫu nhiên' },
        { id: 'interview', icon: '💼', title: 'Phỏng vấn xin việc', desc: 'Luyện tập trả lời phòng nhân sự' },
        { id: 'travel', icon: '✈️', title: 'Sân bay / Du lịch', desc: 'Làm thủ tục hải quan và hỏi đường' },
        { id: 'hobby', icon: '🎸', title: 'Sở thích cá nhân', desc: 'Thảo luận về âm nhạc, thể thao' }
    ];

    if (loading && !activeConv && conversations.length === 0) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
    }

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6 max-w-7xl mx-auto">

            {/* Left Sidebar: Histories & Topics */}
            <div className={`w-full lg:w-80 flex flex-col gap-6 ${activeConv ? 'hidden lg:flex' : 'flex'}`}>
                {/* Topics Selection (If not in active conv) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex-shrink-0">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-indigo-600" /> Bắt đầu mới
                    </h2>
                    <div className="grid grid-cols-1 gap-2">
                        {Topics.map(t => (
                            <button
                                key={t.id}
                                onClick={() => startNewConversation(`Roleplay scenario: ${t.title}. Context: ${t.desc}`)}
                                disabled={loading}
                                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                            >
                                <span className="text-2xl">{t.icon}</span>
                                <div>
                                    <div className="font-bold text-slate-700 text-sm">{t.title}</div>
                                    <div className="text-xs text-slate-500">{t.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* History */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 flex flex-col min-h-0">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <h2 className="text-lg font-bold text-slate-800">Lịch sử Luyện tập</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {conversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => selectConversation(conv)}
                                className={`w-full flex flex-col p-3 rounded-xl border text-left transition-all ${activeConv?.id === conv.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                            >
                                <div className="flex justify-between items-start w-full mb-1">
                                    <span className="font-bold text-slate-700 text-sm line-clamp-1 flex-1">{conv.topic || 'Hội thoại tự do'}</span>
                                    {conv.fluencyScore > 0 && (
                                        <span className="shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-2">
                                            {conv.fluencyScore}/100
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-slate-400">
                                    {new Date(conv.updatedAt).toLocaleDateString('vi-VN')}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Main Area: Chat Interface */}
            <div className={`flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-0 ${!activeConv ? 'hidden lg:flex items-center justify-center' : ''}`}>

                {!activeConv ? (
                    <div className="text-center p-8 max-w-sm">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mic className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Sẵn sàng thu âm?</h2>
                        <p className="text-slate-500 leading-relaxed">
                            Chọn một chủ đề bên trái để bắt đầu luyện phản xạ giao tiếp tiếng Anh ngay bây giờ.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md rounded-t-2xl z-10">
                            <div>
                                <h2 className="font-bold text-slate-800">{activeConv.topic || 'Roleplay Chat'}</h2>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> AI Mentor Đang trực tuyến
                                </span>
                            </div>

                            <div className="flex gap-2">
                                {activeConv.fluencyScore > 0 && (
                                    <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-200 text-sm font-bold shadow-sm">
                                        <Award className="w-4 h-4" /> Điểm: {activeConv.fluencyScore}
                                    </div>
                                )}
                                <button
                                    onClick={() => handleEvaluate(activeConv.id)}
                                    disabled={evaluating || messages.length < 2}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                                >
                                    {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                                    Phân tích
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
                            {messages.map((msg, i) => {
                                const isUser = msg.sender === 'USER';
                                return (
                                    <div key={msg.id || i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                        <div className={`max-w-[85%] sm:max-w-[70%] flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {/* Avatar */}
                                            <div className="shrink-0">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${isUser ? 'bg-indigo-500' : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                                                    }`}>
                                                    {isUser ? 'You' : 'AI'}
                                                </div>
                                            </div>

                                            {/* Bubble */}
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-[10px] uppercase tracking-wider font-bold ${isUser ? 'text-right text-indigo-400' : 'text-left text-teal-500'}`}>
                                                    {isUser ? 'Học viên' : 'AI Mentor'}
                                                </span>
                                                <div className={`p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed relative ${isUser
                                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                                    }`}>
                                                    {msg.content}

                                                    {isUser && msg.score && (
                                                        <div className="mt-2 pt-2 border-t border-white/20 text-xs text-indigo-100 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Phát âm/Ngữ pháp: tốt
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {isSending && (
                                <div className="flex justify-start animate-pulse">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
                                        <div className="bg-slate-200 h-10 w-16 rounded-2xl rounded-tl-none"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-100 bg-white">
                            {/* Feedback Panel */}
                            {activeConv.fluencyScore > 0 && activeConv.grammarFeedback && (
                                <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm">
                                    <h4 className="font-bold text-indigo-800 mb-1 flex items-center gap-1">
                                        <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" /> Nhận xét tổng quan
                                    </h4>
                                    <p className="text-slate-700 whitespace-pre-wrap">{activeConv.grammarFeedback}</p>
                                </div>
                            )}

                            <form onSubmit={sendMessage} className="relative flex items-center gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={inputMsg}
                                        onChange={(e) => setInputMsg(e.target.value)}
                                        placeholder="Nhập tin nhắn..."
                                        disabled={isSending}
                                        className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all text-[15px]"
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleRecording}
                                        disabled={isSending}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isRecording
                                                ? 'bg-rose-100 text-rose-600 animate-pulse'
                                                : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        {isRecording ? <Square className="w-4 h-4 fill-rose-600" /> : <Mic className="w-5 h-5" />}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!inputMsg.trim() || isSending}
                                    className="shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-md shadow-indigo-200"
                                >
                                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                                </button>
                            </form>
                            {isRecording && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2">
                                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span> Đang nghe...
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SpeakingPractice;
