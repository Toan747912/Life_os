import { useState, useEffect } from 'react';
import { dictationApi } from '../services/api';

export const useDictationData = (dictationId) => {
    const [dictation, setDictation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sentences, setSentences] = useState([]);
    const [blankConfigs, setBlankConfigs] = useState({});

    useEffect(() => {
        const loadDictation = async () => {
            if (!dictationId) return;
            try {
                setLoading(true);
                const response = await dictationApi.getById(dictationId);
                const data = response.data;
                setDictation(data);

                const parsedSentences =
                    typeof data.sentences === 'string'
                        ? JSON.parse(data.sentences)
                        : data.sentences || [];
                setSentences(parsedSentences);

                // Generate blanks configuration based on vocabulary
                if (parsedSentences.length > 0) {
                    const vocab = Array.isArray(data.vocabulary)
                        ? data.vocabulary.map((v) => v.toLowerCase())
                        : [];
                    const newConfigs = {};
                    parsedSentences.forEach((s, sIdx) => {
                        const words = s.text.split(' ');
                        const indicesToBlank = [];
                        words.forEach((w, wIdx) => {
                            const clean = w.replace(/[.,!?"'`;:()[\]{}]/g, '').toLowerCase();
                            if (clean.length > 3 && vocab.includes(clean)) {
                                indicesToBlank.push(wIdx);
                            }
                        });
                        if (indicesToBlank.length === 0 && words.length > 3) {
                            let maxLen = 0;
                            let maxIdx = 1;
                            words.forEach((w, wIdx) => {
                                const clean = w.replace(/[.,!?"'`;:()[\]{}]/g, '');
                                if (clean.length > maxLen) {
                                    maxLen = clean.length;
                                    maxIdx = wIdx;
                                }
                            });
                            indicesToBlank.push(maxIdx);
                        }
                        newConfigs[sIdx] = indicesToBlank.slice(0, 2);
                    });
                    setBlankConfigs(newConfigs);
                }
            } catch (error) {
                console.error('Error loading dictation:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDictation();
    }, [dictationId]);

    // Helper to format media URL securely
    const getFullMediaUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;

        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
        const encodedPath = cleanUrl.split('/').map(part => encodeURIComponent(part)).join('/');
        const finalUrl = `${cleanBaseUrl}${encodedPath}`.replace(/([^:]\/)\/+/g, "$1");

        return finalUrl;
    };

    let cleanAudioUrl = dictation?.audioUrl?.trim() || '';
    if (cleanAudioUrl) {
        try {
            const parsedUrl = new URL(cleanAudioUrl);
            parsedUrl.searchParams.delete('si');
            if (parsedUrl.hostname === 'youtu.be') {
                const videoId = parsedUrl.pathname.slice(1);
                cleanAudioUrl = `https://www.youtube.com/watch?v=${videoId}`;
            } else {
                cleanAudioUrl = parsedUrl.toString();
            }
        } catch {
            // ignore invalid url errors
        }
    }
    const audioUrlLower = cleanAudioUrl.toLowerCase();
    const isYouTubeUrl = audioUrlLower.includes('youtube.com') || audioUrlLower.includes('youtu.be');

    return {
        dictation,
        loading,
        sentences,
        blankConfigs,
        cleanAudioUrl,
        isYouTubeUrl,
        getFullMediaUrl
    };
};
