import { useState, useEffect } from 'react';
import { dictationApi } from '../services/api';
import { calculateLevenshtein, analyzeWrongWords } from '../components/dictation/DictationHelpers';

export const useDictationProgress = (dictationId, dictation, sentences) => {
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
    const [userInputs, setUserInputs] = useState({});
    const [sentenceResults, setSentenceResults] = useState({});

    // Check local storage for initial state
    useEffect(() => {
        if (!dictationId) return;
        const savedStr = localStorage.getItem(`dictation_${dictationId}`);
        if (savedStr) {
            try {
                const saved = JSON.parse(savedStr);
                if (saved.userInputs) setUserInputs(saved.userInputs);
                if (saved.sentenceResults) setSentenceResults(saved.sentenceResults);
                if (saved.currentSentenceIndex !== undefined) setCurrentSentenceIndex(saved.currentSentenceIndex);
            } catch (e) {
                console.error("Error parsing local storage", e);
            }
        }
    }, [dictationId]);

    // Save progress to local storage on change
    useEffect(() => {
        if (!dictationId) return;
        if (Object.keys(sentenceResults).length > 0 || Object.keys(userInputs).length > 0) {
            localStorage.setItem(`dictation_${dictationId}`, JSON.stringify({
                userInputs,
                sentenceResults,
                currentSentenceIndex
            }));
        }
    }, [userInputs, sentenceResults, currentSentenceIndex, dictationId]);

    // Handle user input changes
    const handleUserInputChange = (val) => {
        const isSentenceCompleted = !!sentenceResults[currentSentenceIndex];
        if (isSentenceCompleted) return;
        setUserInputs((prev) => ({ ...prev, [currentSentenceIndex]: val }));
    };

    // Derived values
    const userInput = userInputs[currentSentenceIndex] || '';
    const currentResult = sentenceResults[currentSentenceIndex];
    const isSentenceCompleted = !!currentResult;
    const currentSentence = sentences[currentSentenceIndex];

    const submitAttempt = async (timeSpent) => {
        if (!userInput.trim() || isSentenceCompleted) return null;

        const correctText = currentSentence ? currentSentence.text : dictation?.transcript || '';

        // Calculate metrics locally
        const levenshteinResult = calculateLevenshtein(userInput, correctText);
        const wrongWords = analyzeWrongWords(userInput, correctText);

        const localResults = {
            analysis: {
                ...levenshteinResult,
                wrongWords
            },
            correctTranscript: correctText,
            attempt: {
                userAnswer: userInput
            }
        };

        // Optimistic UI update
        setSentenceResults((prev) => ({ ...prev, [currentSentenceIndex]: localResults }));

        // Fire API request in background
        dictationApi.submit(dictationId, {
            userInput: userInput,
            originalText: correctText,
            timeSpent,
            accuracyScore: levenshteinResult.accuracy,
            levenshteinDist: levenshteinResult.distance,
            errorDetails: wrongWords
        }).catch(err => console.error("Error submitting attempt:", err));

        return localResults;
    };

    const handleReset = () => {
        setUserInputs((prev) => ({ ...prev, [currentSentenceIndex]: '' }));
        setSentenceResults((prev) => {
            const newRes = { ...prev };
            delete newRes[currentSentenceIndex];
            return newRes;
        });
    };

    return {
        currentSentenceIndex,
        setCurrentSentenceIndex,
        userInputs,
        sentenceResults,
        userInput,
        currentResult,
        isSentenceCompleted,
        currentSentence,
        handleUserInputChange,
        submitAttempt,
        handleReset,
        setUserInputs,
        setSentenceResults,
    };
};
