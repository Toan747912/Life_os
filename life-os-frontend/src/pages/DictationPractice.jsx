import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { dictationApi } from '../services/api';
import { calculateLevenshtein, getAccuracyBadge } from '../components/dictation/DictationHelpers';
import SpeechInput from '../components/dictation/SpeechInput';

const getFullMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;

    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

    // Ensure baseUrl has a trailing slash and url doesn't have a leading slash
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;

    // Convert to array of parts, encode each part, then join
    // This correctly handles spaces (%20) while preserving slashes (/)
    const encodedPath = cleanUrl.split('/').map(part => encodeURIComponent(part)).join('/');

    // Remove any unintended double slashes (except in http://)
    const finalUrl = `${cleanBaseUrl}${encodedPath}`.replace(/([^:]\/)\/+/g, "$1");

    return finalUrl;
};

const DictationPractice = () => {
    const { id: dictationId } = useParams();
    // States
    const [dictation, setDictation] = useState(null);
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [showHint, setShowHint] = useState(false);
    const [showOriginal, setShowOriginal] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [results, setResults] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [loading, setLoading] = useState(true);

    const playerRef = useRef(null);
    const inputRef = useRef(null);

    // Load dictation data
    useEffect(() => {
        loadDictation();
    }, [dictationId]);

    // Set start time when user starts typing
    useEffect(() => {
        if (userInput && !startTime) {
            setStartTime(Date.now());
        }
    }, [userInput]);

    const loadDictation = async () => {
        try {
            setLoading(true);
            const response = await dictationApi.getById(dictationId);
            setDictation(response.data);
        } catch (error) {
            console.error('Error loading dictation:', error);
        } finally {
            setLoading(false);
        }
    };

    // Parse sentences from JSON
    const sentences = dictation
        ? (typeof dictation.sentences === 'string' ? JSON.parse(dictation.sentences) : dictation.sentences)
        : [];
    const currentSentence = sentences[currentSentenceIndex];

    const replaySentence = useCallback(() => {
        if (currentSentence && playerRef.current) {
            playerRef.current.currentTime = currentSentence.startTime;
            playerRef.current.play().catch(e => console.error("Play error:", e));
        }
    }, [currentSentence]);

    // Handle sentence change - auto seek player and play
    useEffect(() => {
        replaySentence();
    }, [currentSentenceIndex, replaySentence]);

    // Handle time update to pause at the end of the sentence
    const handleTimeUpdate = () => {
        if (!currentSentence || !playerRef.current) return;

        if (playerRef.current.currentTime >= currentSentence.endTime && !playerRef.current.paused) {
            playerRef.current.pause();
        }
    };

    // Submit handler
    const handleSubmit = async () => {
        const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

        try {
            const response = await dictationApi.submit(dictationId, {
                userAnswer: userInput,
                timeSpent
            });

            setResults(response.data);
        } catch (error) {
            console.error('Error submitting:', error);
        }
    };

    // Reset handler
    const handleReset = () => {
        setUserInput('');
        setResults(null);
        setShowHint(false);
        setShowOriginal(false);
        setCurrentSentenceIndex(0);
        setStartTime(null);
        if (playerRef.current && sentences?.[0]) {
            playerRef.current.currentTime = sentences[0].startTime;
            playerRef.current.play().catch(e => console.error("Play error:", e));
        }
        inputRef.current?.focus();
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+M: Toggle microphone
            if (e.ctrlKey && (e.key === 'm' || e.key === 'M')) {
                e.preventDefault();
                setIsRecording(prev => !prev);
            }
            // Ctrl+Enter: Submit
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
            }
            // Ctrl+Space: Replay current sentence
            if (e.ctrlKey && e.key === ' ') {
                e.preventDefault();
                replaySentence();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [userInput, currentSentence, replaySentence]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!dictation) {
        return <div className="text-center p-8">Không tìm thấy bài Dictation</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{dictation.title}</h1>
                <div className="flex items-center gap-4 mt-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {dictation.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {dictation.language}
                    </span>
                    <span className="text-gray-500 text-sm">
                        {sentences.length} câu
                    </span>
                </div>
            </div>

            {/* Player Section */}
            <div className="bg-gray-900 rounded-xl p-4 mb-6">
                <div className="text-xs text-red-500 mb-2 truncate">URL: {getFullMediaUrl(dictation.audioUrl)}</div>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                    <video
                        ref={playerRef}
                        src={getFullMediaUrl(dictation.audioUrl)}
                        controls
                        className="w-full h-full object-contain"
                        preload="auto"
                        onTimeUpdate={handleTimeUpdate}
                        onError={(e) => console.error("Native Video Error:", e.target.error, getFullMediaUrl(dictation.audioUrl))}
                    >
                        Your browser does not support HTML video.
                    </video>
                </div>
            </div>

            {/* Sentence Progress */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    {sentences.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSentenceIndex(index)}
                            className={`w-8 h-8 rounded-full text-sm font-medium transition ${index === currentSentenceIndex
                                ? 'bg-blue-600 text-white'
                                : index < currentSentenceIndex
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
                <p className="text-sm text-gray-500">
                    Câu hiện tại: {currentSentenceIndex + 1} / {sentences.length}
                </p>
            </div>

            {/* Input Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Nhập nội dung bạn nghe được
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={replaySentence}
                            className="px-3 py-1 rounded-lg text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition border border-blue-300 flex items-center gap-1"
                            title="Có thể dùng phím tắt Ctrl + Space"
                        >
                            ▶️ Nghe lại câu này
                        </button>
                        <button
                            onClick={() => setShowHint(!showHint)}
                            className={`px-3 py-1 rounded-lg text-sm transition flex items-center gap-1 ${showHint
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            💡 Gợi ý
                        </button>
                        <button
                            onClick={() => setShowOriginal(!showOriginal)}
                            className={`px-3 py-1 rounded-lg text-sm transition flex items-center gap-1 ${showOriginal
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            📖 Transcript
                        </button>
                    </div>
                </div>

                {/* Hint Display */}
                {showHint && currentSentence && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>Gợi ý:</strong> {currentSentence.text.substring(0, 2)}...
                        </p>
                    </div>
                )}

                {/* Original Transcript */}
                {showOriginal && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                            <strong>Transcript:</strong> {dictation.transcript}
                        </p>
                    </div>
                )}

                {/* Speech Input */}
                <div className="mb-4">
                    <SpeechInput
                        isRecording={isRecording}
                        setIsRecording={setIsRecording}
                        onTranscript={(text) => setUserInput(text)}
                        language={dictation.language}
                    />
                </div>

                {/* Text Input */}
                <textarea
                    ref={inputRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Nhập nội dung bạn nghe được..."
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                        {userInput.length} ký tự
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReset}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                        >
                            🔄 Làm lại
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!userInput.trim()}
                            className={`px-6 py-2 rounded-lg font-medium transition ${userInput.trim()
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            📝 Nộp bài
                        </button>
                    </div>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        <strong>Phím tắt:</strong> Ctrl+Space (▶️ Nghe lại) | Ctrl+M (🎤 Micro) | Ctrl+Enter (📤 Nộp bài)
                    </p>
                </div>
            </div>

            {/* Results Section */}
            {
                results && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">📊 Kết Quả</h2>
                            {getAccuracyBadge(results.analysis.accuracy)}
                        </div>

                        {/* Score Display */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 bg-blue-50 rounded-xl">
                                <p className="text-3xl font-bold text-blue-600">{results.analysis.score}</p>
                                <p className="text-sm text-gray-600">Điểm tổng</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-xl">
                                <p className="text-3xl font-bold text-green-600">
                                    {results.analysis.accuracy.toFixed(1)}%
                                </p>
                                <p className="text-sm text-gray-600">Độ chính xác</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-xl">
                                <p className="text-3xl font-bold text-purple-600">
                                    {results.analysis.distance}
                                </p>
                                <p className="text-sm text-gray-600">Số lỗi</p>
                            </div>
                        </div>

                        {/* Wrong Words Analysis */}
                        {results.analysis.wrongWords.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                    ❌ Từ/cụm từ sai
                                </h3>
                                <div className="space-y-2">
                                    {results.analysis.wrongWords.map((word, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 bg-red-50 rounded-lg"
                                        >
                                            <span className="px-2 py-1 bg-red-200 text-red-700 rounded text-sm font-mono">
                                                {word.got}
                                            </span>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                            <span className="px-2 py-1 bg-green-200 text-green-700 rounded text-sm font-mono">
                                                {word.expected}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Correct Transcript */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                ✅ Transcript chuẩn
                            </h3>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-700 leading-relaxed">
                                    {results.correctTranscript}
                                </p>
                            </div>
                        </div>

                        {/* Comparison */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                📝 So sánh
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-500 mb-2">Của bạn:</p>
                                    <p className="text-gray-700">{results.attempt.userAnswer || '(Chưa nhập)'}</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-xl">
                                    <p className="text-sm text-gray-500 mb-2">Chuẩn:</p>
                                    <p className="text-gray-700">{results.correctTranscript}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default DictationPractice;