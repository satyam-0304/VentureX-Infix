import React from 'react';
import { 
  Bookmark, 
  CheckCircle2, 
  ArrowRight,
  Check
} from 'lucide-react';
import { useLearning } from '../contexts/LearningContext';

export const ProgressView: React.FC = () => {
  const { sessions, setActiveSessionId, setActiveNavView, seekTo } = useLearning();

  // Aggregate all bookmarks across sessions
  const allBookmarks = sessions.flatMap((s) =>
    s.bookmarks.map((b) => ({ ...b, sessionTitle: s.title, sessionId: s.id }))
  );

  const handleSeekBookmark = (sessionId: string, timestamp: number) => {
    setActiveSessionId(sessionId);
    setActiveNavView('practice');
    setTimeout(() => {
      seekTo(timestamp);
    }, 100);
  };

  return (
    <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 select-none space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Learning Progress & Milestones</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track retention checks, quiz accuracy, and timestamped concepts.
        </p>
      </div>

      {/* Progress Metric Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Overall Syllabus Completion</span>
            <span className="text-indigo-600">35%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 w-[35%] rounded-full" />
          </div>
          <p className="text-[11px] text-slate-400">
            3 of 8 modules fully completed across STEM curriculum.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>First-Try Quiz Accuracy</span>
            <span className="text-emerald-600">92%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[92%] rounded-full" />
          </div>
          <p className="text-[11px] text-slate-400">
            High retention in monomer bonding & chemical kinetics.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>AI Tutor Inquiries</span>
            <span className="text-purple-600">14 Queries</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-[70%] rounded-full" />
          </div>
          <p className="text-[11px] text-slate-400">
            Active contextual assistance used throughout lectures.
          </p>
        </div>
      </div>

      {/* Two Column Grid: Bookmarked Moments + Active Checkpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookmarked Key Concepts */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <Bookmark className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">Bookmarked Concepts</h3>
            </div>
            <span className="text-xs text-slate-400">{allBookmarks.length} saved</span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {allBookmarks.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No timestamps bookmarked yet. Click the bookmark icon during any lecture!
              </div>
            ) : (
              allBookmarks.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => handleSeekBookmark(bm.sessionId, bm.timestamp)}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-[11px] text-indigo-600 font-semibold px-2 py-0.5 rounded bg-indigo-50 shrink-0">
                      {bm.formattedTime}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {bm.title}
                      </div>
                      <div className="text-[10px] text-slate-400">{bm.sessionTitle}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Learning Tasks Across Courses */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Curriculum Checkpoints</h3>
            </div>
            <span className="text-xs text-slate-400">5 Tasks in active session</span>
          </div>

          <div className="space-y-2">
            {sessions[0]?.tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  task.status === 'completed'
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      task.status === 'completed'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {task.status === 'completed' ? <Check className="w-3 h-3" /> : task.stepNumber}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{task.title}</div>
                    <div className="text-[10px] text-slate-400">{task.subtitle}</div>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    task.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {task.status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};
