# VENTUREX E-SUMMIT '26 — PROJECT PROPOSAL

---

## 1️⃣ Project Title

* **Project Name:** Lurnix  
* **One-Line Pitch:**  
  > *"We help online self-learners master complex video lectures by transforming passive YouTube watching into an active, contextual, and closed-loop AI tutoring session."*

---

## 2️⃣ Problem Statement

* **Chosen Track:** Problem Statement 3 (PS3) — *Making Online Learning More Interactive*
* **The Exact Problem:**  
  YouTube is the world’s largest open university, yet learning through video remains overwhelmingly passive, isolated, and fragmented. When students encounter mathematically complex or abstract concepts, they fall into a **"Never-Ending Learning Loop"**:
  1. **Passive Confusion & Rewind Fatigue:** Students rewind the same 30-second explanation repeatedly without gaining conceptual intuition.
  2. **External Tab Distraction:** Seeking clarification forces learners to Google or switch to another video, introducing conflicting notation/terminology and derailing focus.
  3. **Tedious Manual Note-Taking:** Pausing every 2 minutes to hand-copy formulas and diagrams takes longer than watching the video itself.
  4. **The "Illusion of Competence":** Passive video watching provides zero comprehension feedback; students only realize they didn't understand the material when they fail their exam.
* **Who Faces It & Why It Matters:**  
  Over 500 million students, competitive exam aspirants (JEE, NEET, GATE, SAT), and self-taught engineers globally rely on recorded lectures. Without real-time interaction, dropout rates on self-paced platforms exceed 85%, and learners waste hours rewinding or transcribing instead of understanding.

---

## 3️⃣ Proposed Solution

### How the Product Solves the Problem
*Lurnix* is an interactive AI learning companion that lives directly alongside any YouTube lecture. Rather than treating a video as a static video file, it reads the lecture transcript in real-time and synchronizes with the video player's exact playback timestamp. It acts as an attentive personal tutor sitting beside the student: detecting when they are stuck, explaining concepts in their preferred mental model, and testing their comprehension.

### 5 Key Features Built in 10 Hours

1. **Timestamp-Aware Grounded Q&A (No Tab Switching):**  
   Students can ask doubts in plain English at any point in the video (e.g., *"What is this catalyst doing?"*). The AI automatically binds the question to the current playback second, grounds its answer strictly in this instructor's own spoken explanations, and provides clickable timestamp badges (e.g., `[14:05]`) that instantly seek the video to the visual proof.
2. **"Explain Differently" Multimodal Toggles (P1):**  
   Stuck on a dense mathematical derivation? With one click, learners toggle between 4 tailored perspectives:
   * **💡 Analogy:** Translates abstract theory into physical, real-world metaphors.
   * **🔢 Step-by-Step:** Breaks derivations into numbered chronological stages.
   * **🇮🇳 Hinglish:** Explains concepts in conversational Indian college phrasing for intuitive comfort.
   * **🟢 Simpler:** Strips academic jargon into accessible 8th-grade language.
3. **Proactive Confusion Detection & Nudge (P2):**  
   A client-side telemetry engine tracks seek and rewind behavior. When a learner rewinds the same 30-second window $\ge 2$ times within 60 seconds, a gentle, non-intrusive floating card slides in: *"Looks like this section is tricky! Want an analogy or a step-by-step breakdown?"*
4. **Auto-Generated Chapter Notes & LaTeX Formula Sheet (P5):**  
   Extracts high-yield lecture summaries and renders mathematical notation crisply using LaTeX/KaTeX (e.g., $R\text{-}O\text{-}O\text{-}R \rightarrow 2 R\text{-}O^\bullet$), with a 1-click browser-native **Print-to-PDF** export.
5. **Closed-Loop Concept Quizzes & Video Remediation (P6 — Main Differentiator):**  
   Every chapter features 3 concept-tagged multiple-choice questions. When a student chooses an incorrect answer, *Lurnix* doesn't just display a red "X"—it diagnoses the specific conceptual misconception and provides an active **`[Rewatch 13:50 – 14:40]`** button that transports the student straight back to the 50-second clip where the instructor explained it.

### What Makes It Different from Existing Solutions
* **Existing AI Video Tools (Summarize.tech, NoteGPT, Harpa):** Only summarize entire videos into generic text walls or act as external generic chatbots detached from the student's playback moment.
* **Lurnix:** **We teach from the video.** We maintain micro-second synchronization with the video player, detect confusion before the student gives up, and close the learning loop by returning the student directly to the exact seconds they misunderstood.

---

## 4️⃣ Tech Stack

| Layer | Technologies Selected | Justification & Role |
| :--- | :--- | :--- |
| **Frontend** | **Next.js (App Router), React 19, Tailwind CSS** | Fast, responsive 2-column split study room; instant client-side transitions. |
| **Video Engine** | **YouTube IFrame Player API** | Precision sub-second tracking (`getCurrentTime`) and bi-directional programmatic seeking (`seekTo`). |
| **Backend** | **FastAPI (Python 3.11)** | High-throughput async API endpoints with sub-second request handling and auto-generated OpenAPI documentation. |
| **AI / LLM Engine** | **Google Gemini 2.5 Flash** | Ultra-low latency ($\approx 900$ms), large 1M context window (swallows full 50-minute transcripts), and strict JSON Schema enforcement. |
| **Data & Persistence** | **SQLite (WAL mode) / Pydantic v2** | Zero-configuration, lightning-fast local cache for transcripts, generated chapters, notes, and quiz banks. |
| **Caption Pipeline** | **`youtube-transcript-api`** | Multi-language subtitle scraping (`en`, `hi`, `en-IN`) with automatic translation fallback and pre-seeded fixture cache. |
| **Math & Styling** | **KaTeX / Remark / Rehype** | Crisp client-side vector rendering of complex mathematical and chemical formulas. |
| **Deployment** | **Vercel (Frontend) + Render / Railway (Backend)** | Production cloud deployment accessible on judges' mobile and desktop browsers, backed by a local demo failsafe. |

