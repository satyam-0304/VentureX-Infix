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

        // Fetch notes, quizzes, and transcript in parallel
        const [notesRes, quizRes, transcriptRes] = await Promise.allSettled([
          fetch(`${this.apiBaseUrl}/api/video/${videoId}/notes`),
          fetch(`${this.apiBaseUrl}/api/video/${videoId}/quiz`),
          fetch(`${this.apiBaseUrl}/api/video/${videoId}/transcript`),
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

        let transcript: TranscriptLine[] = [];
        // First check if ingestData included transcript
        if (Array.isArray(ingestData.transcript) && ingestData.transcript.length > 0) {
          transcript = ingestData.transcript.map((item: any, idx: number) => {
            const startSec = Math.floor(item.start ?? item.timestamp ?? 0);
            return {
              id: `tr-${idx}`,
              timestamp: startSec,
              formattedTime: this.formatTime(startSec),
              text: item.text ?? '',
            };
          });
        } else if (transcriptRes.status === 'fulfilled' && transcriptRes.value.ok) {
          const rawTranscript = await transcriptRes.value.json();
          if (Array.isArray(rawTranscript) && rawTranscript.length > 0) {
            transcript = rawTranscript.map((item: any, idx: number) => {
              const startSec = Math.floor(item.start ?? item.timestamp ?? 0);
              return {
                id: `tr-${idx}`,
                timestamp: startSec,
                formattedTime: this.formatTime(startSec),
                text: item.text ?? '',
              };
            });
          }
        }

        if (transcript.length === 0) {
          // If transcript is still empty, synthesize initial checkpoints from chapters
          transcript = chapters.length > 0
            ? chapters.map((c, i) => ({
                id: `tr-${i}`,
                timestamp: c.start_sec,
                formattedTime: this.formatTime(c.start_sec),
                text: `${c.title}: ${c.summary}`,
              }))
            : [
                {
                  id: 'tr-0',
                  timestamp: 0,
                  formattedTime: '00:00',
                  text: `Welcome to ${title}. Synchronized lecture session ready.`,
                },
              ];
        }

        return {
          videoId,
          title,
          durationSec,
          cached: ingestData.cached,
          chapters,
          tasks,
          notes,
          transcript,
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
  // Offline fallback: pre-seeded demo data OR domain-agnostic generic scaffold
  // ─────────────────────────────────────────────────────────────────────────
  private generateFallbackIngestion(videoId: string, _rawUrl: string): IngestedVideoData {

    // ── 1. Polymers demo ────────────────────────────────────────────────────
    const isPolymers = videoId === 'k38j3pG6KXY' || videoId.toLowerCase().includes('polymer');
    if (isPolymers) {
      return {
        videoId,
        title: 'Polymers & Macromolecules (Class 12 Chemistry)',
        durationSec: 3050,
        cached: true,
        chapters: [
          { id: 1, title: 'Introduction & Classification by Source', start_sec: 0,    end_sec: 620,  summary: 'Macromolecules and polymer classification.' },
          { id: 2, title: 'Addition Polymerization & Free Radicals',  start_sec: 620,  end_sec: 1450, summary: 'Initiation with benzoyl peroxide, propagation, and termination.' },
          { id: 3, title: 'Condensation Polymerization & Step-Growth',start_sec: 1450, end_sec: 2200, summary: 'Nylon 6,6 synthesis and Bakelite network formation.' },
          { id: 4, title: 'Vulcanization of Rubber & Cross-Linking',  start_sec: 2200, end_sec: 3050, summary: 'Enhancing elasticity with sulfur bridges at 373-415 K.' },
        ],
        tasks: [
          {
            id: 'task-p-1', stepNumber: 1,
            title: 'Free Radical Initiators',
            subtitle: 'At 10:20', timestampTarget: 620, status: 'active', type: 'mcq',
            question: 'Which compound commonly initiates free-radical addition polymerization?',
            options: [
              { id: 'opt-p-1a', label: 'Benzoyl peroxide', isCorrect: true },
              { id: 'opt-p-1b', label: 'Sulfuric acid', isCorrect: false },
              { id: 'opt-p-1c', label: 'Sodium chloride', isCorrect: false },
            ],
            explanation: 'Benzoyl peroxide decomposes on heating to form reactive free radicals that initiate chain-growth polymerization.',
            selectedOptionId: undefined, answeredCorrectly: false,
          },
          {
            id: 'task-p-2', stepNumber: 2,
            title: 'Addition vs Condensation',
            subtitle: 'At 24:10', timestampTarget: 1450, status: 'locked', type: 'mcq',
            question: 'Which of the following is a condensation polymer?',
            options: [
              { id: 'opt-p-2a', label: 'Nylon 6,6', isCorrect: true },
              { id: 'opt-p-2b', label: 'Polythene', isCorrect: false },
              { id: 'opt-p-2c', label: 'PVC', isCorrect: false },
            ],
            explanation: 'Nylon 6,6 is formed by condensation between hexamethylenediamine and adipic acid, releasing water as a byproduct.',
            selectedOptionId: undefined, answeredCorrectly: false,
          },
        ],
        notes: [
          { id: 'note-p-1', timestamp: 60, formattedTime: '01:00', text: 'Monomers bond via condensation or addition mechanisms.', createdAt: Date.now() },
          { id: 'note-p-2', timestamp: 620, formattedTime: '10:20', text: 'Benzoyl peroxide is the classic free-radical initiator.', createdAt: Date.now() - 60000 },
        ],
        transcript: [
          { id: 'tr-p-0', timestamp: 0,    formattedTime: '00:00', text: 'Welcome to Polymers & Macromolecules. Today we explore polymer classification and synthesis.' },
          { id: 'tr-p-1', timestamp: 620,  formattedTime: '10:20', text: 'Addition polymerization begins with a free-radical initiator like benzoyl peroxide.' },
          { id: 'tr-p-2', timestamp: 1450, formattedTime: '24:10', text: 'Condensation polymerization produces Nylon 6,6 through step-growth mechanism.' },
          { id: 'tr-p-3', timestamp: 2200, formattedTime: '36:40', text: 'Vulcanization adds sulfur cross-links to polyisoprene, increasing tensile strength.' },
        ],
      };
    }

    // ── 2. Neural Networks demo ─────────────────────────────────────────────
    const isNeural = videoId === 'aircAruvnKk' || videoId.toLowerCase().includes('neural');
    if (isNeural) {
      return {
        videoId,
        title: 'Neural Networks: Gradient Descent & Backpropagation',
        durationSec: 1140,
        cached: true,
        chapters: [
          { id: 1, title: 'Perceptrons & Neural Architecture',  start_sec: 0,   end_sec: 320,  summary: 'Inputs, weights, biases, and activation functions.' },
          { id: 2, title: 'Loss Functions & Gradient Descent',  start_sec: 320, end_sec: 720,  summary: 'Optimizing weights via negative gradient descent.' },
          { id: 3, title: 'Backpropagation & Chain Rule',       start_sec: 720, end_sec: 1140, summary: 'Propagating errors backward through layers.' },
        ],
        tasks: [
          {
            id: 'task-n-1', stepNumber: 1,
            title: 'Gradient Descent Direction',
            subtitle: 'At 05:20', timestampTarget: 320, status: 'active', type: 'mcq',
            question: 'Which direction does gradient descent move weights to minimize loss?',
            options: [
              { id: 'opt-n-1a', label: 'Opposite to the gradient (negative gradient direction)', isCorrect: true },
              { id: 'opt-n-1b', label: 'Along the gradient (positive direction)', isCorrect: false },
              { id: 'opt-n-1c', label: 'Perpendicular to the gradient', isCorrect: false },
            ],
            explanation: 'Gradient descent subtracts a fraction of the gradient from each weight, moving in the direction of steepest descent.',
            selectedOptionId: undefined, answeredCorrectly: false,
          },
          {
            id: 'task-n-2', stepNumber: 2,
            title: 'Backpropagation Rule',
            subtitle: 'At 12:00', timestampTarget: 720, status: 'locked', type: 'mcq',
            question: 'Which mathematical rule does backpropagation rely on to compute gradients?',
            options: [
              { id: 'opt-n-2a', label: 'Chain rule of calculus', isCorrect: true },
              { id: 'opt-n-2b', label: "Bayes' theorem", isCorrect: false },
              { id: 'opt-n-2c', label: 'Product rule only', isCorrect: false },
            ],
            explanation: 'The chain rule allows gradients to be propagated backward through each layer by multiplying local Jacobians.',
            selectedOptionId: undefined, answeredCorrectly: false,
          },
        ],
        notes: [
          { id: 'note-n-1', timestamp: 60, formattedTime: '01:00', text: 'Each neuron computes weighted sum + bias, then applies activation function.', createdAt: Date.now() },
        ],
        transcript: [
          { id: 'tr-n-0', timestamp: 0,   formattedTime: '00:00', text: 'Neural networks are computational graphs of interconnected neurons inspired by the brain.' },
          { id: 'tr-n-1', timestamp: 320, formattedTime: '05:20', text: 'The loss function measures prediction error; gradient descent minimizes it iteratively.' },
          { id: 'tr-n-2', timestamp: 720, formattedTime: '12:00', text: 'Backpropagation applies the chain rule to compute gradients layer by layer.' },
        ],
      };
    }

    // ── 3. Electromagnetic Induction demo ───────────────────────────────────
    const isPhysics = videoId === 'bHTqg7nQ2iE' || videoId.toLowerCase().includes('electro');
    if (isPhysics) {
      return {
        videoId,
        title: 'Electromagnetic Induction (Class 12 Physics)',
        durationSec: 1800,
        cached: true,
        chapters: [
          { id: 1, title: "Faraday's Laws & Magnetic Flux",   start_sec: 0,    end_sec: 480,  summary: 'Induced EMF is proportional to rate of change of magnetic flux.' },
          { id: 2, title: "Lenz's Law & Energy Conservation", start_sec: 480,  end_sec: 1080, summary: 'Induced current opposes the change that causes it.' },
          { id: 3, title: 'Inductance & AC Generators',       start_sec: 1080, end_sec: 1800, summary: 'Self and mutual inductance; alternating current generation.' },
        ],
        tasks: [
          {
            id: 'task-em-1', stepNumber: 1,
            title: "Faraday's Law",
            subtitle: 'At 08:00', timestampTarget: 480, status: 'active', type: 'mcq',
            question: "According to Faraday's law, what determines the magnitude of the induced EMF?",
            options: [
              { id: 'opt-em-1a', label: 'Rate of change of magnetic flux through the loop', isCorrect: true },
              { id: 'opt-em-1b', label: 'Total magnetic field strength', isCorrect: false },
              { id: 'opt-em-1c', label: 'Area of the coil only', isCorrect: false },
            ],
            explanation: 'EMF = -dΦ/dt. The faster the magnetic flux changes, the greater the induced EMF.',
            selectedOptionId: undefined, answeredCorrectly: false,
          },
        ],
        notes: [
          { id: 'note-em-1', timestamp: 60, formattedTime: '01:00', text: 'Magnetic flux Φ = B·A·cos(θ).', createdAt: Date.now() },
        ],
        transcript: [
          { id: 'tr-em-0', timestamp: 0,    formattedTime: '00:00', text: 'Electromagnetic induction is the basis of electric generators and transformers.' },
          { id: 'tr-em-1', timestamp: 480,  formattedTime: '08:00', text: "Faraday's law: the induced EMF equals the negative rate of change of magnetic flux." },
          { id: 'tr-em-2', timestamp: 1080, formattedTime: '18:00', text: 'Self-inductance opposes any change in current flowing through the coil.' },
        ],
      };
    }

    // ── 4. Generic fallback for ANY unknown real YouTube video ──────────────
    // No domain-specific text. Chapter names and task descriptions are neutral.
    return {
      videoId,
      title: `YouTube Lecture (${videoId})`,
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
