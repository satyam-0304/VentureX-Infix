import React from 'react';
import { 
  PlayCircle, 
  Flame, 
  Clock, 
  Award, 
  CheckCircle, 
  ArrowRight,
  Brain
} from 'lucide-react';
import { useLearning } from '../contexts/LearningContext';

export const DashboardView: React.FC = () => {
  const { sessions, activeSession, setActiveSessionId, setActiveNavView } = useLearning();

  const totalTasks = sessions.reduce((acc, s) => acc + s.tasks.length, 0);
  const completedTasks = sessions.reduce(
    (acc, s) => acc + s.tasks.filter((t) => t.status === 'completed').length,
    0
  );

  const handleLaunchSession = (id: string) => {
    setActiveSessionId(id);
    setActiveNavView('practice');
  };

  return (
    <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 select-none space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[11px] text-indigo-300 font-medium">
            <Brain className="w-3.5 h-3.5" />
            <span>Interactive Learning Workspace</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, Simona!
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            You're currently studying <span className="text-indigo-300 font-semibold">{activeSession.courseName || activeSession.title}</span>.
            Your interactive learning checkpoint is waiting at timestamp {activeSession.tasks?.[0]?.subtitle || '01:00'}.
          </p>
        </div>

        <button
          onClick={() => setActiveNavView('practice')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-transform hover:scale-105 cursor-pointer"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Resume Active Lesson</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Flame className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">5 Days</div>
            <div className="text-[11px] text-slate-400 font-medium">Daily Streak</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">4.2 hrs</div>
            <div className="text-[11px] text-slate-400 font-medium">Active Learning</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">
              {completedTasks}/{totalTasks}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Tasks Completed</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">92%</div>
            <div className="text-[11px] text-slate-400 font-medium">Quiz Accuracy</div>
          </div>
        </div>
      </div>

      {/* Available Courses & Learning Sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">Enrolled Courses & Sessions</h2>
          <span className="text-xs text-slate-400">{sessions.length} Active Sessions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleLaunchSession(session.id)}
              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    {session.code}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {Math.round((session.durationSeconds || 900) / 60)} min
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {session.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{session.courseName}</p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                <span>Resume Lecture</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};
