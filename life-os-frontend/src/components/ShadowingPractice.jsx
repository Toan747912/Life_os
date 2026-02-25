import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, X, StopCircle } from 'lucide-react';
import { activityService } from '../services/api';
import { playTextToSpeech } from '../utils/speech';

const ShadowingPractice = ({ targetText, targetIpa, isOpen, onClose }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Handle prefix for different browsers
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Force English recognition for language learning

        recognition.onresult = (event) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }
            // Add a leading space to make matching slightly easier if needed
            setTranscript(currentTranscript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const toggleRecording = () => {
        if (!isSupported) return;

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
            if (transcript && transcript.split(' ').length > 2) {
                activityService.log('PRACTICE_SHADOWING').catch(e => console.error(e));
            }
        } else {
            setTranscript('');
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (error) {
                console.error("Microphone start error:", error);
            }
        }
    };

    const playAudio = () => {
        if (!targetText) return;
        playTextToSpeech(targetText, 0.85);
    };

    const compareText = () => {
        if (!transcript) return null;

        // Simple word matching algorithm
        // Remove punctuation and convert to lowercase
        const cleanText = (text) => text.toLowerCase().replace(/[.,!?;:()[\]{}"']/g, '');

        const targetWords = cleanText(targetText).split(/\s+/).filter(Boolean);
        const spokenWords = cleanText(transcript).split(/\s+/).filter(Boolean);

        if (spokenWords.length === 0) return null;

        // Visual representation of the target words, colored by whether they were spoken
        return targetWords.map((targetWord, index) => {
            // Find if this word was spoken anywhere
            const isMatch = spokenWords.includes(targetWord);

            return (
                <span
                    key={index}
                    className={`mr-1 font-medium ${isMatch ? 'text-emerald-500' : 'text-rose-500 line-through opacity-70'}`}
                >
                    {targetText.split(/\s+/)[index] || targetWord}
                </span>
            );
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={() => {
                        if (isRecording) {
                            recognitionRef.current?.stop();
                            setIsRecording(false);
                        }
                        if (window.speechSynthesis.speaking) {
                            window.speechSynthesis.cancel();
                        }
                        onClose();
                    }}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center space-y-6 mt-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Shadowing Practice</h2>
                        <p className="text-slate-500 text-sm mt-1">Listen carefully, then repeat clearly.</p>
                    </div>

                    <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 relative group">
                        <button
                            onClick={playAudio}
                            className="absolute top-3 right-3 p-3 text-indigo-500 hover:bg-indigo-100 rounded-full transition-colors"
                            title="Nghe mẫu (Listen)"
                        >
                            <Volume2 size={22} />
                        </button>
                        <p className="text-2xl font-semibold text-slate-900 pr-10 text-left">{targetText}</p>
                        {targetIpa && <p className="text-indigo-600 font-mono mt-3 text-sm text-left opacity-80">/{targetIpa}/</p>}
                    </div>

                    {!isSupported ? (
                        <div className="text-rose-500 p-4 bg-rose-50 rounded-xl text-sm border border-rose-100 text-left">
                            <span className="font-semibold">Lỗi:</span> Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Web Speech API). Vui lòng sử dụng Chrome, Edge hoặc Safari.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <button
                                onClick={toggleRecording}
                                className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${isRecording
                                    ? 'bg-rose-50 text-rose-600 border-2 border-rose-500 animate-pulse'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/50'
                                    }`}
                            >
                                {isRecording ? (
                                    <><StopCircle size={24} className="animate-spin-slow" /> Đang thu âm... (Stop)</>
                                ) : (
                                    <><Mic size={24} /> Bấm để đọc (Speak)</>
                                )}
                            </button>

                            <div className="min-h-[120px] p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left relative overflow-hidden">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Kết quả của bạn (Your Result):</p>
                                {transcript ? (
                                    <div className="space-y-3">
                                        <p className="text-xl leading-relaxed">{compareText()}</p>
                                        <div className="text-xs bg-white/60 p-2 rounded-lg text-slate-500 border border-slate-100">
                                            <span className="font-semibold">Raw:</span> {transcript}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 italic text-sm absolute inset-0 pt-8">
                                        {isRecording ? "Đang lắng nghe..." : "Giọng đọc của bạn sẽ hiện ở đây..."}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShadowingPractice;
