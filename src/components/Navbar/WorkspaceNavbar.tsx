import React, { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { useLearning } from '../../contexts/LearningContext';
import { AppNavView } from '../../types';

export const WorkspaceNavbar: React.FC = () => {
  const { activeNavView, setActiveNavView } = useLearning();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(2);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const navItems: { id: AppNavView; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'learning_hub', label: 'Learning Hub' },
    { id: 'practice', label: 'Practice' },
    { id: 'progress', label: 'Progress' }
  ];

  return (
    <>
      <header className="h-[68px] px-6 lg:px-8 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 select-none z-10">
        {/* Logo Branding */}
        <div className="flex items-center space-x-3">
          <div
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setActiveNavView('practice')}
            title="LURNIX Learning Workspace"
          >
            <img
              src="/lurnix-logo.png"
              alt="LURNIX"
              className="h-7 w-auto object-contain"
            />
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              AI
            </span>
          </div>
        </div>

        {/* Center Pill Nav Tabs */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-full text-xs font-semibold text-slate-600"
        >
          {navItems.map((item) => {
            const isActive = activeNavView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNavView(item.id)}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Side Utility Controls & Student Profile */}
        <div className="flex items-center space-x-3.5">
          {/* Quick Search Button */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            title="Search lessons (⌘F)"
          >
            <Search className="w-4 h-4 pointer-events-none" />
          </button>

          {/* Notification Bell with Badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationMenu((prev) => !prev)}
              className="relative w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 pointer-events-none" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-30 animate-fade-in text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-semibold text-slate-800">
                  <span>Notifications</span>
                  <button
                    onClick={() => setNotificationCount(0)}
                    className="text-[10px] text-indigo-600 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="py-2 space-y-2">
                  <div className="p-2 bg-indigo-50/60 rounded-lg">
                    <p className="font-medium text-slate-800">Task 1 Checkpoint Ready</p>
                    <p className="text-[11px] text-slate-500">Solve the polymers MCQ to unlock module 2.</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-800">AI Tutor Available</p>
                    <p className="text-[11px] text-slate-500">Press ⌘K anytime for personalized lecture explanations.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Name */}
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
              alt="Simona Biles avatar"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20"
            />
            <div className="hidden xl:block text-left text-xs leading-tight">
              <div className="font-semibold text-slate-800">Simona Biles</div>
              <div className="text-slate-400 font-normal">simona@lurnix.edu</div>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 w-full max-w-md shadow-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-700">Quick Lecture Search</span>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕ Esc
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search concepts, formulas, or lectures..."
                className="w-full text-xs p-2.5 pl-8 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600"
                autoFocus
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
            </div>
            <div className="text-[11px] text-slate-400">
              Popular: <span className="text-indigo-600 cursor-pointer underline">Polymers</span>, <span className="text-indigo-600 cursor-pointer underline">Vulcanization</span>, <span className="text-indigo-600 cursor-pointer underline">Monomers</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
