# LearnLoop: Product Requirements Document (PRD) & Product Brief

**Product Name:** LearnLoop  
**Tagline:** *Learn actively, understand deeply.*  
**Document Version:** 1.0.0  
**Target Platform:** Web (Desktop-first, 1440px primary viewport; responsive tablet/mobile ready)  
**Status:** Approved for Implementation / Design Baseline Complete  

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem
Traditional online video learning platforms (e.g., Coursera, Udemy, YouTube Edu) suffer from high drop-off rates and passive consumption fatigue. Students watch lectures without engaging their cognitive retention mechanisms, resulting in low comprehension and superficial recall. Furthermore, context switching between disconnected video players, separate note apps, external quiz tools, and AI assistants disrupts the learning flow.

### 1.2 The Solution: LearnLoop
**LearnLoop** is an AI-native interactive video learning workspace that transforms passive lecture streaming into an active, synchronized learning experience. By pairing synchronized timeline-based learning tasks, in-situ note taking, interactive transcripts, and a floating context-aware AI tutor with an unobtrusive session switcher, LearnLoop keeps learners focused in a unified flow state.

---

## 2. Core User Personas

| Persona | Role | Key Goals | Pain Points |
| :--- | :--- | :--- | :--- |
| **Simona Biles** | Undergraduate STEM Student (*Engineering Chemistry*) | Master complex technical subjects, retain vocabulary, and prepare efficiently for exams. | Gets distracted during long lectures; forgets earlier concepts; struggles to cross-reference video moments with notes. |
| **Marcus Vance** | University Professor / Course Creator | Ensure high student completion rates and track student comprehension gaps in real-time. | Cannot pinpoint where students lose comprehension during a 20-minute lecture. |
| **Alex Rivera** | Self-directed Lifelong Learner | Upskill in professional topics with limited study time. | Passive videos take too long; lacks immediate feedback when struggling with difficult ideas. |

---

## 3. Product Principles & Design Language

1. **Active Over Passive:** Every learning video is paired with checkpoint activities, micro-quizzes, and interactive timestamps to enforce retrieval practice.
2. **Cognitive Calm & Premium Aesthetic:** A soft pastel environment (lavender, pale pink, clean whites, subtle glassmorphism) paired with high-contrast text and a minimalist dark session history sidebar minimizes visual strain and cognitive fatigue.
3. **In-Context Assistance:** Help is never more than a click or keystroke away (`⌘K`), anchored directly to the timestamp and topic currently being studied.
4. **Frictionless Navigation:** Learners switch between course modules and previous study sessions without leaving their active video canvas.

---

## 4. Feature Specifications & Requirements

### 4.1 ChatGPT-Style Session History Sidebar
* **Placement & Dimensions:** Fixed on extreme left; default collapsed width ~64px; expandable to ~260px.
* **Appearance:** Dark navy surface (`#0f141c`), high contrast against pastel workspace.
* **Session Switcher:** Compact vertically stacked abbreviation badges (e.g., `CH` for Chemistry, `PL` for Polymers, `OC` for Organic Chem). Active session highlighted with high-contrast white rounded badge.
* **Expand/Collapse Action:** Toggle button smoothly reveals full session titles, timestamps, and course breadcrumbs.
* **Search Functionality:** Real-time filter input at the top of the expanded drawer to quickly locate past topics.
* **New Session Creation:** A bottom `+` button opens a lightweight modal or prompt to initialize a new learning session.
* **Preferences:** Quick toggles for theme mode (light/dark) and user settings.

### 4.2 Global Navigation Header
* **Branding:** LearnLoop infinity glyph + wordmark.
* **Navigation Links:** Pill navigation (`Dashboard`, `Learning Hub`, `Practice` [active], `Progress`).
* **Utility Controls:** Global search trigger (`⌘F`), interactive notification badge, and user profile avatar with contextual email/tier metadata.

### 4.3 Interactive Lecture Player (~65% Main Canvas)
* **Viewport:** 16:9 responsive educational video player with custom UI overlay.
* **Interactive Timeline / Scrubber:** Progress bar displaying dynamic checkpoint markers corresponding to learning activities at specific timestamps.
* **Player Controls:**
  * Play / Pause toggle with keyboard shortcut (`Space`).
  * Timecode display (`Current Time / Total Duration`).
  * Scrubber seekable with real-time feedback.
  * Audio volume slider + single-click mute toggle.
  * Synchronized Closed Captions (`CC`) toggle overlaying subtitles.
  * Playback Speed cycling button (`0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`).
  * Fullscreen trigger.
