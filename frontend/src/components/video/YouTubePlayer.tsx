import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Youtube } from 'lucide-react';
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer';

export interface YouTubePlayerProps {
  videoUrlOrId: string;
  initialTime?: number;
  isPlaying?: boolean;
  playbackSpeed?: number;
  volume?: number;
  isMuted?: boolean;
  seekTarget?: number | null;
  onClearSeekTarget?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onSeek?: (fromTime: number, toTime: number) => void;
  className?: string;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoUrlOrId,
  initialTime = 0,
  isPlaying = false,
  playbackSpeed = 1.0,
  volume = 0.8,
  isMuted = false,
  seekTarget = null,
  onClearSeekTarget,
  onTimeUpdate,
  onPlayStateChange,
  onSeek,
  className = ''
}) => {
  const {
    containerRef,
    playerRef,
    isReady,
    isLoading,
    errorMessage,
    play,
    pause,
    seekTo,
    setVolume,
    setPlaybackRate
  } = useYouTubePlayer({
    videoUrlOrId,
    initialTime,
    pollIntervalMs: 250,
    onTimeUpdate,
    onPlayStateChange,
    onSeek
  });

  // Sync seek requests
  useEffect(() => {
    if (seekTarget !== null && isReady) {
      seekTo(seekTarget);
      onClearSeekTarget?.();
    }
  }, [seekTarget, isReady, seekTo, onClearSeekTarget]);

  // Sync play / pause state
  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    if (isPlaying) {
      play();
    } else {
      pause();
    }
  }, [isPlaying, isReady, play, pause, playerRef]);

  // Sync playback speed
  useEffect(() => {
    if (isReady) {
      setPlaybackRate(playbackSpeed);
    }
  }, [playbackSpeed, isReady, setPlaybackRate]);

  // Sync volume and mute
  useEffect(() => {
    if (isReady) {
      setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted, isReady, setVolume]);

  return (
    <div
      className={`relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden ${className}`}
      data-purpose="youtube-iframe-wrapper"
    >
      {/* Loading state indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm text-white">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
            <Youtube className="w-4 h-4 text-red-500 pointer-events-none" />
            <span>Connecting to YouTube Stream...</span>
          </div>
        </div>
      )}

      {/* Error state fallback */}
      {errorMessage && (
        <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center text-white">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 pointer-events-none" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Video Stream Unavailable</h4>
          <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
            {errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5 pointer-events-none" />
            <span>Reload Lecture</span>
          </button>
        </div>
      )}

      {/* Mounting node for the YouTube IFrame */}
      <div
        ref={containerRef}
        className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:pointer-events-auto"
        id="youtube-player-mount"
      />
    </div>
  );
};
