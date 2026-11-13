export interface Chapter {
  id: number;
  title: string;
  start_sec: number;
  end_sec: number;
  summary?: string;
}

export interface YouTubePlayerContextType {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  seekTo: (seconds: number) => void;
  pause: () => void;
  play: () => void;
  chapters: Chapter[];
  activeChapter: Chapter | null;
}

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
  chapters?: Chapter[];
  discussions: DiscussionPost[];
  chatHistory: ChatMessage[];
  updatedAt: number;
}

export type ActiveTab = 'overview' | 'notes' | 'transcript' | 'discussion';
export type AppNavView = 'dashboard' | 'learning_hub' | 'practice' | 'flashcards' | 'progress' | 'profile';

export type FlashcardCategory = 'Definition' | 'Concept' | 'Formula' | 'Important Fact';
export type FlashcardConfidence = 'not_confident' | 'somewhat_confident' | 'very_confident' | 'unreviewed';

export interface FlashcardItem {
  id: string;
  deck_id: string;
  question: string;
  answer: string;
  category: FlashcardCategory;
  chapter_title?: string;
  timestamp_sec: number;
  timestamp_formatted: string;
  confidence: FlashcardConfidence;
  is_bookmarked: boolean;
  review_count: number;
  last_reviewed_at?: number | null;
  order_index: number;
  created_at: number;
}

export interface FlashcardDeck {
  id: string;
  user_id: string;
  video_id: string;
  session_id?: string;
  title: string;
  description?: string;
  card_count: number;
  mastered_count: number;
  created_at: number;
  updated_at: number;
  cards: FlashcardItem[];
}


