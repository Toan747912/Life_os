import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Mic, MicOff, X, Send, Loader2, Play, Settings, Save } from 'lucide-react';
import api from '../services/api';
import { playTextToSpeech } from '../utils/speech';

const RoleplayBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello there! I am your AI practice partner. How can I help you practice your English today?' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [persona, setPersona] = useState('A helpful native English friend having a casual conversation. Be concise.');
    const [isEditingPersona, setIsEditingPersona] = useState(false);

    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    // Bật tắt SpeechRecognition
    useEffect(() => {
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
                    setInputText(prev => prev + finalTranscript + ' ');
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setInputText(''); // Xóa text cũ khi bắt đầu nói câu mới
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    // Text to Speech
    const speakText = (text) => {
        playTextToSpeech(text, 1.0);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const newUserMessage = { role: 'user', content: inputText.trim() };
        const newMessages = [...messages, newUserMessage];

        setMessages(newMessages);
        setInputText('');
        setIsLoading(true);

        try {
            // Chỉ gửi nội dung chat, formated cho AI
            const contextMsg = newMessages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await api.post('/learning/chat', {
                messages: contextMsg,
                context: persona
            });

            const replyText = response.data.data;
            setMessages([...newMessages, { role: 'assistant', content: replyText }]);

            // Tự động phát âm thanh câu trả lời
            speakText(replyText);

        } catch (error) {
            console.error("Chat error:", error);
            setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I hit a snag. Please try again!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-80 sm:w-96 h-[500px] flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <MessageSquare size={16} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">AI Practice Partner</h3>
                                <p className="text-indigo-200 text-xs">Roleplay & Speaking</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsEditingPersona(!isEditingPersona)} className="text-white/80 hover:text-white transition p-1" title="Customize Persona">
                                <Settings size={18} />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition p-1">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Persona Editor */}
                    {isEditingPersona && (
                        <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex flex-col gap-2 shadow-inner relative animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-bold text-indigo-800 uppercase tracking-widest">Bot Persona Setup</label>
                            </div>
                            <textarea
                                value={persona}
                                onChange={(e) => setPersona(e.target.value)}
                                className="w-full text-sm p-3 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 bg-white shadow-sm resize-none"
                                rows={3}
                                placeholder="E.g., You are my Tech Lead. Interview me about System Design in 2 concise sentences."
                            />
                            <div className="flex justify-end mt-1">
                                <button
                                    onClick={() => {
                                        setIsEditingPersona(false);
                                        // Optional: Clear chat when changing persona
                                        // setMessages([{ role: 'assistant', content: 'Persona updated! How can we proceed?' }]);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow hover:bg-indigo-700 transition"
                                >
                                    <Save size={14} /> Save Persona
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                                    }`}>
                                    {msg.content}
                                    {msg.role === 'assistant' && (
                                        <button
                                            onClick={() => speakText(msg.content)}
                                            className="ml-2 mt-1 block text-indigo-400 hover:text-indigo-600"
                                        >
                                            <Play size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-sm p-3 shadow-sm flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin" /> Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleListening}
                                className={`p-3 rounded-full flex-shrink-0 transition-colors ${isListening
                                    ? 'bg-rose-100 text-rose-600 animate-pulse'
                                    : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
                                    }`}
                                title={isListening ? "Stop listening" : "Start speaking"}
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>

                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type or speak..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                disabled={isLoading}
                            />

                            <button
                                onClick={handleSendMessage}
                                disabled={!inputText.trim() || isLoading}
                                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        {isListening && <p className="text-xs text-rose-500 text-center">Listening... Speak now</p>}
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center transform hover:scale-105 group"
                >
                    <MessageSquare size={24} className="group-hover:animate-pulse" />
                </button>
            )}
        </div>
    );
};

export default RoleplayBot;
