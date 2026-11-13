import React from 'react';
import { Clock, CheckCircle2, Star, ArrowLeft } from 'lucide-react';
import { useLearning } from '../contexts/LearningContext';
import { VideoPlayer } from '../components/VideoPlayer/VideoPlayer';
import { LectureTabs } from '../components/Tabs/LectureTabs';
import { ActivitiesPanel } from '../components/LearningActivities/ActivitiesPanel';

export const LearningWorkspace: React.FC = () => {
  const { activeSession, sessions, setActiveSessionId } = useLearning();

  const durationMinutes = Math.round((activeSession.durationSeconds || 1110) / 60);
  const taskCount = activeSession.tasks.length || 5;

  return (
    <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-5 select-none">
      {/* Header & Breadcrumbs Section */}
      <div className="mb-5">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-2">
          <button
            onClick={() => {
              // cycle or previous session
              const idx = sessions.findIndex((s) => s.id === activeSession.id);
              if (idx > 0) setActiveSessionId(sessions[idx - 1].id);
            }}
            className="p-1 rounded-md hover:bg-slate-200/70 text-slate-600 transition-colors"
            title="Go to previous session"
          >
            <ArrowLeft className="w-3.5 h-3.5 pointer-events-none" />
          </button>
          <span className="hover:underline cursor-pointer">Courses</span>
          <span>/</span>
          <span className="hover:underline cursor-pointer">{activeSession.courseName}</span>
          <span>/</span>
          <span className="hover:underline cursor-pointer">{activeSession.topic}</span>
          <span>/</span>
          <span className="text-slate-800 font-medium">{activeSession.lessonNumber}</span>
        </div>

        {/* Title and Metadata Info */}
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {activeSession.lessonTitle}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Learn actively, understand deeply.
            </p>
          </div>

          {/* Lesson Metadata Badges */}
          <div className="flex items-center space-x-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-indigo-500 pointer-events-none" />
              <span>{durationMinutes} min</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 pointer-events-none" />
              <span>{taskCount} tasks</span>
            </div>

            <div className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 pointer-events-none" />
              <span>{activeSession.rating || 4.9}</span>
              <span className="text-slate-400 font-normal">
                ({activeSession.reviewCount || 142} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Workspace Grid (~65% / ~35%) */}
      <div className="grid grid-cols-12 gap-6 items-start pb-8">
        {/* Left Column: Video Player & Lecture Tabs */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col space-y-5">
          <VideoPlayer />
          <LectureTabs />
        </div>

        {/* Right Column: Interactive Learning Activities Sheet */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col">
          <ActivitiesPanel />
        </div>
      </div>
    </main>
  );
};
