// Global reference to track playing audio so we can stop it if user clicks again
let currentAudio = null;

export const playTextToSpeech = (text, rate = 1.0) => {
    return new Promise((resolve) => {
        if (!text) return resolve();

        // 1. Dừng mọi âm thanh cũ trước khi phát mới
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        // Helper function to play an Audio object and return a Promise
        const playAudioAPI = (url) => {
            return new Promise((res, rej) => {
                const audio = new Audio(url);
                currentAudio = audio; // Track the new audio

                audio.playbackRate = rate;
                audio.onended = () => {
                    currentAudio = null;
                    res();
                };
                audio.onerror = rej;

                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        // Successfully playing
                    }).catch(rej);
                } else {
                    res();
                }
            });
        };

        // Try 1: Youdao Dictionary Voice API (Extremely stable, type=1 is UK/US English)
        const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=1`;

        playAudioAPI(youdaoUrl)
            .then(() => {
                console.log("Played via Youdao TTS");
                resolve();
            })
            .catch(() => {
                console.warn("Youdao TTS failed, trying Google Translate (gtx)...");
                // Dọn dẹp lại biến Audio trước khi thử link 2
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio = null;
                }

                // Try 2: Google Translate API with 'gtx' client
                const googleUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=en-US&client=gtx&q=${encodeURIComponent(text)}`;
                return playAudioAPI(googleUrl);
            })
            .then((val) => {
                // If the second catch wasn't triggered, we're good
                if (val !== 'FALLBACK') {
                    console.log("Played via Google Translate (gtx)");
                    resolve();
                }
            })
            .catch(() => {
                console.warn("Online Audio APIs blocked or failed. Final fallback to Web Speech API...");

                // Dọn dẹp tiếp nếu fail
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio = null;
                }

                // Try 3: The standard Web Speech API
                if (!('speechSynthesis' in window)) {
                    resolve();
                    return 'FALLBACK';
                }

                const synth = window.speechSynthesis;
                synth.cancel(); // Unstick

                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'en-US';
                utterance.rate = rate;

                window.__speechUtterance__ = utterance;

                utterance.onend = resolve;
                utterance.onerror = resolve;

                synth.resume(); // Unstick
                synth.speak(utterance);

                setTimeout(resolve, (text.length * 100) + 3000);
                return 'FALLBACK';
            });
    });
};
