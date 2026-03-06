import React from 'react';
import ReactPlayer from 'react-player';
import YouTubePlayer from './YouTubePlayer';

const VideoPlayerSection = React.forwardRef(({
    dictation,
    isYouTubeUrl,
    getFullMediaUrl,
    isPlaying,
    setIsPlaying,
    playbackRate,
    setPlaybackRate,
    activeTab,
    isLooping,
    setIsLooping,
    handleProgressCheck,
    handleTimeUpdate,
    setIsPlayerReady
}, ref) => {
    return (
        <div className="w-full shrink-0">
            <div className="bg-slate-900 rounded-2xl p-4 shadow-xl border border-slate-800 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <span className="text-xs text-slate-400 font-bold tracking-widest uppercase flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/0000.svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /></svg>
                        Video Bài Học
                    </span>
                    <div className="flex items-center gap-2">
                        {(activeTab === 'learning' || activeTab === 'blanks') && (
                            <button
                                onClick={() => setIsLooping(!isLooping)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 ${isLooping ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 ring-1 ring-indigo-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200 hover:border-slate-500 hover:bg-slate-700'}`}
                                title="Lặp lại câu hiện tại (A-B Repeat)"
                            >
                                <svg xmlns="http://www.w3.org/0000.svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isLooping ? "animate-spin-slow" : ""}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                Lặp
                            </button>
                        )}
                        <select
                            value={playbackRate}
                            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                            className="bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer appearance-none pr-6 relative hover:bg-slate-700"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center' }}
                        >
                            <option value={0.5}>0.5x</option>
                            <option value={0.75}>0.75x</option>
                            <option value={1}>1.0x</option>
                            <option value={1.25}>1.25x</option>
                            <option value={1.5}>1.5x</option>
                        </select>
                    </div>
                </div>
                <div className="relative aspect-video bg-black/80 rounded-xl overflow-hidden mb-2 flex items-center justify-center ring-1 ring-white/10 shadow-inner">
                    {isYouTubeUrl ? (
                        <div className="absolute inset-0 w-full h-full pointer-events-none sm:pointer-events-auto">
                            <YouTubePlayer
                                ref={ref}
                                url={dictation?.audioUrl}
                                playing={isPlaying}
                                playbackRate={playbackRate}
                                width="100%"
                                height="100%"
                                onReady={() => setIsPlayerReady(true)}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onProgress={({ playedSeconds }) => handleProgressCheck(playedSeconds)}
                            />
                        </div>
                    ) : (
                        <video
                            src={getFullMediaUrl(dictation?.audioUrl)}
                            controls
                            ref={ref}
                            className="w-full h-full object-contain"
                            preload="auto"
                            onTimeUpdate={handleTimeUpdate}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onError={(e) => console.error("Native Video Error:", e.target.error, getFullMediaUrl(dictation?.audioUrl))}
                        >
                            Your browser does not support HTML video.
                        </video>
                    )}
                </div>
            </div>
        </div>
    );
});

export default VideoPlayerSection;
