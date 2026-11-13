export interface Note {
  id: string;
  timestamp: number;
  formattedTime: string;
  text: string;
  createdAt: number;
}

export interface Bookmark {
  id: string;
  timestamp: number;
  formattedTime: string;
  title: string;
}

export interface QuizOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface ActivityTask {
  id: string;
  stepNumber: number;
  title: string;
  subtitle?: string;
  timestampTarget?: number;
  status: 'locked' | 'active' | 'completed';
  type: 'mcq' | 'concept' | 'challenge' | 'revision';
  question?: string;
  options?: QuizOption[];
  explanation?: string;
  selectedOptionId?: string;
  answeredCorrectly?: boolean;
  contentDescription?: string;
}

export interface TranscriptLine {
  id: string;
  timestamp: number;
  formattedTime: string;
  text: string;
}

export interface VocabularyItem {
  term: string;
  pronounceWord?: string;
}

export interface DiscussionPost {
  id: string;
  authorName: string;
  authorRole?: string;
  timeAgo: string;
  content: string;
  upvotes: number;
  hasUpvoted?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isContextual?: boolean;
  relatedTimestamp?: number;
}

export interface LearningSession {
  id: string;
  code: string;
  title: string;
  courseName: string;
  topic: string;
  lessonTitle: string;
  lessonNumber: string;
  videoUrl: string;
  posterUrl: string;
  durationSeconds: number;
  savedPlaybackPosition: number;
  instructor: string;
  rating: number;
  reviewCount: number;
  objectives: string[];
  vocabulary: VocabularyItem[];
  tasks: ActivityTask[];
  notes: Note[];
  bookmarks: Bookmark[];
  transcript: TranscriptLine[];
  discussions: DiscussionPost[];
  chatHistory: ChatMessage[];
  updatedAt: number;
}

export type ActiveTab = 'overview' | 'notes' | 'transcript' | 'discussion';
export type AppNavView = 'dashboard' | 'learning_hub' | 'practice' | 'progress';

