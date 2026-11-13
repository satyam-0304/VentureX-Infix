import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Zap, 
  Settings, 
  BookmarkPlus,
  Youtube,
  Link2,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { useLearning } from '../../contexts/LearningContext';
import { YouTubePlayer } from '../video/YouTubePlayer';
import { ChapterBar } from '../video/ChapterBar';
import { ConfusionToast } from '../video/ConfusionToast';
import { useConfusionDetect } from '../../hooks/useConfusionDetect';
import { extractYouTubeVideoId, isYouTubeSource } from '../../hooks/useYouTubePlayer';
import { YouTubePlayerProvider } from '../../context/YouTubePlayerContext';
import { videoService } from '../../services/videoService';

const VideoPlayerInternal: React.FC = () => {
  const {
    activeSession,
    currentVideoTime,
    videoDuration,
    isPlaying,
    playbackSpeed,
    volume,
    isMuted,
    captionsEnabled,
    interactiveMode,
    activeCueText,
    videoSeekTarget,
    updateVideoProgress,
    seekTo,
    clearSeekTarget,
    togglePlayPause,
    setIsPlaying,
    cyclePlaybackSpeed,
    setVolume,
    toggleMute,
    toggleCaptions,
    toggleInteractiveMode,
    addBookmark,
    openAiTutor,
    sendChatMessage,
    updateSessionVideoUrl,
    updateActiveSessionVideoData
  } = useLearning();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  // Scrubber drag / slide state for smooth real-time timeline scrubbing
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPreviewTime, setScrubPreviewTime] = useState<number | null>(null);

  // URL modal state for loading educational YouTube videos
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [urlInputError, setUrlInputError] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  const isYouTube = isYouTubeSource(activeSession.videoUrl);

  // Confusion detection hook
  const confusion = useConfusionDetect({
    windowMs: 60000,
    proximitySec: 25,
    cooldownMs: 180000
  });

  // Track seek requests and feed into confusion detection
  const handleSeek = (targetSeconds: number) => {
    confusion.recordSeek(currentVideoTime, targetSeconds);
    seekTo(targetSeconds);
    if (!isYouTube && videoRef.current) {
      videoRef.current.currentTime = targetSeconds;
    }
  };

  // Helper to calculate seconds from a clientX click/drag event on the scrubber
  const calculateTimeFromClientX = (clientX: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    return fraction * (videoDuration || 1110);
  };

  // Interactive Drag & Slide Mouse Handler on Timeline Scrubber
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    const targetSeconds = calculateTimeFromClientX(e.clientX);
    setScrubPreviewTime(targetSeconds);
    handleSeek(targetSeconds);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const liveSeconds = calculateTimeFromClientX(moveEvent.clientX);
      setScrubPreviewTime(liveSeconds);

      // Continuously update playback position live as the user slides
      if (!isYouTube && videoRef.current) {
        videoRef.current.currentTime = liveSeconds;
        updateVideoProgress(liveSeconds, videoRef.current.duration || videoDuration);
      } else if (isYouTube) {
        seekTo(liveSeconds);
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const finalSeconds = calculateTimeFromClientX(upEvent.clientX);
      handleSeek(finalSeconds);
      setIsScrubbing(false);
      setScrubPreviewTime(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Sync seek requests for HTML5 video
  useEffect(() => {
    if (!isYouTube && videoSeekTarget !== null && videoRef.current) {
      videoRef.current.currentTime = videoSeekTarget;
      clearSeekTarget();
    }
  }, [videoSeekTarget, clearSeekTarget, isYouTube]);

  // Sync play / pause state for HTML5 video
  useEffect(() => {
    if (isYouTube) return;
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, setIsPlaying, isYouTube]);

  // Sync playback rate for HTML5 video
  useEffect(() => {
    if (!isYouTube && videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, isYouTube]);

  // Sync volume & mute for HTML5 video
  useEffect(() => {
    if (!isYouTube && videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted, isYouTube]);

  // Keyboard shortcut Space to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause]);

  const handleHtml5TimeUpdate = () => {
    if (isScrubbing) return;
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || videoDuration || 1110;
      updateVideoProgress(cur, dur);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const effectiveTime = isScrubbing && scrubPreviewTime !== null ? scrubPreviewTime : currentVideoTime;
  const progressPercent = videoDuration > 0 ? (effectiveTime / videoDuration) * 100 : 0;

  // Closed caption subtitle dynamically synchronized with the video being played and current timestamp
  const getDynamicCaptionText = (): string => {
    const transcript = activeSession.transcript;
    if (transcript && transcript.length > 0) {
      for (let i = 0; i < transcript.length; i++) {
        const line = transcript[i];
        const nextLine = transcript[i + 1];
        const endTime = nextLine ? nextLine.timestamp : line.timestamp + 30;
        if (effectiveTime >= line.timestamp && effectiveTime < endTime) {
          return `"${line.text}"`;
        }
      }
      if (effectiveTime < transcript[0].timestamp) {
        return `"${activeSession.title} — Introduction"`;
      }
      const lastLine = transcript[transcript.length - 1];
      if (effectiveTime >= lastLine.timestamp) {
        return `"${lastLine.text}"`;
      }
    }
    return `"${activeSession.title}: Core principles and applications in ${activeSession.topic}."`;
  };

  const getCaptionText = getDynamicCaptionText;

  // Handle loading a new YouTube video URL with full curriculum synchronization
  const handleLoadYouTubeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlInputError(null);
    const trimmed = customUrlInput.trim();
    if (!trimmed) {
      setUrlInputError('Please enter a YouTube video URL or ID.');
      return;
    }

    const videoId = extractYouTubeVideoId(trimmed);
    if (!videoId) {
      setUrlInputError('Invalid YouTube URL or ID format. Example: https://www.youtube.com/watch?v=k38j3pG6KXY');
      return;
    }

    setIsLoadingVideo(true);
    try {
      const data = await videoService.ingestVideo(trimmed);
      updateActiveSessionVideoData(trimmed, {
        title: data.title,
        durationSeconds: data.durationSec,
        chapters: data.chapters,
        tasks: data.tasks,
        notes: data.notes,
        transcript: data.transcript,
      });
      setShowUrlModal(false);
      setCustomUrlInput('');
    } catch (err) {
      updateSessionVideoUrl(trimmed);
      setShowUrlModal(false);
      setCustomUrlInput('');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // Quick preset loader helper
  const handleLoadPreset = async (url: string) => {
    setIsLoadingVideo(true);
    try {
      const data = await videoService.ingestVideo(url);
      updateActiveSessionVideoData(url, {
        title: data.title,
        durationSeconds: data.durationSec,
        chapters: data.chapters,
        tasks: data.tasks,
        notes: data.notes,
        transcript: data.transcript,
      });
      setShowUrlModal(false);
      setCustomUrlInput('');
    } catch (err) {
      updateSessionVideoUrl(url);
      setShowUrlModal(false);
      setCustomUrlInput('');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Video Container */}
      <div
        ref={containerRef}
        id="videoContainer"
        data-purpose="video-player-container"
        className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-xl border border-slate-200/80 group select-none"
      >
        {/* Render YouTube IFrame or HTML5 Video based on URL format */}
        {isYouTube ? (
          <YouTubePlayer
            videoUrlOrId={activeSession.videoUrl}
            initialTime={activeSession.savedPlaybackPosition || 0}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            volume={volume}
            isMuted={isMuted}
            seekTarget={videoSeekTarget}
            onClearSeekTarget={clearSeekTarget}
            onTimeUpdate={(cur, dur) => {
              if (!isScrubbing) {
                updateVideoProgress(cur, dur > 0 ? dur : videoDuration);
              }
            }}
            onPlayStateChange={(playing) => {
              setIsPlaying(playing);
            }}
            onSeek={(from, to) => {
              confusion.recordSeek(from, to);
            }}
          />
        ) : (
          <video
            ref={videoRef}
            id="lectureVideo"
            src={activeSession.videoUrl}
            className="w-full h-full object-cover cursor-pointer"
            playsInline
            poster={activeSession.posterUrl}
            preload="auto"
            onTimeUpdate={handleHtml5TimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlayPause}
            onEnded={() => setIsPlaying(false)}
          >
            Your browser does not support the video tag.
          </video>
        )}

        {/* Subtle top & bottom shadow vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

        {/* Top Left: Interactive Timestamp Notification Cue */}
        <div
          id="activeTaskCue"
          onClick={() => handleSeek(60)}
          className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-xs cursor-pointer hover:bg-black/80 transition-all shadow-md"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium">{activeCueText}</span>
        </div>

        {/* Top Right: Video Source Switcher & Interactive Actions */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
          {/* YouTube Video URL Loader Button */}
          <button
            onClick={() => setShowUrlModal(true)}
            id="loadYouTubeBtn"
            className={`backdrop-blur-md px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 shadow-md border border-white/10 transition-all cursor-pointer ${
              isYouTube
                ? 'bg-rose-600/90 hover:bg-rose-600 text-white'
                : 'bg-black/50 hover:bg-black/70 text-slate-200 hover:text-white'
            }`}
            title="Load YouTube Educational Video"
          >
            <Youtube className="w-3.5 h-3.5 text-rose-300 pointer-events-none" />
            <span className="hidden sm:inline font-semibold">
              {isYouTube ? 'YouTube Source' : 'Load YouTube'}
            </span>
          </button>

          <button
            onClick={() => addBookmark()}
            className="bg-black/50 hover:bg-black/70 backdrop-blur-md text-white p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 border border-white/10 shadow-md transition-all cursor-pointer"
            title="Bookmark current timestamp"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-amber-300" />
          </button>

          <button
            onClick={toggleInteractiveMode}
            id="interactiveModeBtn"
            className={`backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 shadow-md cursor-pointer transition-all ${
              interactiveMode ? 'bg-indigo-600/90 hover:bg-indigo-600' : 'bg-slate-700/80 hover:bg-slate-700'
            }`}
            title="Toggle interactive timeline triggers"
          >
            <Zap className="w-3.5 h-3.5 pointer-events-none fill-current" />
            <span>Interactive: {interactiveMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Closed Captions Overlay Display */}
        {captionsEnabled && (
          <div
            id="captionsOverlay"
            className="absolute bottom-16 inset-x-8 text-center pointer-events-none transition-opacity duration-300 z-10"
          >
            <p
              id="captionsText"
              className="inline-block bg-black/75 backdrop-blur-sm text-white px-3 py-1 rounded text-xs tracking-wide shadow-md"
            >
              {getDynamicCaptionText()}
            </p>
          </div>
        )}

        {/* Intelligent Confusion Detection Toast Notification */}
        <ConfusionToast
          isVisible={confusion.isConfusionDetected}
          timestamp={confusion.detectedTimestamp ?? currentVideoTime}
          onDismiss={confusion.dismissConfusion}
          onSelectMode={(mode) => {
            setIsPlaying(false);
            openAiTutor();
            const mins = Math.floor(currentVideoTime / 60);
            const secs = Math.floor(currentVideoTime % 60);
            const timeStr = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

            let prompt = `Can you explain the lecture content around ${timeStr}?`;
            if (mode === 'analogy') {
              prompt = `Explain what is happening around timestamp ${timeStr} using an everyday analogy`;
            } else if (mode === 'step_by_step') {
              prompt = `Break down the concepts at timestamp ${timeStr} step by step`;
            } else if (mode === 'hinglish') {
              prompt = `Explain the lecture section at timestamp ${timeStr} in simple conversational Hinglish`;
            }

            sendChatMessage(prompt, mode);
            confusion.resolveConfusion();
          }}
        />

        {/* Bottom Video Controls Overlay Bar */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950/95 via-slate-900/80 to-transparent flex flex-col space-y-2 text-white z-10">
          {/* Timeline Scrubber Bar with milestone marks */}
          <div
            ref={timelineRef}
            id="timelineContainer"
            onMouseDown={handleTimelineMouseDown}
            className="relative w-full h-2.5 bg-white/20 hover:h-3 rounded-full cursor-pointer flex items-center transition-all group/scrub"
          >
            {/* Played Progress Bar */}
            <div
              id="videoProgressBar"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full relative pointer-events-none"
            >
              {/* Scrubber Knob */}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-100 group-hover/scrub:scale-125 transition-transform pointer-events-none" />
            </div>

            {/* Dynamic Milestone Markers — driven by activeSession tasks */}
            {activeSession.tasks
              .filter((t) => t.timestampTarget != null && (videoDuration || 1) > 0)
              .slice(0, 5)
              .map((task, idx) => {
                const colors = ['bg-emerald-400 ring-2 ring-white', 'bg-amber-400 ring-1 ring-white', 'bg-indigo-300 ring-1 ring-white', 'bg-rose-400 ring-1 ring-white', 'bg-cyan-400 ring-1 ring-white'];
                const pct = Math.min(98, Math.max(2, ((task.timestampTarget ?? 0) / (videoDuration || 1)) * 100));
                return (
                  <button
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSeek(task.timestampTarget ?? 0);
                    }}
                    className={`milestone-marker absolute w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]} -top-[1px] hover:scale-150 transition-transform cursor-pointer`}
                    style={{ left: `${pct}%` }}
                    title={`${task.title}`}
                  />
                );
              })
            }
          </div>

          {/* Video Controls Row */}
          <div className="flex items-center justify-between text-xs pt-1">
            {/* Play / Pause & Time & Volume */}
            <div className="flex items-center space-x-3.5">
              <button
                onClick={togglePlayPause}
                id="playPauseBtn"
                className="hover:text-indigo-400 transition-colors p-1 cursor-pointer"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current pointer-events-none" />
                ) : (
                  <Play className="w-5 h-5 fill-current pointer-events-none" />
                )}
              </button>

              {/* Time Display */}
              <span id="timeDisplay" className="font-mono text-slate-300 font-medium">
                {formatTime(effectiveTime)} / {formatTime(videoDuration)}
              </span>

              {/* Volume Control */}
              <div className="flex items-center space-x-1.5 text-slate-300 hover:text-white">
                <button
                  onClick={toggleMute}
                  id="volumeMuteBtn"
                  className="cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 pointer-events-none text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 pointer-events-none" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  id="volumeSlider"
                  className="w-14 h-1 accent-indigo-500 bg-white/30 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Right Side Video Controls */}
            <div className="flex items-center space-x-3">
              {/* CC Closed Captions Toggle */}
              <button
                onClick={toggleCaptions}
                id="captionsToggleBtn"
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider cursor-pointer transition-colors ${
                  captionsEnabled
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title="Toggle Captions"
              >
                CC
              </button>

              {/* Playback Speed Cycler */}
              <button
                onClick={cyclePlaybackSpeed}
                id="playbackSpeedBtn"
                className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-semibold tracking-wide cursor-pointer transition-colors"
                title="Change Playback Speed"
              >
                {playbackSpeed}x
              </button>

              {/* Settings Trigger */}
              <button
                onClick={() => alert(`Stream Engine: ${isYouTube ? 'YouTube IFrame API' : 'HTML5 Core'}\nResolution: 1080p HD (60fps)\nSession: ${activeSession.title}`)}
                id="videoSettingsBtn"
                className="hover:text-indigo-400 transition-colors cursor-pointer"
                title="Playback Quality & Settings"
              >
                <Settings className="w-4 h-4 pointer-events-none" />
              </button>

              {/* Fullscreen Trigger */}
              <button
                onClick={toggleFullscreen}
                id="fullscreenBtn"
                className="hover:text-indigo-400 transition-colors cursor-pointer"
                title="Toggle Fullscreen"
              >
                <Maximize className="w-4 h-4 pointer-events-none" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reusable Interactive Chapter Timeline Bar directly below the video */}
      <ChapterBar onSeek={handleSeek} />

      {/* YouTube URL Ingestion Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Youtube className="w-5 h-5 pointer-events-none" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Load YouTube Lecture</h3>
                  <p className="text-[11px] text-slate-400">Stream educational videos with interactive timeline</p>
                </div>
              </div>
              <button
                onClick={() => setShowUrlModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4 pointer-events-none" />
              </button>
            </div>

            <form onSubmit={handleLoadYouTubeUrl} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  YouTube Video URL or Video ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => {
                      setCustomUrlInput(e.target.value);
                      setUrlInputError(null);
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                  <Link2 className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                {urlInputError && (
                  <p className="text-xs text-rose-400 mt-1.5">{urlInputError}</p>
                )}
              </div>

              {/* Quick Preset Demonstrations */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Quick Academic Presets:</span>
                <div className="flex flex-col space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('https://www.youtube.com/watch?v=k38j3pG6KXY')}
                    className="flex items-center justify-between text-left text-xs bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-3 py-2 rounded-xl text-slate-200 transition-colors cursor-pointer"
                  >
                    <span className="truncate">Polymers & Macromolecules (Chemistry)</span>
                    <span className="text-[10px] text-indigo-400 font-mono shrink-0 ml-2">Load</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadPreset('https://www.youtube.com/watch?v=aircAruvnKk')}
                    className="flex items-center justify-between text-left text-xs bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-3 py-2 rounded-xl text-slate-200 transition-colors cursor-pointer"
                  >
                    <span className="truncate">Neural Networks & Backpropagation (CS)</span>
                    <span className="text-[10px] text-indigo-400 font-mono shrink-0 ml-2">Load</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUrlModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoadingVideo}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md transition-colors cursor-pointer"
                >
                  {isLoadingVideo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin pointer-events-none" />
                      <span>Ingesting...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 pointer-events-none" />
                      <span>Load Video</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const VideoPlayer: React.FC = () => {
  return (
    <YouTubePlayerProvider>
      <VideoPlayerInternal />
    </YouTubePlayerProvider>
  );
};
