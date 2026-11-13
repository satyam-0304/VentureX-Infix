/**
 * LURNIX Video Ingestion & Curriculum Sync Service
 *
 * Communicates with the FastAPI backend to ingest any YouTube URL,
 * extract transcripts/chapters, and retrieve pre-generated or dynamic
 * concept-tagged quizzes and notes.
 *
 * Fallback hierarchy (backend offline):
 *   1. Known demo slugs (Polymers / Neural Nets / EM) → rich pre-seeded content
 *   2. Any other video ID → domain-agnostic generic scaffold (NO Polymer text)
 */

import { ActivityTask, Chapter, Note, QuizOption, TranscriptLine } from '../types';
import { extractYouTubeVideoId } from '../hooks/useYouTubePlayer';

export interface IngestedVideoData {
  videoId: string;
  title: string;
  durationSec: number;
  cached: boolean;
  chapters: Chapter[];
  tasks: ActivityTask[];
  notes: Note[];
  transcript: TranscriptLine[];
}

class VideoService {
  private apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  /**
   * Ingests a YouTube URL or video ID from the backend.
   * If backend is unreachable, falls back gracefully to client-side extraction.
   */
  async ingestVideo(urlOrId: string): Promise<IngestedVideoData> {
    const trimmed = urlOrId.trim();
    const cleanId = extractYouTubeVideoId(trimmed) || trimmed;

    // 1. Attempt backend ingestion
    try {
      const ingestRes = await fetch(`${this.apiBaseUrl}/api/video/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: trimmed }),
      });

      if (ingestRes.ok) {
        const ingestData = await ingestRes.json();
        const videoId = ingestData.video_id;
        const title = ingestData.title || `Lecture (${videoId})`;
        const durationSec = ingestData.duration_sec || 1200;
        const chapters: Chapter[] = ingestData.chapters || [];

        // Fetch notes and quizzes in parallel
        const [notesRes, quizRes] = await Promise.allSettled([
          fetch(`${this.apiBaseUrl}/api/video/${videoId}/notes`),
          fetch(`${this.apiBaseUrl}/api/video/${videoId}/quiz`),
        ]);

        let notes: Note[] = [];
        if (notesRes.status === 'fulfilled' && notesRes.value.ok) {
          const rawNotes = await notesRes.value.json();
          notes = this.mapBackendNotesToNotes(rawNotes);
        }

        let tasks: ActivityTask[] = [];
        if (quizRes.status === 'fulfilled' && quizRes.value.ok) {
          const rawQuiz = await quizRes.value.json();
          tasks = this.mapBackendQuizToTasks(rawQuiz);
        }

        // If tasks empty, generate default knowledge retrieval task from chapters
        if (tasks.length === 0 && chapters.length > 0) {
          tasks = this.generateDefaultTasksFromChapters(chapters);
        }

        return {
          videoId,
          title,
          durationSec,
          cached: ingestData.cached,
          chapters,
          tasks,
          notes,
          transcript: [
            {
              id: 'tr-0',
              timestamp: 0,
              formattedTime: '00:00',
              text: `Welcome to ${title}. Synchronized lecture session ready.`,
            },
          ],
        };
      }
    } catch (err) {
      console.warn('[LURNIX VideoService] Backend ingestion failed or offline, using fallback:', err);
    }

    // 2. Client-side fallback if backend is offline
    return this.generateFallbackIngestion(cleanId, trimmed);
  }

  private mapBackendNotesToNotes(backendNotes: any[]): Note[] {
    if (!Array.isArray(backendNotes)) return [];
    return backendNotes.map((bn, idx) => ({
      id: `note-${Date.now()}-${idx}`,
      timestamp: (idx + 1) * 120,
      formattedTime: this.formatTime((idx + 1) * 120),
      text: `${bn.chapter_title}: ${(bn.key_takeaways || []).join(' ') || bn.markdown_content?.slice(0, 150)}`,
      createdAt: Date.now() - (idx * 60000),
    }));
  }

  private mapBackendQuizToTasks(backendQuiz: any[]): ActivityTask[] {
    if (!Array.isArray(backendQuiz)) return [];
    return backendQuiz.map((q, idx) => {
      const options: QuizOption[] = (q.options || []).map((opt: string, optIdx: number) => ({
        id: `opt-${q.id || idx}-${optIdx}`,
        label: opt,
        isCorrect: optIdx === q.correct_idx,
      }));

      return {
        id: `task-${q.id || idx + 1}`,
        stepNumber: idx + 1,
        title: q.concept_tag || `Task ${idx + 1}: Concept Check`,
        subtitle: `At ${this.formatTime(q.clip_start_sec || (idx + 1) * 60)}`,
        timestampTarget: q.clip_start_sec || (idx + 1) * 60,
        status: idx === 0 ? 'active' : 'locked',
        type: 'mcq',
        question: q.question,
        options,
        explanation: q.explanation,
        selectedOptionId: undefined,
        answeredCorrectly: false,
      };
    });
  }

  private generateDefaultTasksFromChapters(chapters: Chapter[]): ActivityTask[] {
    return chapters.map((ch, idx) => ({
      id: `task-ch-${ch.id || idx + 1}`,
      stepNumber: idx + 1,
      title: ch.title,
      subtitle: `Checkpoint (${this.formatTime(ch.start_sec)})`,
      timestampTarget: ch.start_sec,
      status: idx === 0 ? 'active' : 'locked',
      type: idx === 0 ? 'mcq' : 'concept',
      question: idx === 0 ? `What is the primary focus of "${ch.title}"?` : undefined,
      options: idx === 0
        ? [
            { id: 'opt-1', label: ch.summary || 'Fundamental principles introduced in this segment.', isCorrect: true },
            { id: 'opt-2', label: 'Unrelated external hypotheses.', isCorrect: false },
          ]
        : undefined,
      contentDescription: ch.summary,
      selectedOptionId: undefined,
      answeredCorrectly: false,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Offline fallback: domain-agnostic scaffold (no demo data)
  // ─────────────────────────────────────────────────────────────────────────
  private generateFallbackIngestion(videoId: string, _rawUrl: string): IngestedVideoData {
    return {
      videoId,
      title: `Lecture Video (${videoId})`,
      durationSec: 1200,
      cached: false,
      chapters: [
        { id: 1, title: 'Introduction & Overview',        start_sec: 0,   end_sec: 300,  summary: 'Opening segment introducing the topic and core objectives.' },
        { id: 2, title: 'Core Concepts & Principles',     start_sec: 300, end_sec: 720,  summary: 'Deep-dive into the fundamental ideas of this lecture.' },
        { id: 3, title: 'Applications & Problem Solving', start_sec: 720, end_sec: 1200, summary: 'Worked examples and real-world applications.' },
      ],
      tasks: [
        {
          id: 'task-g-1',
          stepNumber: 1,
          title: 'Opening Concept Check',
          subtitle: 'At 00:30',
          timestampTarget: 30,
          status: 'active',
          type: 'concept',
          contentDescription: 'As you watch the introduction, note the main topic and the core problem being addressed in this lecture.',
          selectedOptionId: undefined,
          answeredCorrectly: false,
        },
        {
          id: 'task-g-2',
          stepNumber: 2,
          title: 'Mid-Lecture Reflection',
          subtitle: 'At 10:00',
          timestampTarget: 600,
          status: 'locked',
          type: 'concept',
          contentDescription: 'Identify the key principle or mechanism explained so far. Can you explain it in your own words?',
          selectedOptionId: undefined,
          answeredCorrectly: false,
        },
        {
          id: 'task-g-3',
          stepNumber: 3,
          title: 'Final Summary',
          subtitle: 'At 18:00',
          timestampTarget: 1080,
          status: 'locked',
          type: 'revision',
          contentDescription: 'Write a 3-sentence summary of the entire lecture covering the main concept, key takeaway, and one real-world application.',
          selectedOptionId: undefined,
          answeredCorrectly: false,
        },
      ],
      notes: [
        {
          id: 'note-g-1',
          timestamp: 0,
          formattedTime: '00:00',
          text: 'Session started. Add your own notes as you watch.',
          createdAt: Date.now(),
        },
      ],
      transcript: [
        {
          id: 'tr-g-0',
          timestamp: 0,
          formattedTime: '00:00',
          text: 'Lecture content loading. Use the AI Tutor to ask questions as you watch.',
        },
      ],
    };
  }

  private formatTime(sec: number): string {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}

export const videoService = new VideoService();
