import { useState, useEffect, useRef, useCallback } from 'react';
import type { YTPlayer } from '../types/youtube';

/**
 * Extracts YouTube video ID from various URL formats or raw IDs.
 */
export function extractYouTubeVideoId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // Known demo slug mappings to verified academic YouTube videos
  const demoMappings: Record<string, string> = {
    demo_polymers: 'k38j3pG6KXY', // Polymers & Macromolecules (Chemistry)
    demo_neural_nets: 'aircAruvnKk', // Neural Networks & Gradient Descent (CS)
    demo_electromagnetism: 'bHTqg7nQ2iE', // Electromagnetic Induction (Physics)
  };

  if (demoMappings[trimmed]) {
    return demoMappings[trimmed];
  }

  // If already an 11-character ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle common URL patterns
  const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?/\s]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  // Also check if URL contains a demo slug in v= query parameter
  const demoUrlMatch = trimmed.match(/[?&]v=(demo_[a-zA-Z0-9_]+)/);
  if (demoUrlMatch && demoMappings[demoUrlMatch[1]]) {
    return demoMappings[demoUrlMatch[1]];
  }

  return null;
}

/**
 * Check if a URL or string is a valid YouTube reference.
 */
export function isYouTubeSource(urlOrId: string): boolean {
  if (!urlOrId) return false;
  return extractYouTubeVideoId(urlOrId) !== null;
}

let apiLoadPromise: Promise<void> | null = null;

/**
 * Ensures the YouTube IFrame Player API script is loaded once.
 */
export function loadYouTubeIFrameAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }

  if (apiLoadPromise) {
    return apiLoadPromise;
  }

  apiLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => {
        apiLoadPromise = null;
        reject(new Error('Failed to load YouTube IFrame Player API script.'));
      };
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const previousOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousOnReady) previousOnReady();
      resolve();
    };

    // Fallback polling in case ready event fired prior to listener assignment
    const interval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(interval);
        resolve();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      if (window.YT && window.YT.Player) {
        resolve();
      }
    }, 10000);
  });

  return apiLoadPromise;
}

export interface UseYouTubePlayerOptions {
  videoUrlOrId: string;
  initialTime?: number;
  pollIntervalMs?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onSeek?: (fromTime: number, toTime: number) => void;
}

