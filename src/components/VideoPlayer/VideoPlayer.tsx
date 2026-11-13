import React, { useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Zap, 
  Settings,
  BookmarkPlus
} from 'lucide-react';
import { useLearning } from '../../contexts/LearningContext';

export const VideoPlayer: React.FC = () => {
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
    addBookmark
  } = useLearning();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync seek requests
  useEffect(() => {
    if (videoSeekTarget !== null && videoRef.current) {
      videoRef.current.currentTime = videoSeekTarget;
      clearSeekTarget();
    }
  }, [videoSeekTarget, clearSeekTarget]);

  // Sync play / pause state
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {
        // Autoplay policy or pause
        setIsPlaying(false);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, setIsPlaying]);

  // Sync playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sync volume & mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Keyboard shortcut Space to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input or textarea
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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || videoDuration || 1110;
      updateVideoProgress(cur, dur);
    }
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = fraction * (videoDuration || 1110);
    seekTo(targetSeconds);
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

  const progressPercent = videoDuration > 0 ? (currentVideoTime / videoDuration) * 100 : 0;

  // Closed caption subtitle text computed based on timestamp
  const getCaptionText = () => {
    if (currentVideoTime < 90) {
      return '"Polymers are formed by repeating monomer units that establish covalent bonds."';
    } else if (currentVideoTime < 150) {
      return '"Natural polymers such as cellulose differ in synthesis compared to polyamides."';
    } else if (currentVideoTime < 240) {
      return '"Cross-linking forms covalent bridges that alter viscoelasticity."';
    } else if (currentVideoTime < 300) {
      return '"In modern biomaterials, smart polymers respond dynamically to pH and temperature."';
    }
    return '"Synthetic macromolecules provide high strength-to-weight ratios in aerospace components."';
  };

  return (
    <div
      ref={containerRef}
      id="videoContainer"
      data-purpose="video-player-container"
      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-xl border border-slate-200/80 group select-none"
    >
      {/* Real HTML5 Video */}
      <video
        ref={videoRef}
        id="lectureVideo"
        className="w-full h-full object-cover cursor-pointer"
        playsInline
        poster={activeSession.posterUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlayPause}
        onEnded={() => setIsPlaying(false)}
      >
        <source src={activeSession.videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Subtle top & bottom shadow vignettes */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

      {/* Top Left: Interactive Timestamp Notification Cue */}
      <div
        id="activeTaskCue"
        onClick={() => seekTo(60)}
        className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-xs cursor-pointer hover:bg-black/80 transition-all shadow-md"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-medium">{activeCueText}</span>
      </div>

      {/* Top Right: Interactive Mode & Bookmark Actions */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
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
          <span>Interactive Mode: {interactiveMode ? 'ON' : 'OFF'}</span>
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
            {getCaptionText()}
          </p>
        </div>
      )}

      {/* Bottom Video Controls Overlay Bar */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950/95 via-slate-900/80 to-transparent flex flex-col space-y-2 text-white z-10">
        {/* Timeline Scrubber Bar with milestone marks */}
        <div
          id="timelineContainer"
          onClick={handleScrubberClick}
          className="relative w-full h-2 bg-white/20 hover:h-2.5 rounded-full cursor-pointer flex items-center transition-all group/scrub"
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

          {/* Milestone Markers */}
          {/* Milestone 1 (Task 1 at 60s / ~5.4% or design 36%) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              seekTo(60);
            }}
            className="milestone-marker absolute left-[36%] w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white -top-[1px] hover:scale-150 transition-transform cursor-pointer"
            title="Jump to Task 1: Understanding Check (01:00)"
          />

          {/* Milestone 2 (Task 2 at 120s / design 52%) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              seekTo(120);
            }}
            className="milestone-marker absolute left-[52%] w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-white -top-[1px] hover:scale-150 transition-transform cursor-pointer"
            title="Jump to Task 2: Synthetic vs Natural (02:00)"
          />

          {/* Milestone 3 (Task 3 at 180s / design 70%) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              seekTo(180);
            }}
            className="milestone-marker absolute left-[70%] w-2.5 h-2.5 rounded-full bg-indigo-300 ring-1 ring-white -top-[1px] hover:scale-150 transition-transform cursor-pointer"
            title="Jump to Task 3: Cross-linking (03:00)"
          />
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
              {formatTime(currentVideoTime)} / {formatTime(videoDuration)}
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
              onClick={() => alert(`Active Stream: 1080p HD (60fps)\nCodec: H.264 / AAC\nBitrate: 4.8 Mbps`)}
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
  );
};
