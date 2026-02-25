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
            } catch (e) {
                console.error('Error starting recognition:', e);
                // Có thể đã đang chạy
                if (e.name === 'InvalidStateError') {
                    recognitionRef.current.stop();
                    setTimeout(() => {
                        recognitionRef.current?.start();
                    }, 100);
                }
            }
        } else {
            recognitionRef.current?.stop();
        }
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
            <div className="text-gray-400 text-sm italic">
                ⚠️ Trình duyệt không hỗ trợ nhập bằng giọng nói
            </div>
        );
    }

    return (
        <div className="relative">
            {error && (
                <div className="mb-2 p-2 bg-red-50 text-red-600 text-sm rounded-lg">
                    {error}
                </div>
            )}

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setIsRecording(!isRecording)}
                    className={`p-3 rounded-full transition-all ${isRecording
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
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
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 focus:outline-none"
                    />
                </div>

                {transcript && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-2 text-gray-400 hover:text-gray-600 transition"
                        title="Xóa"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {isRecording && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span>Đang nghe... Hãy nói nội dung bạn nghe được</span>
                </div>
            )}
        </div>
    );
};

export default SpeechInput;