export function useYouTubePlayer({
  videoUrlOrId,
  initialTime = 0,
  pollIntervalMs = 250,
  onTimeUpdate,
  onPlayStateChange,
  onSeek
}: UseYouTubePlayerOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const prevTimeRef = useRef(initialTime);
  const videoId = extractYouTubeVideoId(videoUrlOrId);

  // Stop polling interval
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Poll current playback time at approximately 250ms
  const startPolling = useCallback(() => {
    stopPolling();
    pollTimerRef.current = window.setInterval(() => {
      if (!playerRef.current) return;
      try {
        const cur = playerRef.current.getCurrentTime();
        const dur = playerRef.current.getDuration();

        if (typeof cur === 'number' && !isNaN(cur)) {
          // Detect manual or jump seek within player
          if (Math.abs(cur - prevTimeRef.current) > 2) {
            onSeek?.(prevTimeRef.current, cur);
          }
          prevTimeRef.current = cur;
          setCurrentTime(cur);

          if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
            setDuration(dur);
            onTimeUpdate?.(cur, dur);
          } else {
            onTimeUpdate?.(cur, 0);
          }
        }
      } catch (err) {
        // Player might be re-buffering or transitioning
      }
    }, pollIntervalMs);
  }, [pollIntervalMs, onSeek, onTimeUpdate, stopPolling]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Initialize or re-cue player when videoId changes
  useEffect(() => {
    if (!videoId) {
      if (videoUrlOrId && !isYouTubeSource(videoUrlOrId)) {
        // Not a YouTube URL, silent or external
        setErrorMessage(null);
      }
      return;
    }

    let isSubscribed = true;
    setIsLoading(true);
    setErrorMessage(null);

    loadYouTubeIFrameAPI()
      .then(() => {
        if (!isSubscribed || !containerRef.current) return;

        // If player already exists, load video directly
        if (playerRef.current) {
          try {
            playerRef.current.loadVideoById(videoId, initialTime);
            setIsLoading(false);
            return;
          } catch (e) {
            // Destroy and re-instantiate if reuse fails
            try {
              playerRef.current.destroy();
            } catch (destroyErr) {}
            playerRef.current = null;
          }
        }

        // Clean container element
        containerRef.current.innerHTML = '';
        const playerMountDiv = document.createElement('div');
        playerMountDiv.id = `yt-player-${Date.now()}`;
        containerRef.current.appendChild(playerMountDiv);

        if (!window.YT || !window.YT.Player) {
          throw new Error('YouTube Player API unavailable.');
        }

        const player = new window.YT.Player(playerMountDiv, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            disablekb: 1,
            start: Math.floor(initialTime)
          },
          events: {
            onReady: (event) => {
              if (!isSubscribed) return;
              playerRef.current = event.target;
              setIsReady(true);
              setIsLoading(false);
              const dur = event.target.getDuration();
              if (dur > 0) setDuration(dur);
              if (initialTime > 0) {
                event.target.seekTo(initialTime, true);
              }
            },
            onStateChange: (event) => {
              if (!isSubscribed) return;
              const YT = window.YT;
              if (!YT) return;

              if (event.data === YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                onPlayStateChange?.(true);
                startPolling();
              } else if (event.data === YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                onPlayStateChange?.(false);
                stopPolling();
                if (playerRef.current) {
                  const cur = playerRef.current.getCurrentTime();
                  setCurrentTime(cur);
                  const dur = playerRef.current.getDuration();
                  onTimeUpdate?.(cur, dur);
                }
              } else if (event.data === YT.PlayerState.ENDED) {
                setIsPlaying(false);
                onPlayStateChange?.(false);
                stopPolling();
              }
            },
            onError: (event) => {
              if (!isSubscribed) return;
              setIsLoading(false);
              let msg = 'Failed to load video.';
              if (event.data === 2) msg = 'Invalid YouTube video ID parameter.';
              else if (event.data === 5) msg = 'HTML5 playback error occurred.';
              else if (event.data === 100) msg = 'The requested video was not found or has been removed.';
              else if (event.data === 101 || event.data === 150) {
                msg = 'The video owner does not allow embedded playback.';
              }
              setErrorMessage(msg);
            }
          }
        });
      })
      .catch((err) => {
        if (!isSubscribed) return;
        setIsLoading(false);
        setErrorMessage(err?.message || 'Failed to initialize YouTube player.');
      });

    return () => {
      isSubscribed = false;
      stopPolling();
    };
  }, [videoId, initialTime, startPolling, stopPolling, onPlayStateChange, onTimeUpdate, videoUrlOrId]);

  // Controls
  const play = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.playVideo();
      } catch (e) {
        console.error('YouTube playVideo failed', e);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.pauseVideo();
      } catch (e) {
        console.error('YouTube pauseVideo failed', e);
      }
    }
  }, []);

  const seekTo = useCallback(
    (seconds: number) => {
      if (playerRef.current) {
        const from = prevTimeRef.current;
        prevTimeRef.current = seconds;
        setCurrentTime(seconds);
        try {
          playerRef.current.seekTo(seconds, true);
          onSeek?.(from, seconds);
        } catch (e) {
          console.error('YouTube seekTo failed', e);
        }
      }
    },
    [onSeek]
  );

  const setVolume = useCallback((volPercent: number) => {
    if (playerRef.current) {
      try {
        playerRef.current.setVolume(Math.round(volPercent * 100));
      } catch (e) {}
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (playerRef.current) {
      try {
        playerRef.current.setPlaybackRate(rate);
      } catch (e) {}
    }
  }, []);

  return {
    containerRef,
    playerRef,
    videoId,
    isReady,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    errorMessage,
    play,
    pause,
    seekTo,
    setVolume,
    setPlaybackRate
  };
}
