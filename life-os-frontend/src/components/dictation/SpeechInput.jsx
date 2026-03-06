import React, { useEffect, useRef, useState } from 'react';

/**
 * Component SpeechInput - Nhập liệu bằng giọng nói
 * Sử dụng Web Speech API
 */
const SpeechInput = ({
    isRecording,
    setIsRecording,
    onTranscript,
    language = 'en',
    placeholder = 'Hoặc nói vào micro...'
}) => {
    const recognitionRef = useRef(null);
    const [isSupported, setIsSupported] = useState(true);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const silenceTimeoutRef = useRef(null);

    const resetSilenceTimeout = () => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
        }
        if (isRecording) {
            silenceTimeoutRef.current = setTimeout(() => {
                setIsRecording(false);
            }, 5000);
        }
    };

    // Khởi tạo Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setIsSupported(false);
            setError('Trình duyệt không hỗ trợ nhận diện giọng nói');
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = getLanguageCode(language);

        // Xử lý khi nhận được kết quả
        recognitionRef.current.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const fullTranscript = (transcript + ' ' + finalTranscript).trim();
            setTranscript(fullTranscript);
            onTranscript(fullTranscript);

            // Reset the silence timeout whenever we hear something
            resetSilenceTimeout();
        };

        // Xử lý lỗi
        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);

            if (event.error === 'not-allowed') {
                setError('Vui lòng cho phép truy cập micro');
                setIsRecording(false);
            } else if (event.error === 'no-speech') {
                // Không phải lỗi nghiêm trọng, tiếp tục chờ
                console.log('No speech detected, continuing...');
            } else {
                setError(`Lỗi nhận diện giọng nói: ${event.error}`);
                setIsRecording(false);
            }
        };

        // Xử lý khi kết thúc
        recognitionRef.current.onend = () => {
            if (isRecording) {
                // Tiếp tục recording nếu vẫn đang bật
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    // Có thể đã đang chạy
                }
            }
        };

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [language, onTranscript]);

    // Toggle recording
    useEffect(() => {
        if (!recognitionRef.current || !isSupported) return;

        if (isRecording) {
            try {
                recognitionRef.current.start();
                setError(null);
                resetSilenceTimeout();
            } catch (e) {
                console.error('Error starting recognition:', e);
                // Có thể đã đang chạy
                if (e.name === 'InvalidStateError') {
                    recognitionRef.current.stop();
                    setTimeout(() => {
                        recognitionRef.current?.start();
                        resetSilenceTimeout();
                    }, 100);
                }
            }
        } else {
            recognitionRef.current?.stop();
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
            }
        }

        return () => {
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        };
    }, [isRecording, isSupported]);

    // Cập nhật language khi thay đổi
    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = getLanguageCode(language);
        }
    }, [language]);

    const getLanguageCode = (lang) => {
        const codes = {
            en: 'en-US',
            vi: 'vi-VN',
            ja: 'ja-JP',
            ko: 'ko-KR',
            zh: 'zh-CN',
            fr: 'fr-FR',
            de: 'de-DE',
            es: 'es-ES'
        };
        return codes[lang] || 'en-US';
    };

    const handleClear = () => {
        setTranscript('');
        onTranscript('');
    };

    if (!isSupported) {
        return (
            <div className="text-slate-400 text-sm italic font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                Trình duyệt không hỗ trợ nhập bằng giọng nói
            </div>
        );
    }

    return (
        <div className="relative">
            {error && (
                <div className="mb-3 p-3 bg-rose-50/80 backdrop-blur-sm border border-rose-100 text-rose-600 text-sm rounded-xl flex items-center gap-2 shadow-sm font-medium">
                    <svg xmlns="http://www.w3.org/0000.svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {error}
                </div>
            )}

            <div className="flex items-center gap-3 relative">
                <button
                    type="button"
                    onClick={() => setIsRecording(!isRecording)}
                    className={`p-3.5 rounded-full transition-all duration-300 ${isRecording
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse-slow'
                        : 'bg-white border-2 border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 shadow-sm'
                        }`}
                    title={isRecording ? 'Tắt micro' : 'Bật micro'}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0          24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                    </svg>
                </button>

                <div className="flex-1">
                    <input
                        type="text"
                        value={transcript}
                        readOnly
                        placeholder={placeholder}
                        className="w-full px-5 py-3.5 bg-white/60 backdrop-blur-md border border-slate-200/80 rounded-2xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-medium"
                    />
                </div>

                {transcript && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Xóa"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {isRecording && (
                <div className="mt-3 flex items-center gap-2.5 text-sm text-rose-500 font-bold bg-rose-50/50 inline-flex px-3 py-1.5 rounded-full border border-rose-100/50">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                    <span>Đang nghe... Hãy nói nội dung bạn nghe được</span>
                </div>
            )}
        </div>
    );
};

export default SpeechInput;