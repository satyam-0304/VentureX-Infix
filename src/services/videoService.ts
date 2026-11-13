/**
 * LURNIX Video Ingestion & Curriculum Sync Service
 * 
 * Communicates with the FastAPI backend to ingest any YouTube URL,
 * extract transcripts/chapters, and retrieve pre-generated or dynamic
 * concept-tagged quizzes and notes.
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

        // If tasks empty, generate default knowledge retrieval task from chapter 1
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

  private generateFallbackIngestion(videoId: string, rawUrl: string): IngestedVideoData {
    const isPolymers = videoId.includes('polymer') || videoId === 'k38j3pG6KXY';
    const isNeural = videoId.includes('neural') || videoId === 'aircAruvnKk';

    let title = `Interactive YouTube Lecture (${videoId})`;
    let durationSec = 1110;
    let chapters: Chapter[] = [
      { id: 1, title: 'Introduction & Foundations', start_sec: 0, end_sec: 300, summary: 'Core overview and fundamentals.' },
      { id: 2, title: 'Key Mechanisms & Principles', start_sec: 300, end_sec: 720, summary: 'In-depth mechanical analysis.' },
      { id: 3, title: 'Advanced Applications & Synthesis', start_sec: 720, end_sec: 1110, summary: 'Real-world problem solving.' },
    ];

    if (isPolymers) {
      title = 'Polymers & Macromolecules (Class 12 Chemistry)';
      durationSec = 3050;
      chapters = [
        { id: 1, title: 'Introduction & Classification by Source', start_sec: 0, end_sec: 620, summary: 'Macromolecules and polymer classification.' },
        { id: 2, title: 'Addition Polymerization & Free Radicals', start_sec: 620, end_sec: 1450, summary: 'Initiation with benzoyl peroxide, propagation, and termination.' },
        { id: 3, title: 'Condensation Polymerization & Step-Growth', start_sec: 1450, end_sec: 2200, summary: 'Nylon 6,6 synthesis and Bakelite network formation.' },
        { id: 4, title: 'Vulcanization of Rubber & Cross-linking', start_sec: 2200, end_sec: 3050, summary: 'Enhancing elasticity with sulfur bridges at 373-415 K.' },
      ];
    } else if (isNeural) {
      title = 'Neural Networks: Gradient Descent & Backpropagation';
      durationSec = 1140;
      chapters = [
        { id: 1, title: 'Perceptrons & Neural Architecture', start_sec: 0, end_sec: 320, summary: 'Inputs, weights, biases, and activation functions.' },
        { id: 2, title: 'Loss Functions & Gradient Descent', start_sec: 320, end_sec: 720, summary: 'Optimizing weights via negative gradient descent.' },
        { id: 3, title: 'Backpropagation & Chain Rule', start_sec: 720, end_sec: 1140, summary: 'Propagating errors backward through layers.' },
      ];
    }

    return {
      videoId,
      title,
      durationSec,
      cached: true,
      chapters,
      tasks: [
        {
          id: `task-1`,
          stepNumber: 1,
          title: 'Understanding Check',
          subtitle: 'Knowledge Retrieval',
          timestampTarget: 60,
          status: 'active',
          type: 'mcq',
          question: `What is the primary governing principle of ${title}?`,
          options: [
            { id: 'opt-1', label: 'Fundamental conceptual laws outlined in the introduction.', isCorrect: true },
            { id: 'opt-2', label: 'Arbitrary unverified empirical assertions.', isCorrect: false },
          ],
          explanation: 'Rigorous foundations require verifiable first-principles understanding.',
          selectedOptionId: undefined,
          answeredCorrectly: false,
        },
      ],
      notes: [
        {
          id: `note-1`,
          timestamp: 60,
          formattedTime: '01:00',
          text: `Introduction to ${title}: Key formulas and definitions established.`,
          createdAt: Date.now(),
        },
      ],
      transcript: [
        {
          id: 'tr-0',
          timestamp: 0,
          formattedTime: '00:00',
          text: `Welcome to ${title}. In this lecture we explore the core principles.`,
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
