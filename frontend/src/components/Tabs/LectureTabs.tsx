import React, { useState } from 'react';
import { 
  Check, 
  Trash2, 
  Clock, 
  Send, 
  ThumbsUp,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useLearning } from '../../contexts/LearningContext';
import { formatVideoTime } from '../../utils/timeFormat';

export const LectureTabs: React.FC = () => {
  const {
    activeSession,
    activeTab,
    setActiveTab,
    currentVideoTime,
    seekTo,
    addNote,
    deleteNote,
    postDiscussion,
    upvoteDiscussion,
    setActiveNavView
  } = useLearning();

  const [noteText, setNoteText] = useState('');
  const [discussionInput, setDiscussionInput] = useState('');

  const formatTime = formatVideoTime;

  const currentFormattedTime = formatTime(currentVideoTime);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteText.trim()) {
      addNote(noteText.trim());
      setNoteText('');
    }
  };

  const handlePostDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (discussionInput.trim()) {
      postDiscussion(discussionInput.trim());
      setDiscussionInput('');
    }
  };

  return (
    <div
      data-purpose="lecture-details"
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
    >
      {/* Tabs Navigation */}
      <div className="flex items-center space-x-6 border-b border-slate-100 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 -mb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'text-indigo-600 border-indigo-600'
              : 'text-slate-400 hover:text-slate-700 border-transparent'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-3 -mb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'notes'
              ? 'text-indigo-600 border-indigo-600'
              : 'text-slate-400 hover:text-slate-700 border-transparent'
          }`}
        >
          My Notes ({activeSession.notes.length})
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`pb-3 -mb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'transcript'
              ? 'text-indigo-600 border-indigo-600'
              : 'text-slate-400 hover:text-slate-700 border-transparent'
          }`}
        >
          Transcript ({activeSession.transcript.length})
        </button>

        <button
          onClick={() => setActiveTab('discussion')}
          className={`pb-3 -mb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'discussion'
              ? 'text-indigo-600 border-indigo-600'
              : 'text-slate-400 hover:text-slate-700 border-transparent'
          }`}
        >
          Discussion
        </button>
      </div>

      {/* TAB PANEL 1: Overview */}
      {activeTab === 'overview' && (
        <div id="tabPanelOverview" className="pt-4 space-y-4 animate-fade-in">
          <p className="text-xs text-slate-600 leading-relaxed">
            In this interactive lecture,{' '}
            <span className="font-semibold text-slate-800">{activeSession.instructor}</span>{' '}
            explores {activeSession.title.toLowerCase()}, examining structural relationships,
            bonding mechanics, and functional material applications.
          </p>

          {/* Flashcards Call-to-Action Card */}
          <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-white p-3.5 rounded-2xl border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Study Lecture Flashcards</h4>
                <p className="text-[11px] text-slate-500">Master definitions, formulas, and concepts from this video</p>
              </div>
            </div>
            <button
              onClick={() => setActiveNavView('flashcards')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1"
            >
              <span>Practice Deck</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Key Objectives Grid */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Key Learning Objectives
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {activeSession.objectives.map((obj, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2"
                >
                  <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span className="text-xs text-slate-700 font-medium leading-snug">{obj}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB PANEL 2: My Notes */}
      {activeTab === 'notes' && (
        <div id="tabPanelNotes" className="pt-4 space-y-4 animate-fade-in">
          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="flex flex-col space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Jot down a quick thought or key takeaway at current timestamp..."
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-indigo-600 font-mono font-medium flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Timestamp: {currentFormattedTime}</span>
              </span>
              <button
                type="submit"
                disabled={!noteText.trim()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <span>Save Note</span>
              </button>
            </div>
          </form>

          {/* Notes List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {activeSession.notes.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No notes captured yet. Take notes as you watch the lecture video!
              </div>
            ) : (
              activeSession.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between group hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-start space-x-2.5 flex-1">
                    <button
                      onClick={() => seekTo(note.timestamp)}
                      className="font-mono text-[11px] text-indigo-600 font-semibold px-1.5 py-0.5 rounded bg-indigo-50 shrink-0 mt-0.5 hover:bg-indigo-100 cursor-pointer"
                      title="Jump video to note timestamp"
                    >
                      {note.formattedTime}
                    </button>
                    <p className="text-xs text-slate-700 leading-snug">{note.text}</p>
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity ml-2 p-1"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB PANEL 3: Transcript */}
      {activeTab === 'transcript' && (
        <div id="tabPanelTranscript" className="pt-4 space-y-1.5 max-h-64 overflow-y-auto pr-1 animate-fade-in">
          {activeSession.transcript.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <p className="font-semibold text-slate-500 mb-1">Synchronizing Dialogue Track</p>
              <p>Fetching full transcript for this lecture...</p>
            </div>
          ) : (
            activeSession.transcript.map((line) => {
              const isCurrent =
                currentVideoTime >= line.timestamp &&
                currentVideoTime < line.timestamp + 30;

              return (
                <div
                  key={line.id}
                  className={`p-2 rounded-lg transition-all flex items-start space-x-3 ${
                    isCurrent
                      ? 'bg-indigo-50 border border-indigo-200 shadow-xs'
                      : 'hover:bg-indigo-50/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => seekTo(line.timestamp)}
                    className="font-mono text-[11px] text-indigo-600 font-semibold mt-0.5 shrink-0 px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 cursor-pointer transition-colors"
                    title={`Jump video to ${line.formattedTime}`}
                  >
                    {line.formattedTime}
                  </button>
                  <p className={`text-xs leading-snug ${isCurrent ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
                    {line.text}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB PANEL 4: Discussion */}
      {activeTab === 'discussion' && (
        <div id="tabPanelDiscussion" className="pt-4 space-y-3 animate-fade-in">
          {/* Post Form */}
          <form onSubmit={handlePostDiscussion} className="flex items-center space-x-2">
            <input
              type="text"
              value={discussionInput}
              onChange={(e) => setDiscussionInput(e.target.value)}
              placeholder="Ask a question or share a thought on this lecture..."
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!discussionInput.trim()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <span>Post</span>
              <Send className="w-3 h-3" />
            </button>
          </form>

          {/* Discussion List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {activeSession.discussions.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800">{item.authorName}</span>
                    <span className="text-[10px] text-slate-400">{item.timeAgo}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{item.content}</p>
                </div>
                <button
                  onClick={() => upvoteDiscussion(item.id)}
                  className={`flex items-center space-x-1 text-xs font-semibold px-2 py-1 rounded border transition-colors cursor-pointer ${
                    item.hasUpvoted
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:text-indigo-600'
                  }`}
                  title="Upvote"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>{item.upvotes}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
