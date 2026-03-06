import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

const YouTubePlayer = forwardRef(({ url, playing, playbackRate, onReady, onPlay, onPause, onProgress, width, height }, ref) => {
    const playerContainerRef = useRef(null);
    const playerInstance = useRef(null);
    const [isApiReady, setIsApiReady] = useState(!!(window.YT && window.YT.Player));
    const progressInterval = useRef(null);

    const callbacksRef = useRef({ onReady, onPlay, onPause, onProgress });
    useEffect(() => {
        callbacksRef.current = { onReady, onPlay, onPause, onProgress };
    }, [onReady, onPlay, onPause, onProgress]);

    // Extract Video ID
    const getVideoId = (u) => {
        try {
            const urlObj = new URL(u);
            if (urlObj.hostname === 'youtu.be') return urlObj.pathname.slice(1);
            return urlObj.searchParams.get('v');
        } catch { return ''; }
    };
    const videoId = getVideoId(url);

    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = () => {
                setIsApiReady(true);
            };
        } else if (window.YT.Player) {
            setIsApiReady(true);
        }
    }, []);

    useEffect(() => {
        if (isApiReady && playerContainerRef.current && !playerInstance.current && videoId) {
            playerInstance.current = new window.YT.Player(playerContainerRef.current, {
                height: height || '100%',
                width: width || '100%',
                videoId: videoId,
                playerVars: {
                    playsinline: 1,
                    controls: 1,
                    rel: 0
                },
                events: {
                    onReady: (e) => {
                        if (callbacksRef.current.onReady) callbacksRef.current.onReady(e);
                        if (playbackRate && e.target.setPlaybackRate) {
                            e.target.setPlaybackRate(playbackRate);
                        }
                        if (playing) e.target.playVideo();
                    },
                    onStateChange: (e) => {
                        if (e.data === window.YT.PlayerState.PLAYING) {
                            if (callbacksRef.current.onPlay) callbacksRef.current.onPlay();
                            // start progress
                            progressInterval.current = setInterval(() => {
                                if (callbacksRef.current.onProgress && playerInstance.current && playerInstance.current.getCurrentTime) {
                                    callbacksRef.current.onProgress({ playedSeconds: playerInstance.current.getCurrentTime() });
                                }
                            }, 250);
                        } else {
                            if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) {
                                if (callbacksRef.current.onPause) callbacksRef.current.onPause();
                                if (progressInterval.current) clearInterval(progressInterval.current);
                            }
                        }
                    }
                }
            });
        }
        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, [isApiReady, videoId]);

    useEffect(() => {
        if (playerInstance.current && playerInstance.current.playVideo) {
            if (playing) {
                playerInstance.current.playVideo();
            } else {
                playerInstance.current.pauseVideo();
            }
        }
    }, [playing]);

    useEffect(() => {
        if (playerInstance.current && playerInstance.current.setPlaybackRate) {
            playerInstance.current.setPlaybackRate(playbackRate || 1);
        }
    }, [playbackRate]);

    useImperativeHandle(ref, () => ({
        seekTo: (seconds) => {
            if (playerInstance.current && playerInstance.current.seekTo) {
                playerInstance.current.seekTo(seconds, true);
            }
        },
        play: () => {
            if (playerInstance.current && playerInstance.current.playVideo) {
                playerInstance.current.playVideo();
            }
        },
        pause: () => {
            if (playerInstance.current && playerInstance.current.pauseVideo) {
                playerInstance.current.pauseVideo();
            }
        }
    }));

    return <div ref={playerContainerRef} className="w-full h-full"></div>;
});

export default YouTubePlayer;
