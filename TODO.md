# Dictation Feature - Improvement TODO

## Backend
- [x] Fix `dictation.controller.js`: Remove duplicate DictationAttempt.create and ActivityLog upsert

## Frontend
- [x] Created `src/components/dictation/DictationHelpers.jsx` (VisualizerBars, AccuracyBadge, NavCounter, HintBar, SpeedControl, MicButton)
- [x] Fix `handleNext` async bug (await fetchSentences before resetting index)
- [x] Add speech recognition to Mic button (Web Speech API, en-US / vi-VN)
- [x] Add video auto-stop after calculated duration from timestamp gap (fallback 6s)
- [x] Add accuracy score display after submission (AccuracyBadge with color coding)
- [x] Add TTS speed control (0.5x / 0.75x / 1x buttons, hidden when video present)
- [x] Fix audio visualizer (CSS keyframe animation, no Math.random in render)
- [x] Fix isPlaying sync on manual video pause (onPause clears timer + sets false)
- [x] Add Ctrl+M keyboard shortcut for mic toggle
- [x] Mic button shows active state (red pulse) when listening
- [x] Textarea placeholder changes to "🎤 Listening…" when mic is active

## All tasks complete ✅
