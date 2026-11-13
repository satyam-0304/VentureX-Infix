import React from 'react';
import { Layers, Play, Clock, Sparkles } from 'lucide-react';
import type { Chapter } from '../../types';
import { useLearning } from '../../contexts/LearningContext';

export interface ChapterBarProps {
  chapters?: Chapter[];
  activeChapter?: Chapter | null;
  currentTime?: number;
  duration?: number;
  onSeek?: (seconds: number) => void;
}

export const ChapterBar: React.FC<ChapterBarProps> = ({
  chapters: propChapters,
  activeChapter: propActiveChapter,
  currentTime: propCurrentTime,
  duration: propDuration,
  onSeek
}) => {
  const learning = useLearning();

  const currentTime = propCurrentTime !== undefined ? propCurrentTime : learning.currentVideoTime;
  const duration = propDuration !== undefined ? propDuration : (learning.videoDuration || 1110);
  const chapters = propChapters || learning.activeSession?.chapters || [];

  const handleSeek = (sec: number) => {
    if (onSeek) {
      onSeek(sec);
    } else {
      learning.seekTo(sec);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Determine active chapter if not provided
  const activeChapter = propActiveChapter !== undefined
    ? propActiveChapter
    : chapters.find((c) => currentTime >= c.start_sec && currentTime < c.end_sec) ||
      (currentTime >= (chapters[chapters.length - 1]?.start_sec ?? 0)
        ? chapters[chapters.length - 1]
        : chapters[0]) || null;

  if (!chapters || chapters.length === 0) {
    return null;
  }

  return (
    <div
      data-purpose="interactive-chapter-timeline"
      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col space-y-3.5 select-none transition-all"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Layers className="w-4 h-4 pointer-events-none" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Interactive Chapter Timeline
            </h3>
            <p className="text-[11px] text-slate-400">
              {chapters.length} auto-generated structured sections
            </p>
          </div>
        </div>

        {/* Current Active Chapter Tag */}
        {activeChapter && (
          <div className="flex items-center space-x-1.5 bg-indigo-50/80 border border-indigo-100 px-3 py-1 rounded-full text-indigo-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="font-semibold">Chapter {activeChapter.id}:</span>
            <span className="truncate max-w-[180px] sm:max-w-[240px]">{activeChapter.title}</span>
          </div>
        )}
      </div>

      {/* Segmented Timeline Scrubber Preview */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex gap-[2px] p-[2px]">
        {chapters.map((ch) => {
          const chapterDuration = Math.max(1, ch.end_sec - ch.start_sec);
          const percentOfTotal = duration > 0 ? (chapterDuration / duration) * 100 : 100 / chapters.length;

          // How much of this specific chapter has elapsed
          let chapterProgress = 0;
          if (currentTime >= ch.end_sec) {
            chapterProgress = 100;
          } else if (currentTime > ch.start_sec) {
            chapterProgress = ((currentTime - ch.start_sec) / chapterDuration) * 100;
          }

          const isActive = activeChapter?.id === ch.id;

          return (
            <div
              key={ch.id}
              onClick={() => handleSeek(ch.start_sec)}
              style={{ width: `${percentOfTotal}%` }}
              className={`h-full relative rounded-full overflow-hidden cursor-pointer transition-all hover:opacity-90 ${
                isActive ? 'ring-1 ring-indigo-400' : 'bg-slate-200/80'
              }`}
              title={`${ch.title} (${formatTime(ch.start_sec)} - ${formatTime(ch.end_sec)})`}
            >
              <div
                style={{ width: `${Math.min(100, Math.max(0, chapterProgress))}%` }}
                className={`h-full transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                    : 'bg-indigo-400/70'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Chapter Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        {chapters.map((chapter) => {
          const isActive = activeChapter?.id === chapter.id;
          const chapterMins = Math.round((chapter.end_sec - chapter.start_sec) / 60);

          return (
            <button
              key={chapter.id}
              onClick={() => handleSeek(chapter.start_sec)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 group ${
                isActive
                  ? 'bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/40 border-indigo-300 ring-1 ring-indigo-400/40 shadow-sm'
                  : 'bg-slate-50/60 hover:bg-white border-slate-200/70 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Card Header: Number & Timing */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                    }`}
                  >
                    0{chapter.id}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center space-x-1">
                      <Sparkles className="w-2.5 h-2.5 text-indigo-500 pointer-events-none" />
                      <span>Playing</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-500">
                  <Clock className="w-3 h-3 text-slate-400 pointer-events-none" />
                  <span>{formatTime(chapter.start_sec)}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-400 font-sans text-[10px]">{chapterMins}m</span>
                </div>
              </div>

              {/* Title */}
              <div>
                <h4
                  className={`text-xs font-semibold line-clamp-2 transition-colors ${
                    isActive ? 'text-indigo-950 font-bold' : 'text-slate-700 group-hover:text-slate-900'
                  }`}
                >
                  {chapter.title}
                </h4>
                {chapter.summary && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {chapter.summary}
                  </p>
                )}
              </div>

              {/* Action Prompt */}
              <div className="pt-1 flex items-center text-[11px] font-medium text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                <Play className="w-3 h-3 mr-1 fill-current pointer-events-none" />
                <span>Jump to {formatTime(chapter.start_sec)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
