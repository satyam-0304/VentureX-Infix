import React from 'react';
import { HelpCircle, X, Sparkles, BookOpen, GitFork } from 'lucide-react';
import { useLearning } from '../../contexts/LearningContext';

export interface ConfusionToastProps {
  isVisible: boolean;
  timestamp: number;
  onDismiss: () => void;
  onSelectMode: (mode: 'analogy' | 'step_by_step' | 'hinglish') => void;
}

export const ConfusionToast: React.FC<ConfusionToastProps> = ({
  isVisible,
  timestamp,
  onDismiss,
  onSelectMode
}) => {
  const { currentVideoTime } = useLearning();

  if (!isVisible) return null;

  const targetSec = timestamp !== undefined && timestamp !== null ? timestamp : currentVideoTime;
  const mins = Math.floor(targetSec / 60);
  const secs = Math.floor(targetSec % 60);
  const formattedTime = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="absolute bottom-16 right-4 left-4 sm:left-auto sm:right-6 sm:w-[380px] z-30 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto"
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-4 shadow-2xl shadow-indigo-950/60 text-white flex flex-col space-y-3">
        {/* Header row with badge and dismiss button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-300">
              <HelpCircle className="w-3.5 h-3.5 pointer-events-none" />
              <span>Intelligent Doubt Assistant</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
              at {formattedTime}
            </span>
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="Dismiss for 3 minutes"
              aria-label="Dismiss confusion notice"
            >
              <X className="w-3.5 h-3.5 pointer-events-none" />
            </button>
          </div>
        </div>

        {/* Message */}
        <div>
          <p className="text-xs font-medium text-slate-200 leading-relaxed">
            Having trouble understanding this section?
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Lurnix noticed repeated rewinds. Choose an explanation mode to unpack this concept:
          </p>
        </div>

        {/* Actions row: Analogy, Step-by-Step, Hinglish */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => onSelectMode('analogy')}
            className="flex items-center justify-center space-x-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 hover:border-indigo-400 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-indigo-100 hover:scale-[1.02] cursor-pointer shadow-sm"
            title="Explain with real-world analogy"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 pointer-events-none" />
            <span className="truncate">Analogy</span>
          </button>

          <button
            onClick={() => onSelectMode('step_by_step')}
            className="flex items-center justify-center space-x-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 hover:border-indigo-400 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-indigo-100 hover:scale-[1.02] cursor-pointer shadow-sm"
            title="Explain step by step"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-300 shrink-0 pointer-events-none" />
            <span className="truncate">Step-by-Step</span>
          </button>

          <button
            onClick={() => onSelectMode('hinglish')}
            className="flex items-center justify-center space-x-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 hover:border-indigo-400 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-indigo-100 hover:scale-[1.02] cursor-pointer shadow-sm"
            title="Explain in conversational Hinglish"
          >
            <GitFork className="w-3.5 h-3.5 text-orange-300 shrink-0 pointer-events-none" />
            <span className="truncate">Hinglish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
