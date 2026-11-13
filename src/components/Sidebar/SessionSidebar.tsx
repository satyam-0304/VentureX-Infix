import React, { useState } from 'react';
import { 
  ChevronRight, 
  Plus, 
  Search, 
  Sun, 
  Moon, 
  Settings, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  Sparkles
} from 'lucide-react';
import { useLearning } from '../../contexts/LearningContext';

export const SessionSidebar: React.FC = () => {
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    sidebarExpanded,
    toggleSidebar,
    openNewSessionModal,
    isNewSessionModalOpen,
    closeNewSessionModal,
    createSession,
    renameSession,
    deleteSession
  } = useLearning();

  const [searchFilter, setSearchFilter] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // New Session form state
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseAbbr, setNewCourseAbbr] = useState('');

  const filteredSessions = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.topic.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleStartRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      renameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Are you sure you want to delete the session "${title}"? This cannot be undone.`);
    if (confirmed) {
      deleteSession(id);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCourseName.trim()) {
      createSession(newCourseName.trim(), newCourseAbbr.trim());
      setNewCourseName('');
      setNewCourseAbbr('');
    }
  };

  return (
    <>
      <aside
        id="mainSidebar"
        className={`transition-all duration-300 ease-in-out bg-[#0f141c] flex flex-col items-center py-5 justify-between shrink-0 select-none z-20 relative overflow-hidden ${
          sidebarExpanded ? 'w-[240px]' : 'w-[70px]'
        }`}
        data-purpose="session-sidebar"
      >
        {/* Top Section: App Glyph & Session Shortcuts */}
        <div className="flex flex-col items-center w-full">
          {/* Header Brand & Toggle Button */}
          <div className="flex items-center justify-between w-full px-3 mb-4">
            <button
              onClick={() => setActiveSessionId(sessions[0]?.id || '')}
              className="w-10 h-10 rounded-xl bg-white/95 border border-slate-700/60 shadow-lg shadow-indigo-950/40 flex items-center justify-center p-1.5 hover:scale-105 transition-transform shrink-0 cursor-pointer overflow-hidden"
              title="LURNIX Home"
            >
              <img
                src="/lurnix-mark.png"
                alt="LURNIX Emblem"
                className="w-full h-full object-contain"
              />
            </button>

            {sidebarExpanded && (
              <span className="text-white font-bold text-sm tracking-tight pl-2 whitespace-nowrap overflow-hidden animate-fade-in flex items-center space-x-1">
                <span>LURNIX</span>
                <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded">AI</span>
              </span>
            )}

            <button
              onClick={toggleSidebar}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors ml-auto"
              title={sidebarExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              <ChevronRight
                className={`w-4 h-4 pointer-events-none transition-transform duration-300 ${
                  sidebarExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Divider */}
          <div className="w-full px-3 mb-3">
            <div className="w-full h-[1px] bg-slate-800" />
          </div>

          {/* Live Search field (visible in expanded mode) */}
          {sidebarExpanded && (
            <div className="w-full px-3 mb-3 animate-fade-in">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter sessions..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 pl-7 pr-2 py-1.5 focus:outline-none focus:border-indigo-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2 pointer-events-none" />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Session List Container */}
          <nav
            aria-label="Course Sessions"
            className="flex flex-col items-center space-y-2 w-full px-2 max-h-[520px] overflow-y-auto"
          >
            {filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = editingSessionId === session.id;

              return (
                <div key={session.id} className="w-full group/session relative">
                  <button
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full flex items-center transition-all ${
                      sidebarExpanded ? 'px-2.5 py-2 justify-start space-x-2.5' : 'justify-center py-1'
                    } rounded-lg ${
                      isActive
                        ? 'bg-white text-slate-900 font-bold shadow-md ring-2 ring-indigo-500/20'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white font-medium'
                    }`}
                    title={`${session.title} (${session.code})`}
                  >
                    {!sidebarExpanded ? (
                      <span className="w-11 h-9 rounded-lg flex items-center justify-center text-xs font-bold">
                        {session.code}
                      </span>
                    ) : isEditing ? (
                      <div
                        className="flex items-center space-x-1.5 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="w-6 h-6 rounded bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {session.code}
                        </span>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(e as any, session.id);
                            if (e.key === 'Escape') handleCancelRename(e as any);
                          }}
                          className="flex-1 bg-slate-900 text-white text-xs px-2 py-1 rounded border border-indigo-500 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={(e) => handleSaveRename(e, session.id)}
                          className="text-emerald-400 hover:text-emerald-300 p-0.5"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="text-rose-400 hover:text-rose-300 p-0.5"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span
                          className={`w-7 h-7 rounded-md ${
                            isActive ? 'bg-slate-900 text-white' : 'bg-slate-800 text-slate-300'
                          } text-xs font-bold flex items-center justify-center shrink-0`}
                        >
                          {session.code}
                        </span>
                        <span
                          className={`text-xs text-left truncate flex-1 ${
                            isActive ? 'text-slate-900 font-semibold' : 'text-slate-300'
                          }`}
                        >
                          {session.title}
                        </span>

                        {/* Inline Actions (Rename & Delete) */}
                        <div className="opacity-0 group-hover/session:opacity-100 flex items-center space-x-1 shrink-0 transition-opacity">
                          <button
                            onClick={(e) => handleStartRename(e, session.id, session.title)}
                            className={`p-1 rounded hover:bg-slate-200/50 ${
                              isActive ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Rename session"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          {sessions.length > 1 && (
                            <button
                              onClick={(e) => handleDelete(e, session.id, session.title)}
                              className={`p-1 rounded hover:bg-rose-100/50 ${
                                isActive ? 'text-rose-600 hover:text-rose-700' : 'text-slate-400 hover:text-rose-400'
                              }`}
                              title="Delete session"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Add New Learning Session Button */}
          <div className="w-full px-2 mt-2 flex justify-center">
            <button
              onClick={openNewSessionModal}
              className={`rounded-lg border border-dashed border-slate-700 text-slate-400 flex items-center justify-center hover:border-slate-400 hover:text-white transition-colors group shrink-0 ${
                sidebarExpanded ? 'w-full justify-start px-3 py-2 space-x-2' : 'w-11 h-9'
              }`}
              title="Start New Learning Session"
            >
              <Plus className="w-4 h-4 pointer-events-none group-hover:scale-110 transition-transform" />
              {sidebarExpanded && <span className="text-xs font-medium">New Session</span>}
            </button>
          </div>
        </div>

        {/* Bottom Controls: Appearance Toggle & Settings */}
        <div className="flex flex-col items-center space-y-3 w-full px-2">
          {/* Light / Dark Mode Segmented Pill */}
          <div className="bg-slate-800/90 p-1 rounded-xl flex flex-col space-y-1">
            <button
              onClick={() => setIsDarkMode(false)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                !isDarkMode ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Light theme"
            >
              <Sun className="w-3.5 h-3.5 pointer-events-none" />
            </button>
            <button
              onClick={() => setIsDarkMode(true)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                isDarkMode ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Dark theme (Preview)"
            >
              <Moon className="w-3.5 h-3.5 pointer-events-none" />
            </button>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={() => alert('LURNIX Platform Version 1.0.0\nReady for Gemini 1.5 / 2.0 Integration')}
            className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            title="Platform Settings"
          >
            <Settings className="w-4 h-4 pointer-events-none" />
          </button>
        </div>
      </aside>

      {/* Modal for Creating New Session */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Add Learning Session</h3>
              </div>
              <button
                onClick={closeNewSessionModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course or Lecture Name
                </label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. Quantum Computing"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Abbreviation (2 Letters)
                </label>
                <input
                  type="text"
                  value={newCourseAbbr}
                  onChange={(e) => setNewCourseAbbr(e.target.value.toUpperCase())}
                  maxLength={2}
                  placeholder="QC"
                  className="w-full uppercase text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 font-bold tracking-wider"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Leave blank to auto-generate from the first 2 letters.
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={closeNewSessionModal}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow transition-colors"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

