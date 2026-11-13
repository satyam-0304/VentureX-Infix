import React, { createContext, useContext, useMemo } from 'react';
import type { Chapter, YouTubePlayerContextType } from '../types';
import { useLearning } from '../contexts/LearningContext';

export const YouTubePlayerContext = createContext<YouTubePlayerContextType | undefined>(undefined);

export interface YouTubePlayerProviderProps {
  children: React.ReactNode;
  // Optional overrides if used standalone
  currentTimeOverride?: number;
  durationOverride?: number;
  isPlayingOverride?: boolean;
  onSeek?: (seconds: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  chaptersOverride?: Chapter[];
}

export const YouTubePlayerProvider: React.FC<YouTubePlayerProviderProps> = ({
  children,
  currentTimeOverride,
  durationOverride,
  isPlayingOverride,
  onSeek,
  onPlay,
  onPause,
  chaptersOverride
}) => {
  const learning = useLearning();

  const currentTime = currentTimeOverride !== undefined ? currentTimeOverride : learning.currentVideoTime;
  const duration = durationOverride !== undefined ? durationOverride : learning.videoDuration;
  const isPlaying = isPlayingOverride !== undefined ? isPlayingOverride : learning.isPlaying;

  // Chapters from session or fallback generator
  const chapters: Chapter[] = useMemo(() => {
    if (chaptersOverride && chaptersOverride.length > 0) {
      return chaptersOverride;
    }
    if (learning.activeSession?.chapters && learning.activeSession.chapters.length > 0) {
      return learning.activeSession.chapters;
    }

    // Auto-generate sensible chapters based on duration if none defined
    const total = duration > 0 ? duration : 1110;
    const count = 4;
    const segment = Math.floor(total / count);

    return [
      {
        id: 1,
        title: 'Introduction & Foundations',
        start_sec: 0,
        end_sec: segment,
        summary: 'Core terminology, overview of principles, and introductory concepts.'
      },
      {
        id: 2,
        title: 'Mechanisms & Methodologies',
        start_sec: segment,
        end_sec: segment * 2,
        summary: 'Primary operational mechanisms, reaction kinetics, and structural pathways.'
      },
      {
        id: 3,
        title: 'Analytical Models & Cross-Linking',
        start_sec: segment * 2,
        end_sec: segment * 3,
        summary: 'Quantitative formulations, stress-strain behavior, and comparative analysis.'
      },
      {
        id: 4,
        title: 'Advanced Applications & Review',
        start_sec: segment * 3,
        end_sec: total,
        summary: 'Modern real-world applications, engineering challenges, and module recap.'
      }
    ];
  }, [chaptersOverride, learning.activeSession?.chapters, duration]);

  // Compute active chapter based on currentTime
  const activeChapter: Chapter | null = useMemo(() => {
    if (!chapters || chapters.length === 0) return null;
    const matched = chapters.find(
      (c) => currentTime >= c.start_sec && currentTime < c.end_sec
    );
    if (matched) return matched;
    if (currentTime >= chapters[chapters.length - 1].start_sec) {
      return chapters[chapters.length - 1];
    }
    return chapters[0] || null;
  }, [chapters, currentTime]);

  const seekTo = (seconds: number) => {
    if (onSeek) {
      onSeek(seconds);
    } else {
      learning.seekTo(seconds);
    }
  };

  const play = () => {
    if (onPlay) {
      onPlay();
    } else {
      learning.setIsPlaying(true);
    }
  };

  const pause = () => {
    if (onPause) {
      onPause();
    } else {
      learning.setIsPlaying(false);
    }
  };

  const value: YouTubePlayerContextType = {
    currentTime,
    duration,
    isPlaying,
    seekTo,
    pause,
    play,
    chapters,
    activeChapter
  };

  return (
    <YouTubePlayerContext.Provider value={value}>
      {children}
    </YouTubePlayerContext.Provider>
  );
};

export function useYouTubePlayerContext(): YouTubePlayerContextType {
  const context = useContext(YouTubePlayerContext);
  if (!context) {
    throw new Error('useYouTubePlayerContext must be used within a YouTubePlayerProvider');
  }
  return context;
}
