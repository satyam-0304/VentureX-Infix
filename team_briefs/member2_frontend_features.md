# TEAM BRIEF — MEMBER 2: FRONTEND FEATURES
**Project:** Lurnix (VentureX E-Summit'26 PS3)  
**Role:** Frontend Feature Engineer (Q&A Chat, Explain Modes, KaTeX Notes & Remediation Quiz)  
**Teammates:** Member 1 (Frontend Lead), Member 3 (Backend/AI Lead), Member 4 (Backend Data & Ingest)

---

## 1. What You Own (Strict Boundaries)
You are responsible for everything the learner interacts with on the right-hand panel: Doubts chat, "Explain Differently" modality toggles, formatted notes with math formulas, the interactive quiz stepper, and the mistake remediation card.

### You OWN:
1. **Interactive Q&A Chat Drawer (`ChatDrawer.tsx`):**
   - Message feed with user questions and AI answers.
   - Skeletons/spinners during the 1-second Gemini response wait.
   - "Explain Differently" chips (`ModeChips.tsx`: `[💡 Analogy]`, `[🔢 Step-by-Step]`, `[🇮🇳 Hinglish]`, `[🟢 Simpler]`).
2. **Clickable Timestamp Badges (`CitationBadge.tsx`):**
   - Automatically detects time formats in text (e.g. `[14:05]` or structured citation objects) and turns them into clickable blue badges that call `player.seekTo(845)`.
3. **Auto-Notes Panel (`NotesPanel.tsx`):**
   - Renders Markdown definitions and LaTeX formulas using `react-markdown` + `rehype-katex` + `remark-math`.
   - Browser-native PDF export (`ExportPdfBtn.tsx`) with `@media print` clean CSS.
4. **Interactive Quiz Stepper (`QuizModal.tsx`):**
   - Multiple choice questions with single-select radio options.
   - Immediate feedback on submit: Green for correct, Red for incorrect.
5. **Remediation Card (`RemediationCard.tsx` - Our Main Differentiator):**
   - Appears when user picks a wrong answer.
   - Explains the specific misconception.
   - Provides an active action button: **`[Rewatch 13:50 – 14:40]`** that calls `player.seekTo(830)`.
6. **10-Minute Rapid Revision Drawer (`RevisionDrawer.tsx`):**
   - Clean 1-page cheat sheet showing top 10 exam points with clickable timestamps.
7. **Frontend API Client (`src/lib/api.ts`):**
   - Typed Axios/fetch functions matching Member 3 & Member 4's backend contracts.

### You DO NOT Touch:
- YouTube IFrame API initialization and polling internals (Member 1 owns this).
- Rewind heuristic / seek event buffer (Member 1 owns this).
- Backend Python / database code (Members 3 & 4 own this).

---

## 2. Shared Data Contracts (Connecting to Backend)

### API Endpoints You Will Call (`src/lib/api.ts`)
```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 1. Send Doubt / Change Mode
export async function askQuestion(params: {
  video_id: string;
  current_timestamp: number;
  query: string;
  mode?: 'standard' | 'simpler' | 'analogy' | 'step_by_step' | 'hinglish';
}): Promise<QAResponse>;

// 2. Fetch Notes for Chapter
export async function getChapterNotes(videoId: string, chapterId: number): Promise<NotesResponse>;

// 3. Fetch Quiz for Chapter
export async function getChapterQuiz(videoId: string, chapterId: number): Promise<QuizResponse>;

// 4. Submit Quiz Answer
export async function submitQuizAnswer(params: {
  session_id: string;
  video_id: string;
  question_id: number;
  selected_idx: number;
}): Promise<QuizSubmissionResponse>;

// 5. Fetch 10-Min Revision
export async function getRapidRevision(videoId: string): Promise<RevisionResponse>;
```

### TypeScript Interfaces for Responses
```typescript
export interface Citation {
  label: string;      // e.g. "14:05"
  start_sec: number;  // 845
  end_sec: number;    // 865
}

export interface QAResponse {
  answer: string;
  citations: Citation[];
  not_covered: boolean;
  concept_tag?: string;
}

export interface QuizSubmissionResponse {
  is_correct: boolean;
  correct_idx: number;
  concept_tag: string;
  explanation: string;
  remediation?: {
    summary: string;
    rewatch_link: {
      start_sec: number;
      end_sec: number;
      label: string;  // "13:50 - 14:40"
    };
  };
}
```

---

## 3. Hour-by-Hour Execution Plan

* **Hour 0–1:** Install UI dependencies: `npm i lucide-react react-markdown remark-math rehype-katex katex clsx tailwind-merge`. Add KaTeX CSS to `app/layout.tsx`.
* **Hour 1–2:** Build `ChatDrawer.tsx` with dummy messages + `ModeChips.tsx`.
* **Hour 2–3:** Build `CitationBadge.tsx`. Wire badge click to Member 1’s `player.seekTo()`.
* **Hour 3–4 (MILESTONE 1 - VERTICAL SLICE):** Connect Chat Drawer to Member 3’s live `/api/chat`. Type *"What is benzoyl peroxide?"* $\rightarrow$ receive answer $\rightarrow$ click `[14:05]` badge $\rightarrow$ verify video jumps!
* **Hour 4–5:** Build `NotesPanel.tsx`. Test rendering complex chemical formulas (e.g. `$R\text{-}O\text{-}O\text{-}R \rightarrow 2 R\text{-}O^\bullet$`). Add `ExportPdfBtn.tsx` using `window.print()`.
* **Hour 5–6:** Build `QuizModal.tsx` displaying 3 multiple choice questions with option selection state.
* **Hour 6–7:** Build `RemediationCard.tsx`. When wrong option is picked, show the explanation and the **[Rewatch mm:ss]** button. Test clicking the button to jump video.
* **Hour 7–8:** Build `RevisionDrawer.tsx` for the 10-Minute Rapid Revision summary.
* **Hour 8–9:** UI polish: sleek loading skeletons, empty states, error toasts, and smooth tab transitions.
* **Hour 9–10:** Rehearse the demo flow with the team.

---

## 4. Definition of Done for Member 2
1. Asking a question returns a grounded answer with clickable timestamp pills in $\le 1.2$ seconds.
2. Clicking `[💡 Analogy]` or `[🇮🇳 Hinglish]` immediately requests that mode for the current video second.
3. Notes tab displays crisp LaTeX formulas and prints cleanly to PDF without UI buttons cluttering the page.
4. Answering a quiz question incorrectly triggers the Remediation Card with a working jump-to-rewatch button.

