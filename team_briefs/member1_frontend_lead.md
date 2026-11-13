# TEAM BRIEF — MEMBER 1: FRONTEND LEAD
**Project:** InSitu Tutor (VentureX E-Summit'26 PS3)  
**Role:** Frontend Lead (YouTube Player Engine, Video State, Timeline & Confusion UX)  
**Teammates:** Member 2 (Frontend Features), Member 3 (Backend/AI Lead), Member 4 (Backend Data & Ingest)

---

## 1. What You Own (Strict Boundaries)
You are responsible for the core video playback experience, player time-synchronization, timeline navigation, and the client-side confusion detection engine.

### You OWN:
1. **Next.js & Tailwind Scaffold:** App router structure, responsive 2-column layout (Video on left, Tabs/Drawers on right).
2. **Landing Page Hero:** Video URL input bar + 3 quick-test preset badges (`[🧪 Polymers]`, `[⚡ Electromagnetism]`, `[💻 Neural Networks]`).
3. **YouTube IFrame Controller (`YouTubePlayer.tsx` + `useYouTubePlayer.ts`):** Embedding via YouTube IFrame API, exposing `seekTo(seconds)`, `getCurrentTime()`, `play()`, `pause()`, and playback state changes.
4. **Timeline Chapter Bar (`ChapterBar.tsx`):** Rendering chapter segments directly beneath or across the video scrubber with active progress indicators.
5. **Client-Side Confusion Detection (`useConfusionDetect.ts`):** In-memory seek/rewind event buffer that triggers when Arjun rewinds the same section repeatedly.
6. **Confusion Nudge Toast (`ConfusionToast.tsx`):** Floating non-intrusive card over the player with quick-action mode buttons (`[💡 Analogy]`, `[🔢 Step-by-Step]`, `[🇮🇳 Hinglish]`).

### You DO NOT Touch:
- Chat drawer messaging internals and KaTeX LaTeX rendering (Member 2 owns this).
- Quiz questions and grading UI (Member 2 owns this).
- Any Python FastAPI endpoints or Gemini API calls (Members 3 & 4 own this).

---

## 2. Shared Data Contracts (With Member 2 & Member 4)

### Video State & Chapter Interface (`src/lib/types.ts`)
```typescript
export interface Chapter {
  id: number;
  title: string;
  start_sec: number;
  end_sec: number;
  summary?: string;
}

export interface IngestResponse {
  video_id: string;
  title: string;
  duration_sec: number;
  cached: boolean;
  chapters: Chapter[];
}
```

### Player Controller Interface (`useYouTubePlayer`)
Expose these methods via React Context or custom hook so Member 2 can call them:
```typescript
export interface YouTubePlayerContextType {
  currentTime: number;          // updated every 250ms
  duration: number;
  isPlaying: boolean;
  seekTo: (seconds: number) => void;
  pause: () => void;
  play: () => void;
  chapters: Chapter[];
  activeChapter: Chapter | null;
}
```

---

## 3. The Confusion Detection Heuristic (`useConfusionDetect.ts`)
Run this 100% on the client to avoid server lag or network failure:
```typescript
interface SeekEvent {
  fromSec: number;
  toSec: number;
  timestamp: number; // Date.now()
}

// In-memory rolling buffer:
// Trigger Condition:
// 1. Within 60 seconds, user executes >= 2 backward seeks (toSec < fromSec).
// 2. The landing positions (toSec) are within 25 seconds of each other: Math.abs(to1 - to2) <= 25.
// 3. Debounce guard: Do not trigger again for 3 minutes after user dismisses or clicks a mode.
```

When triggered:
- Set `isConfusionNudgeVisible = true`.
- Pass current timestamp to `ConfusionToast`.
- When user clicks `[💡 Analogy]`, call `player.pause()`, open Member 2's chat drawer, and trigger an analogy query at `currentTime`.

---

## 4. Hour-by-Hour Execution Plan

* **Hour 0–1:** Initialize Next.js 14+ (App Router) + Tailwind CSS + Lucide icons. Setup basic layout (`app/watch/page.tsx`).
* **Hour 1–2:** Implement `YouTubePlayer.tsx` using `react-youtube` or direct `window.YT.Player`. Setup 250ms polling loop for `getCurrentTime()`.
* **Hour 2–3:** Connect `seekTo(sec)` to custom badges. Build `ChapterBar.tsx` beneath video player.
* **Hour 3–4 (MILESTONE 1 - VERTICAL SLICE):** Connect URL input on home page to `/watch?v=...`. Confirm clicking a chapter or timestamp jumps the video instantly.
* **Hour 4–6:** Build `useConfusionDetect.ts`. Test by rewinding twice in the video and verifying the console logs the trigger.
* **Hour 6–7:** Build `ConfusionToast.tsx` with smooth Tailwind animations (`transition-all`, floating bottom-right over video player).
* **Hour 7–8:** Integrate with Member 2: clicking `[💡 Analogy]` on the toast sends the event to Member 2's `ChatDrawer`.
* **Hour 8–9:** Responsive polish (mobile/tablet check, dark mode high-contrast styling) + Vercel deployment setup.
* **Hour 9–10:** Final rehearsals of Arjun’s 3.5-minute pitch script.

---

## 5. Definition of Done for Member 1
1. Pasting a YouTube URL loads the player in $\le 500$ms and displays chapters beneath it.
2. Clicking any external timestamp badge (e.g. `14:05`) seamlessly seeks the video and resumes playback.
3. Rewinding the same 30-second section twice within 1 minute pops up the `ConfusionToast`.
4. Clicking any option on the toast pauses the video and activates Member 2's drawer.

