import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  LearningSession, 
  Note, 
  Bookmark, 
  ActiveTab, 
  AppNavView, 
  ChatMessage, 
  DiscussionPost 
} from '../types';
import { DEFAULT_SESSIONS } from '../data/defaultSessions';
import { geminiService } from '../services/geminiService';

interface LearningContextType {
  sessions: LearningSession[];
  activeSession: LearningSession;
  activeSessionId: string;
  currentVideoTime: number;
  videoDuration: number;
  isPlaying: boolean;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  captionsEnabled: boolean;
  interactiveMode: boolean;
  activeCueText: string;
  activeTab: ActiveTab;
  activeNavView: AppNavView;
  sidebarExpanded: boolean;
  isAiTutorOpen: boolean;
  isNewSessionModalOpen: boolean;
  videoSeekTarget: number | null;
  aiTyping: boolean;

  // Actions
  setActiveSessionId: (id: string) => void;
  createSession: (courseName: string, code: string, topic?: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  deleteSession: (id: string) => boolean;
  updateVideoProgress: (time: number, duration?: number) => void;
  seekTo: (seconds: number) => void;
  clearSeekTarget: () => void;
  togglePlayPause: () => void;
  setIsPlaying: (playing: boolean) => void;
  cyclePlaybackSpeed: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleCaptions: () => void;
  toggleInteractiveMode: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  setActiveNavView: (view: AppNavView) => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  openAiTutor: () => void;
  closeAiTutor: () => void;
  toggleAiTutor: () => void;
  openNewSessionModal: () => void;
  closeNewSessionModal: () => void;
  addNote: (text: string) => void;
  deleteNote: (noteId: string) => void;
  addBookmark: (title?: string) => void;
  deleteBookmark: (bookmarkId: string) => void;
  selectTaskOption: (taskId: string, optionId: string) => void;
  submitTaskAnswer: (taskId: string) => { isCorrect: boolean; message: string };
  postDiscussion: (text: string) => void;
  upvoteDiscussion: (postId: string) => void;
  sendChatMessage: (text: string, mode?: 'standard' | 'simpler' | 'analogy' | 'step_by_step' | 'hinglish') => Promise<void>;
  updateSessionVideoUrl: (url: string) => void;
  setChapters: (chapters: import('../types').Chapter[]) => void;
  resetToDefaultSessions: () => void;
}

const STORAGE_KEY_SESSIONS = 'lurnix_sessions_v1';
const STORAGE_KEY_ACTIVE = 'lurnix_active_session_id_v1';

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export const LearningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial sessions from localStorage or default
  const [sessions, setSessions] = useState<LearningSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed reading sessions from localStorage', e);
    }
    return DEFAULT_SESSIONS;
  });

  const [activeSessionId, setActiveSessionIdState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (stored) return stored;
    } catch (e) {}
    return 'session-pl-04';
  });

  // Current active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || DEFAULT_SESSIONS[0];

  // Video playback states
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(activeSession.savedPlaybackPosition || 402);
  const [videoDuration, setVideoDuration] = useState<number>(activeSession.durationSeconds || 1110);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(1.0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [captionsEnabled, setCaptionsEnabled] = useState<boolean>(true);
  const [interactiveMode, setInteractiveMode] = useState<boolean>(true);
  const [videoSeekTarget, setVideoSeekTarget] = useState<number | null>(null);

  // Layout UI states
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [activeNavView, setActiveNavView] = useState<AppNavView>('practice');
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState<boolean>(false);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState<boolean>(false);
  const [aiTyping, setAiTyping] = useState<boolean>(false);

  // Active task cue text according to timestamp
  const [activeCueText, setActiveCueText] = useState<string>('Task 1 active at this timestamp');

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage', e);
    }
  }, [sessions]);

  // Sync activeSessionId to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeSessionId);
    } catch (e) {}
  }, [activeSessionId]);

  // When active session changes, restore its position and video duration
  useEffect(() => {
    if (activeSession) {
      setCurrentVideoTime(activeSession.savedPlaybackPosition || 0);
      setVideoDuration(activeSession.durationSeconds || 1110);
      setVideoSeekTarget(activeSession.savedPlaybackPosition || 0);
    }
  }, [activeSessionId]);

  // Update active task notification cue based on video timestamp
  useEffect(() => {
    if (currentVideoTime < 90) {
      setActiveCueText('Task 1 active at this timestamp');
    } else if (currentVideoTime < 150) {
      setActiveCueText('Task 2 active: Synthetic vs Natural');
    } else if (currentVideoTime < 240) {
      setActiveCueText('Task 3 active: Cross-linking mechanisms');
    } else if (currentVideoTime < 300) {
      setActiveCueText('Task 4 active: Real-world challenge');
    } else {
      setActiveCueText('Task 5 active: Lesson Revision');
    }
  }, [currentVideoTime]);

  const setActiveSessionId = (id: string) => {
    // Save current session's playback position before leaving
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, savedPlaybackPosition: currentVideoTime } : s))
    );
    setActiveSessionIdState(id);
  };

  const createSession = (courseName: string, code: string, topic?: string) => {
    const trimmedTitle = courseName.trim();
    if (!trimmedTitle) return;
    const finalCode = (code.trim() || trimmedTitle.slice(0, 2)).toUpperCase();
    const finalTopic = topic?.trim() || trimmedTitle.split(' ')[0];

    const newSession: LearningSession = {
      id: `session-${Date.now()}`,
      code: finalCode,
      title: trimmedTitle,
      courseName: trimmedTitle,
      topic: finalTopic,
      lessonTitle: `Introduction to ${trimmedTitle}`,
      lessonNumber: 'Video Lesson 01',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      posterUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      durationSeconds: 900,
      savedPlaybackPosition: 0,
      instructor: 'Professor Vance',
      rating: 5.0,
      reviewCount: 1,
      objectives: [
        `Core principles of ${trimmedTitle}`,
        `Practical applications in engineering`,
        `Synthesizing key frameworks`
      ],
      vocabulary: [
        { term: finalTopic },
        { term: 'Methodology' },
        { term: 'Analysis' }
      ],
      tasks: [
        {
          id: `task-${Date.now()}-1`,
          stepNumber: 1,
          title: 'Understanding Check',
          subtitle: 'Knowledge Retrieval',
          timestampTarget: 30,
          status: 'active',
          type: 'mcq',
          question: `What is the primary foundation of ${trimmedTitle}?`,
          options: [
            { id: 'opt-1', label: `Fundamental conceptual principles of ${finalTopic}.`, isCorrect: true },
            { id: 'opt-2', label: 'Arbitrary unrelated empirical assertions.', isCorrect: false },
            { id: 'opt-3', label: 'Isolated unverified hypothesis.', isCorrect: false }
          ],
          explanation: `Systematic foundations in ${trimmedTitle} emphasize rigorous verifiable principles.`,
          selectedOptionId: undefined,
          answeredCorrectly: false
        }
      ],
      notes: [],
      bookmarks: [],
      transcript: [
        { id: 'tr-0', timestamp: 0, formattedTime: '00:00', text: `Welcome to ${trimmedTitle}. In this lesson we establish the core concepts.` }
      ],
      discussions: [],
      chatHistory: [
        {
          id: `msg-${Date.now()}`,
          sender: 'ai',
          text: `Welcome to your new session on ${trimmedTitle}! I'm your AI tutor. Ask any questions as you watch.`,
          timestamp: 'Just now'
        }
      ],
      updatedAt: Date.now()
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionIdState(newSession.id);
    setIsNewSessionModalOpen(false);
  };

  const renameSession = (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: trimmed, courseName: trimmed } : s))
    );
  };

  const deleteSession = (id: string): boolean => {
    if (sessions.length <= 1) {
      alert('Cannot delete the only remaining session.');
      return false;
    }
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionIdState(remaining[0].id);
    }
    return true;
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const updateVideoProgress = (time: number, duration?: number) => {
    setCurrentVideoTime(time);
    if (duration && duration > 0) {
      setVideoDuration(duration);
    }
  };

  const seekTo = (seconds: number) => {
    setVideoSeekTarget(seconds);
    setCurrentVideoTime(seconds);
  };

  const clearSeekTarget = () => {
    setVideoSeekTarget(null);
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const cyclePlaybackSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeedState(nextSpeed);
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (v > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const toggleCaptions = () => {
    setCaptionsEnabled((prev) => !prev);
  };

  const toggleInteractiveMode = () => {
    setInteractiveMode((prev) => !prev);
  };

  const toggleSidebar = () => {
    setSidebarExpanded((prev) => !prev);
  };

  const openAiTutor = () => setIsAiTutorOpen(true);
  const closeAiTutor = () => setIsAiTutorOpen(false);
  const toggleAiTutor = () => setIsAiTutorOpen((prev) => !prev);

  const openNewSessionModal = () => setIsNewSessionModalOpen(true);
  const closeNewSessionModal = () => setIsNewSessionModalOpen(false);

  // Notes
  const addNote = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newNote: Note = {
      id: `note-${Date.now()}`,
      timestamp: currentVideoTime,
      formattedTime: formatSeconds(currentVideoTime),
      text: trimmed,
      createdAt: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, notes: [newNote, ...s.notes], updatedAt: Date.now() }
          : s
      )
    );
  };

  const deleteNote = (noteId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, notes: s.notes.filter((n) => n.id !== noteId) }
          : s
      )
    );
  };

  // Bookmarks
  const addBookmark = (title?: string) => {
    const formatted = formatSeconds(currentVideoTime);
    const newBookmark: Bookmark = {
      id: `bm-${Date.now()}`,
      timestamp: currentVideoTime,
      formattedTime: formatted,
      title: title || `Bookmark at ${formatted}`,
    };
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, bookmarks: [...s.bookmarks, newBookmark] }
          : s
      )
    );
  };

  const deleteBookmark = (bookmarkId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, bookmarks: s.bookmarks.filter((b) => b.id !== bookmarkId) }
          : s
      )
    );
  };

  // Tasks & Quizzes
  const selectTaskOption = (taskId: string, optionId: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, selectedOptionId: optionId } : t)),
        };
      })
    );
  };

  const submitTaskAnswer = (taskId: string): { isCorrect: boolean; message: string } => {
    let result = { isCorrect: false, message: '' };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        const targetTask = s.tasks.find((t) => t.id === taskId);
        if (!targetTask || !targetTask.options) return s;

        const selectedOpt = targetTask.options.find((o) => o.id === targetTask.selectedOptionId);
        const isCorrect = !!selectedOpt?.isCorrect;

        if (isCorrect) {
          result = { isCorrect: true, message: 'Correct answer! Excellent comprehension.' };
        } else {
          result = { isCorrect: false, message: 'Incorrect option. Review the explanation below.' };
        }

        // Update task and unlock next task if correct
        const nextTasks = s.tasks.map((t, idx, arr) => {
          if (t.id === taskId) {
            return {
              ...t,
              status: isCorrect ? ('completed' as const) : t.status,
              answeredCorrectly: isCorrect,
            };
          }
          // If previous task was completed, unlock this one
          const prevTask = arr[idx - 1];
          if (prevTask && prevTask.id === taskId && isCorrect && t.status === 'locked') {
            return { ...t, status: 'active' as const };
          }
          return t;
        });

        return { ...s, tasks: nextTasks, updatedAt: Date.now() };
      })
    );

    return result;
  };

  // Discussions
  const postDiscussion = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newPost: DiscussionPost = {
      id: `disc-${Date.now()}`,
      authorName: 'Simona Biles',
      authorRole: 'Student',
      timeAgo: 'Just now',
      content: trimmed,
      upvotes: 1,
      hasUpvoted: true,
    };
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, discussions: [newPost, ...s.discussions] }
          : s
      )
    );
  };

  const upvoteDiscussion = (postId: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          discussions: s.discussions.map((d) => {
            if (d.id === postId) {
              const hasUpvoted = !d.hasUpvoted;
              return {
                ...d,
                hasUpvoted,
                upvotes: hasUpvoted ? d.upvotes + 1 : Math.max(0, d.upvotes - 1),
              };
            }
            return d;
          }),
        };
      })
    );
  };

  // AI Chat
  const sendChatMessage = async (text: string, mode?: 'standard' | 'simpler' | 'analogy' | 'step_by_step' | 'hinglish') => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: formatSeconds(currentVideoTime),
    };

    // Add user message immediately
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, chatHistory: [...s.chatHistory, userMessage] }
          : s
      )
    );

    setAiTyping(true);

    try {
      const activeTask = activeSession.tasks.find((t) => t.status === 'active');
      const payload = {
        sessionTitle: activeSession.title,
        courseTopic: activeSession.topic,
        currentTimestamp: currentVideoTime,
        formattedTime: formatSeconds(currentVideoTime),
        activeTaskId: activeTask?.id,
        activeTaskTitle: activeTask?.title,
        recentNotes: activeSession.notes.slice(0, 3).map((n) => n.text),
        userQuery: trimmed,
        mode: mode || 'standard',
      };

      const response = await geminiService.askTutor(payload);

      const aiMessage: ChatMessage = {
        id: `chat-ai-${Date.now()}`,
        sender: 'ai',
        text: response.answer,
        timestamp: formatSeconds(currentVideoTime),
        isContextual: true,
        relatedTimestamp: response.relatedTimestamp,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, chatHistory: [...s.chatHistory, aiMessage] }
            : s
        )
      );

      // If response has related timestamp and user was asking about concept, offer option or highlight
      if (response.relatedTimestamp !== undefined && interactiveMode) {
        // can auto-seek or suggest
      }
    } finally {
      setAiTyping(false);
    }
  };

  const updateSessionVideoUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, videoUrl: trimmed, updatedAt: Date.now() } : s))
    );
  };

  const setChapters = (chapters: import('../types').Chapter[]) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, chapters, updatedAt: Date.now() } : s))
    );
  };

  const resetToDefaultSessions = () => {
    setSessions(DEFAULT_SESSIONS);
    setActiveSessionIdState(DEFAULT_SESSIONS[0].id);
    localStorage.removeItem(STORAGE_KEY_SESSIONS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
  };

  return (
    <LearningContext.Provider
      value={{
        sessions,
        activeSession,
        activeSessionId,
        currentVideoTime,
        videoDuration,
        isPlaying,
        playbackSpeed,
        volume,
        isMuted,
        captionsEnabled,
        interactiveMode,
        activeCueText,
        activeTab,
        activeNavView,
        sidebarExpanded,
        isAiTutorOpen,
        isNewSessionModalOpen,
        videoSeekTarget,
        aiTyping,
        setActiveSessionId,
        createSession,
        renameSession,
        deleteSession,
        updateVideoProgress,
        seekTo,
        clearSeekTarget,
        togglePlayPause,
        setIsPlaying,
        cyclePlaybackSpeed,
        setVolume,
        toggleMute,
        toggleCaptions,
        toggleInteractiveMode,
        setActiveTab,
        setActiveNavView,
        toggleSidebar,
        setSidebarExpanded,
        openAiTutor,
        closeAiTutor,
        toggleAiTutor,
        openNewSessionModal,
        closeNewSessionModal,
        addNote,
        deleteNote,
        addBookmark,
        deleteBookmark,
        selectTaskOption,
        submitTaskAnswer,
        postDiscussion,
        upvoteDiscussion,
        sendChatMessage,
        updateSessionVideoUrl,
        setChapters,
        resetToDefaultSessions,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
};

export const useLearning = () => {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
};
