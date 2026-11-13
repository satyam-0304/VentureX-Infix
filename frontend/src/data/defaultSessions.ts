import { LearningSession } from '../types';

export const DEFAULT_SESSIONS: LearningSession[] = [
  {
    id: 'session-default-01',
    code: 'LX',
    title: 'New Learning Session',
    courseName: 'Online Lecture',
    topic: 'Lecture',
    lessonTitle: 'Enter a YouTube URL to start',
    lessonNumber: 'Session 01',
    videoUrl: '',
    posterUrl: '',
    durationSeconds: 0,
    savedPlaybackPosition: 0,
    instructor: 'AI Tutor',
    rating: 5.0,
    reviewCount: 0,
    objectives: [
      'Paste any YouTube lecture URL to auto-generate chapters, notes, and quiz checkpoints.'
    ],
    vocabulary: [],
    tasks: [],
    notes: [],
    bookmarks: [],
    transcript: [],
    chapters: [],
    discussions: [],
    chatHistory: [
      {
        id: 'chat-init',
        sender: 'ai',
        text: 'Welcome to Lurnix! Paste any YouTube educational video URL to begin studying with synchronized interactive chapters, quizzes, and grounded AI tutor support.',
        timestamp: 'Just now'
      }
    ],
    updatedAt: Date.now()
  }
];
