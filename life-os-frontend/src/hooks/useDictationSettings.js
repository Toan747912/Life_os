import { useState, useEffect } from 'react';

export const useDictationSettings = () => {
    const [settings, setSettings] = useState(() => {
        const savedSettings = localStorage.getItem('dictation_settings');
        const defaults = {
            replayKey: 'Ctrl',
            autoReplay: '0',
            replayDelay: 0.5,
            alwaysShowOriginal: false,
            alwaysShowHint: false,
            continuousPlayback: false,
            continuousDelay: 2.0,
            strictPronunciation: false,
            ttsSpeed: 1,
            ttsVoiceURI: null
        };
        if (!savedSettings) return defaults;
        try {
            const parsed = JSON.parse(savedSettings);
            const booleanKeys = ['alwaysShowOriginal', 'alwaysShowHint', 'continuousPlayback', 'strictPronunciation'];
            booleanKeys.forEach((key) => {
                if (parsed[key] === 'true') parsed[key] = true;
                if (parsed[key] === 'false') parsed[key] = false;
            });
            return { ...defaults, ...parsed };
        } catch (e) {
            return defaults;
        }
    });

    useEffect(() => {
        localStorage.setItem('dictation_settings', JSON.stringify(settings));
    }, [settings]);

    return { settings, setSettings };
};