* **Timestamp Cue Banner:** Top overlay badge showing active task affiliation (e.g., *"Task 1 active at this timestamp"*).

### 4.4 Tabbed Workspace (Below Player)
1. **Overview Tab (Default):**
   * Lecture summary and instructor attribution (*Professor Vance*).
   * Key Learning Objectives organized in structured, checkable pill cards.
   * Core Vocabulary chips with native Text-to-Speech audio pronunciation triggers.
2. **My Notes Tab:**
   * In-context editor with automatic video timestamp tagging.
   * Persistent storage across page reloads.
   * Instant search and delete actions.
3. **Interactive Transcript Tab:**
   * Searchable verbatim lecture script with clickable timecodes.
   * Clicking any sentence seeks the player directly to that second.
4. **Discussion Tab:**
   * Collaborative peer Q&A feed with question upvoting and thread replies.

### 4.5 Synchronized Learning Activities Panel (~35% Main Canvas)
* **Container:** High-elevation white rounded card with live completion metrics (`20% 1/5 Done` circular progress indicator).
* **Five Tiered Modules:**
  1. *Task 1: Understanding Check* (Knowledge Retrieval Checkpoint)
  2. *Task 2: Quick Quiz: Synthetic vs. Natural* (Comparative Analysis)
  3. *Task 3: Concept Explanation: Cross-linking* (Deep-dive Comprehension)
  4. *Task 4: Real-world Application Challenge* (Applied Science)
  5. *Task 5: Revision Challenge* (Synthesized Review)
* **Interactive Quiz Mechanics (Task 1 Spec):**
  * Multiple choice selection with single-select radio behavior.
  * Instant feedback loop: Correct answers glow emerald green with check icon; incorrect answers display soft red outlines with error badges.
  * Explanatory callout card detailing the underlying scientific rationale.
  * "Continue to Task 2" progression CTA updating progress state to 40%.

### 4.6 Contextual AI Tutor ("Ask LearnLoop AI")
* **Floating Entry Point:** Bottom-right floating pill with gradient accents and keyboard shortcut indicator (`⌘K`).
* **Chat Drawer:** Slide-over modal supporting natural language questions about the active video frame, vocabulary, or quiz questions.
* **Smart Context Injection:** Prompt automatically receives current video timestamp, topic (*Engineering Chemistry / Polymers*), and user progress.

---

## 5. Technical Architecture & Data Model

### 5.1 Client-Side State Architecture
* **Session Storage & LocalPersistence:**
  * `learnloop_active_session`: Currently active session ID (`PL-04`).
  * `learnloop_sessions_list`: Array of available past courses and initials.
  * `learnloop_task_progress`: Map of task IDs to completion states (`completed`, `locked`, `in_progress`).
  * `learnloop_user_notes`: Array of user-generated timestamped note objects.
* **Audio & Speech Engine:** Native `window.speechSynthesis` for instant zero-latency term pronunciation.

### 5.2 Responsive Breakpoints
* **Desktop (1440px+):** 64px sidebar + 65/35 dual-column layout.
* **Laptop (1024px–1439px):** 64px sidebar + stacked video (60%) and activities (40%).
* **Tablet (<1024px):** Drawer sidebar + single-column vertical stack with floating sticky task tray.

---

## 6. Success Metrics (KPIs)
1. **Lecture Completion Rate:** Target ≥ 78% (vs. industry baseline 25–35%).
2. **First-Try Quiz Accuracy:** Measure understanding check retention score.
3. **AI Tutor Engagement:** Target ≥ 2.4 queries per lecture session.
4. **Session Continuity:** Average user return rate to previous session badges ≥ 65%.

---

## 7. Future Roadmap & Milestones
* **Phase 2 (Collaborative Study Rooms):** Live synchronized co-watching with study group chat and shared notes.
* **Phase 3 (Instructor Analytics Portal):** Real-time heatmap showing drop-off timestamps and question failure rates.
* **Phase 4 (Adaptive AI Question Generation):** Dynamic multiple-choice questions generated on-the-fly based on student transcript pauses and rewinds.
