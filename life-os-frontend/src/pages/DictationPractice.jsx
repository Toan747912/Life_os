import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DictationSettingsModal from '../components/dictation/DictationSettingsModal';

import { useDictationData } from '../hooks/useDictationData';
import { useDictationSettings } from '../hooks/useDictationSettings';
import { useDictationProgress } from '../hooks/useDictationProgress';

import VideoPlayerSection from '../components/dictation/VideoPlayerSection';
import DictationTab from '../components/dictation/DictationTab';
import LearningTab from '../components/dictation/LearningTab';
import DictationSummary from '../components/dictation/DictationSummary';
import FixedDictionary from '../components/dictation/FixedDictionary';

import { calculateLevenshtein, analyzeWrongWords } from '../components/dictation/DictationHelpers';

const DictationPractice = () => {
    const { id: dictationId } = useParams();

    // 1. Data Hook
    const {
        dictation, loading, sentences, blankConfigs,
        cleanAudioUrl, isYouTubeUrl, getFullMediaUrl
    } = useDictationData(dictationId);

    // 2. Settings Hook
    const { settings, setSettings } = useDictationSettings();

    // 3. Progress Hook
    const {
        currentSentenceIndex, setCurrentSentenceIndex,
        sentenceResults, userInput, currentResult,
        isSentenceCompleted, currentSentence,
        handleUserInputChange, submitAttempt, handleReset
    } = useDictationProgress(dictationId, dictation, sentences);

    // Tabs & Pagination
    const [activeTab, setActiveTab] = useState('dictation');
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [currentPageDictation, setCurrentPageDictation] = useState(1);
    const [currentPageLearning, setCurrentPageLearning] = useState(1);

    // Learning / Blanks States
    const [selectedWord, setSelectedWord] = useState(null);
    const [isLooping, setIsLooping] = useState(false);
    const [blankAnswers, setBlankAnswers] = useState({});
    const [showBlankHints, setShowBlankHints] = useState({});
    const [shadowingIndex, setShadowingIndex] = useState(null);
    const [shadowScores, setShadowScores] = useState({});
    const [isShadowRecording, setIsShadowRecording] = useState(false);
    const [shadowTranscript, setShadowTranscript] = useState('');

    // Dictation UI States
    const [showHint, setShowHint] = useState(false);
    const [revealedChars, setRevealedChars] = useState(0);
    const [showOriginal, setShowOriginal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [startTime, setStartTime] = useState(null);

    // Player States
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    // Refs
    const playerRef = useRef(null);
    const inputRef = useRef(null);
    const resultsRef = useRef(null);
    const sentenceListRef = useRef(null);
    const replayCountRef = useRef(0);
    const replayTimeoutRef = useRef(null);
    const isWaitingNextSentenceRef = useRef(false);

    // Derived pagination
    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(sentences.length / itemsPerPage);
    const currentSentencesDictation = itemsPerPage === 'all'
        ? sentences
        : sentences.slice((currentPageDictation - 1) * itemsPerPage, currentPageDictation * itemsPerPage);
    const currentSentencesLearning = itemsPerPage === 'all'
        ? sentences
        : sentences.slice((currentPageLearning - 1) * itemsPerPage, currentPageLearning * itemsPerPage);

    // Set startTime when typing starts
    useEffect(() => {
        if (userInput && !startTime && !isSentenceCompleted) {
            setStartTime(Date.now());
        }
    }, [userInput, startTime, isSentenceCompleted]);

    // Apply strict "show" settings
    useEffect(() => {
        if (settings.alwaysShowOriginal) setShowOriginal(true);
        if (settings.alwaysShowHint) {
            setShowHint(true);
            if (revealedChars === 0) setRevealedChars(1);
        }
    }, [settings, revealedChars]);

    // Auto scroll learning / blanks tab
    useEffect(() => {
        if ((activeTab === 'learning' || activeTab === 'blanks') && sentenceListRef.current) {
            const activeElement = sentenceListRef.current.querySelector(`[data-index="${currentSentenceIndex}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        if (sentences.length > 0 && itemsPerPage !== 'all') {
            const targetPage = Math.floor(currentSentenceIndex / itemsPerPage) + 1;
            setCurrentPageLearning(targetPage);
            setCurrentPageDictation(targetPage);
        }
    }, [currentSentenceIndex, activeTab, itemsPerPage, sentences.length]);

    // Keyboard shortcuts moved down

    const replaySentence = useCallback((e, explicitSentence = null) => {
        const sentenceToPlay = explicitSentence || currentSentence;
        if (replayTimeoutRef.current) {
            clearTimeout(replayTimeoutRef.current);
            replayTimeoutRef.current = null;
        }

        if (sentenceToPlay && playerRef.current) {
            setHasStarted(true);
            if (isYouTubeUrl) {
                if (isPlayerReady || playerRef.current?.getInternalPlayer()?.playVideo) {
                    playerRef.current.seekTo(sentenceToPlay.startTime, 'seconds');
                    playerRef.current.getInternalPlayer()?.playVideo?.();
                    setIsPlaying(true);
                }
            } else {
                playerRef.current.currentTime = sentenceToPlay.startTime;
                playerRef.current.play().catch(err => console.error(err));
                setIsPlaying(true);
            }
        }
    }, [currentSentence, isYouTubeUrl, isPlayerReady]);

    // Handle auto play moved down

    const handleNextSentence = () => {
        if (currentSentenceIndex < sentences.length - 1) {
            setCurrentSentenceIndex(prev => prev + 1);
            setStartTime(null);
            setRevealedChars(0);
            setShowHint(false);
            setShowOriginal(false);
            setHasStarted(true);
        } else {
            setShowSummary(true);
        }
    };

    const handleProgressCheck = (time) => {
        if (activeTab === 'blanks' && currentSentence) {
            const hasUnsolvedBlanks = blankConfigs[currentSentenceIndex]?.some(wIdx => {
                const clean = currentSentence.text.split(' ')[wIdx].replace(/[.,!?"'`;:()[\]{}]/g, '').toLowerCase();
                const ans = blankAnswers[currentSentenceIndex]?.[wIdx] || '';
                return ans.toLowerCase() !== clean;
            });

            if (time >= currentSentence.endTime && hasUnsolvedBlanks) {
                if (isYouTubeUrl && playerRef.current?.getInternalPlayer()?.pauseVideo) {
                    playerRef.current.getInternalPlayer().pauseVideo();
                    playerRef.current.seekTo(currentSentence.endTime - 0.5, 'seconds');
                } else if (!isYouTubeUrl && playerRef.current) {
                    playerRef.current.pause();
                    playerRef.current.currentTime = currentSentence.endTime - 0.5;
                }
                setIsPlaying(false);
                return;
            }
        }

        if ((activeTab === 'learning' || activeTab === 'blanks') && sentences.length > 0) {
            if (isLooping && currentSentence) {
                if (time >= currentSentence.endTime) {
                    if (isYouTubeUrl && playerRef.current) playerRef.current.seekTo(currentSentence.startTime, 'seconds');
                    else if (!isYouTubeUrl && playerRef.current) playerRef.current.currentTime = currentSentence.startTime;
                    return;
                }
            }

            if (!isLooping && settings.continuousPlayback && currentSentence) {
                if (time >= currentSentence.endTime && !isWaitingNextSentenceRef.current) {
                    if (currentSentenceIndex < sentences.length - 1) {
                        setIsPlaying(false);
                        if (isYouTubeUrl && playerRef.current?.getInternalPlayer()?.pauseVideo) {
                            playerRef.current.getInternalPlayer().pauseVideo();
                        } else if (!isYouTubeUrl && playerRef.current) {
                            playerRef.current.pause();
                        }
                        isWaitingNextSentenceRef.current = true;
                        if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);
                        replayTimeoutRef.current = setTimeout(() => {
                            isWaitingNextSentenceRef.current = false;
                            handleNextSentence();
                        }, (settings.continuousDelay || 0) * 1000);
                        return;
                    }
                }
            }

            const activeIndex = sentences.findIndex(s => time >= s.startTime && time <= s.endTime);
            if (activeIndex !== -1 && activeIndex !== currentSentenceIndex && !isWaitingNextSentenceRef.current) {
                setCurrentSentenceIndex(activeIndex);
            }
        }

        if (!currentSentence) return;

        if (activeTab === 'dictation') {
            if (time >= currentSentence.endTime && isPlaying) {
                setIsPlaying(false);

                if (isYouTubeUrl && playerRef.current?.getInternalPlayer()?.pauseVideo) {
                    playerRef.current.getInternalPlayer().pauseVideo();
                } else if (!isYouTubeUrl && playerRef.current) {
                    playerRef.current.pause();
                }

                if (settings.autoReplay !== "0" && !isSentenceCompleted) {
                    const maxReplays = settings.autoReplay === "Infinity" ? Infinity : parseInt(settings.autoReplay);
                    if (replayCountRef.current < maxReplays) {
                        replayCountRef.current += 1;
                        if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);

                        replayTimeoutRef.current = setTimeout(() => {
                            if (isYouTubeUrl && playerRef.current) {
                                playerRef.current.seekTo(currentSentence.startTime, 'seconds');
                                playerRef.current.getInternalPlayer()?.playVideo?.();
                            } else if (!isYouTubeUrl && playerRef.current) {
                                playerRef.current.currentTime = currentSentence.startTime;
                                playerRef.current.play().catch(e => console.error(e));
                            }
                            setIsPlaying(true);
                        }, settings.replayDelay * 1000);
                        return;
                    }
                }

                if (settings.continuousPlayback && currentSentenceIndex < sentences.length - 1) {
                    if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);
                    replayTimeoutRef.current = setTimeout(() => {
                        handleNextSentence();
                    }, (settings.continuousDelay || 0) * 1000);
                }
            }
        }
    };

    const handleTimeUpdate = () => {
        if (!currentSentence || !playerRef.current || isYouTubeUrl) return;
        handleProgressCheck(playerRef.current.currentTime);
    };

    const triggerSubmit = async () => {
        setIsSubmitting(true);
        const spent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

        if (isPlaying || settings.autoReplay !== "0") {
            setIsPlaying(false);
            if (isYouTubeUrl && playerRef.current?.getInternalPlayer()?.pauseVideo) {
                playerRef.current.getInternalPlayer().pauseVideo();
            } else if (!isYouTubeUrl && playerRef.current) {
                playerRef.current.pause();
            }
            if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);
        }

        await submitAttempt(spent);

        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
        setIsSubmitting(false);
    };

    // Auto Check moved down


    const triggerReset = () => {
        handleReset();
        if (!settings.alwaysShowHint) {
            setShowHint(false);
            setRevealedChars(0);
        }
        if (!settings.alwaysShowOriginal) setShowOriginal(false);
        setStartTime(Date.now());
        replayCountRef.current = 0;
        replaySentence();
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleWordClick = (word, e) => {
        e.stopPropagation();
        setSelectedWord(word);
    };

    const triggerShowHint = (isAuto = false) => {
        setShowHint(true);
        if (currentSentence) {
            const rawLength = currentSentence.text.replace(/[^a-zA-Z0-9]/g, '').length;
            if (isAuto && settings.alwaysShowHint) {
                if (revealedChars === 0) setRevealedChars(1);
            } else if (revealedChars < rawLength) {
                setRevealedChars(prev => prev + 2);
            }
        }
    };

    const generateHintText = () => {
        if (!currentSentence) return '';
        const text = currentSentence.text;
        let revealedCount = 0;
        return text.split('').map((char) => {
            if (char === ' ' || /[.,!?]/.test(char)) return char;
            if (revealedCount < revealedChars) {
                revealedCount++;
                return char;
            }
            return '_';
        }).join(' ');
    };

    const handleShadowSubmit = (index) => {
        if (!shadowTranscript.trim()) return;
        const originalText = sentences[index].text;
        const levenshteinResult = calculateLevenshtein(shadowTranscript, originalText);
        const wrongWords = analyzeWrongWords(shadowTranscript, originalText);
        setShadowScores(prev => ({
            ...prev,
            [index]: { attempt: shadowTranscript, accuracy: levenshteinResult.accuracy, score: levenshteinResult.score, wrongWords }
        }));
        setShadowingIndex(null);
        setShadowTranscript('');
    };

    const getSentenceColor = (index) => {
        const res = sentenceResults[index];
        if (!res) {
            return index === currentSentenceIndex
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 transform scale-110'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200';
        }
        const acc = res.analysis.accuracy;
        if (acc >= 90) return index === currentSentenceIndex ? 'bg-green-600 text-white shadow-md ring-2 ring-green-300 transform scale-110' : 'bg-green-500 text-white hover:bg-green-600';
        if (acc >= 50) return index === currentSentenceIndex ? 'bg-yellow-500 text-white shadow-md ring-2 ring-yellow-300 transform scale-110' : 'bg-yellow-400 text-white hover:bg-yellow-500';
        return index === currentSentenceIndex ? 'bg-red-500 text-white shadow-md ring-2 ring-red-300 transform scale-110' : 'bg-red-400 text-white hover:bg-red-500';
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isModifierPressed =
                (settings.replayKey === 'Ctrl' && e.ctrlKey) ||
                (settings.replayKey === 'Shift' && e.shiftKey) ||
                (settings.replayKey === 'Alt' && e.altKey);

            if (isModifierPressed && (e.key === 'm' || e.key === 'M')) {
                e.preventDefault();
                setIsRecording(prev => !prev);
            }
            if (isModifierPressed && e.key === 'Enter') {
                e.preventDefault();
                if (!isSentenceCompleted) triggerSubmit();
            }
            if (isModifierPressed && e.key === ' ') {
                e.preventDefault();
                setHasStarted(true);
                replayCountRef.current = 0;
                replaySentence();
            }
            if (isModifierPressed && e.key === 'ArrowRight') {
                e.preventDefault();
                if (isSentenceCompleted) handleNextSentence();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSentenceCompleted, settings.replayKey, userInput, handleNextSentence, replaySentence, triggerSubmit]); // Dependencies for triggerSubmit needed inside

    // Handle auto play on sentence change
    useEffect(() => {
        if (!showSummary && sentences.length > 0) {
            replayCountRef.current = 0;
            isWaitingNextSentenceRef.current = false;
            if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);

            if (hasStarted) {
                replaySentence();
            }

            if (!isSentenceCompleted) {
                setTimeout(() => inputRef.current?.focus(), 100);
            }

            if (settings.alwaysShowOriginal) setShowOriginal(true);
            else setShowOriginal(false);

            if (settings.alwaysShowHint) {
                setShowHint(true);
                setRevealedChars(1);
            } else {
                setShowHint(false);
                setRevealedChars(0);
            }
        }
    }, [currentSentenceIndex, showSummary, sentences.length, settings, hasStarted, isSentenceCompleted, replaySentence]); // Re-run when sentence changes

    // Auto Check
    useEffect(() => {
        if (!currentSentence || isSubmitting || isSentenceCompleted || !userInput) return;
        const cleanInput = userInput.trim().toLowerCase().replace(/[.,!?"'`;:()[\]{}]/g, '').replace(/\s+/g, ' ');
        const cleanCorrect = currentSentence.text.trim().toLowerCase().replace(/[.,!?"'`;:()[\]{}]/g, '').replace(/\s+/g, ' ');
        if (cleanInput === cleanCorrect && cleanInput.length > 0) {
            triggerSubmit();
        }
    }, [userInput, currentSentence, isSubmitting, isSentenceCompleted, triggerSubmit]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    if (!dictation) return <div className="text-center p-8">Không tìm thấy bài Dictation</div>;

    if (showSummary) {
        return <DictationSummary
            dictation={dictation}
            sentences={sentences}
            sentenceResults={sentenceResults}
            setShowSummary={setShowSummary}
            setCurrentSentenceIndex={setCurrentSentenceIndex}
            dictationId={dictationId}
        />;
    }

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{dictation.title}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">{dictation.difficulty}</span>
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">{dictation.language}</span>
                        <span className="text-gray-500 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
                            Đã Làm: <span className="text-gray-800">{Object.keys(sentenceResults).length}/{sentences.length}</span>
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setShowSettingsModal(true)}
                    className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow transition-all text-sm font-bold text-gray-700"
                >
                    <span>⚙️</span> Cài đặt
                </button>
            </div>

            {showSettingsModal && (
                <DictationSettingsModal
                    settings={settings}
                    setSettings={setSettings}
                    onClose={() => setShowSettingsModal(false)}
                />
            )}

            <div className="flex flex-col lg:flex-row-reverse gap-6 items-start">
                <div className={`w-full lg:w-[450px] shrink-0 lg:sticky lg:top-6 lg:z-10 flex flex-col gap-4 ${(activeTab === 'learning' || activeTab === 'blanks') ? 'lg:h-[calc(100vh-48px)]' : ''}`}>
                    <VideoPlayerSection
                        ref={playerRef}
                        dictation={dictation}
                        cleanAudioUrl={cleanAudioUrl}
                        isYouTubeUrl={isYouTubeUrl}
                        getFullMediaUrl={getFullMediaUrl}
                        isPlaying={isPlaying}
                        setIsPlaying={setIsPlaying}
                        playbackRate={playbackRate}
                        setPlaybackRate={setPlaybackRate}
                        activeTab={activeTab}
                        isLooping={isLooping}
                        setIsLooping={setIsLooping}
                        handleProgressCheck={handleProgressCheck}
                        handleTimeUpdate={handleTimeUpdate}
                        setIsPlayerReady={setIsPlayerReady}
                    />

                    {/* Fixed Dictionary Area */}
                    {(activeTab === 'learning' || activeTab === 'blanks') && (
                        <div className="flex-1 min-h-[300px] lg:min-h-0 overflow-hidden flex flex-col pb-6 lg:pb-0">
                            <FixedDictionary
                                word={selectedWord}
                                onClose={() => setSelectedWord(null)}
                            />
                        </div>
                    )}
                </div>

                <div className="flex-1 w-full lg:max-w-[calc(100%-474px)] space-y-6">
                    {/* Navigation Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => { setActiveTab('dictation'); setSelectedWord(null); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'dictation' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            ✍️ Chép chính tả
                        </button>
                        <button
                            onClick={() => { setActiveTab('blanks'); setSelectedWord(null); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'blanks' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            🧩 Điền từ khóa
                        </button>
                        <button
                            onClick={() => { setActiveTab('learning'); setSelectedWord(null); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'learning' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            📖 Học tương tác
                        </button>
                    </div>

                    {activeTab === 'dictation' ? (
                        <DictationTab
                            sentences={sentences}
                            currentSentenceIndex={currentSentenceIndex}
                            setCurrentSentenceIndex={setCurrentSentenceIndex}
                            itemsPerPage={itemsPerPage}
                            setItemsPerPage={setItemsPerPage}
                            currentPageDictation={currentPageDictation}
                            setCurrentPageDictation={setCurrentPageDictation}
                            totalPages={totalPages}
                            currentSentencesDictation={currentSentencesDictation}
                            getSentenceColor={getSentenceColor}
                            isSentenceCompleted={isSentenceCompleted}
                            userInput={userInput}
                            handleUserInputChange={handleUserInputChange}
                            handleShowHint={triggerShowHint}
                            showHint={showHint}
                            revealedChars={revealedChars}
                            generateHintText={generateHintText}
                            showOriginal={showOriginal}
                            setShowOriginal={setShowOriginal}
                            dictation={dictation}
                            isRecording={isRecording}
                            setIsRecording={setIsRecording}
                            inputRef={inputRef}
                            handleReset={triggerReset}
                            handleNextSentence={handleNextSentence}
                            submitAttempt={triggerSubmit}
                            isSubmitting={isSubmitting}
                            settings={settings}
                            currentResult={currentResult}
                            resultsRef={resultsRef}
                            setHasStarted={setHasStarted}
                            replaySentence={replaySentence}
                        />
                    ) : (
                        <LearningTab
                            itemsPerPage={itemsPerPage}
                            setItemsPerPage={setItemsPerPage}
                            setCurrentPageDictation={setCurrentPageDictation}
                            setCurrentPageLearning={setCurrentPageLearning}
                            currentSentencesLearning={currentSentencesLearning}
                            currentPageLearning={currentPageLearning}
                            totalPages={totalPages}
                            currentSentenceIndex={currentSentenceIndex}
                            setCurrentSentenceIndex={setCurrentSentenceIndex}
                            setHasStarted={setHasStarted}
                            replaySentence={replaySentence}
                            activeTab={activeTab}
                            blankConfigs={blankConfigs}
                            blankAnswers={blankAnswers}
                            setBlankAnswers={setBlankAnswers}
                            showBlankHints={showBlankHints}
                            setShowBlankHints={setShowBlankHints}
                            isPlaying={isPlaying}
                            setIsPlaying={setIsPlaying}
                            playerRef={playerRef}
                            isYouTubeUrl={isYouTubeUrl}
                            handleWordClick={handleWordClick}
                            sentenceListRef={sentenceListRef}
                            shadowScores={shadowScores}
                            shadowingIndex={shadowingIndex}
                            setShadowingIndex={setShadowingIndex}
                            isShadowRecording={isShadowRecording}
                            setIsShadowRecording={setIsShadowRecording}
                            shadowTranscript={shadowTranscript}
                            setShadowTranscript={setShadowTranscript}
                            handleShadowSubmit={handleShadowSubmit}
                            dictation={dictation}
                            settings={settings}
                            selectedWord={selectedWord}
                            setSelectedWord={setSelectedWord}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DictationPractice;