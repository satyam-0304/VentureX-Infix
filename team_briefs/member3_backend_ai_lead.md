# TEAM BRIEF — MEMBER 3: BACKEND & AI LEAD
**Project:** Lurnix (VentureX E-Summit'26 PS3)  
**Role:** Backend & AI Lead (FastAPI Core, Gemini Integration, Context Slicer & Structured Prompts)  
**Teammates:** Member 1 (Frontend Lead), Member 2 (Frontend Features), Member 4 (Backend Data & Ingest)

---

## 1. What You Own (Strict Boundaries)
You are the AI brain architect. You control the FastAPI core, the Gemini 2.5 Flash SDK, prompt engineering with strict JSON schemas, the transcript slicing algorithm, and grounded answer generation.

### You OWN:
1. **FastAPI Setup & CORS:** `app/main.py` with unrestricted CORS for local Next.js (`http://localhost:3000`) and Vercel domains.
2. **Gemini SDK Client (`services/gemini.py`):** Configured with Gemini 2.5 Flash, temperature = 0.2 (low for factual grounding), and `response_mime_type="application/json"`.
3. **Context Slicer Algorithm (`services/context_slicer.py`):** Slices the full video transcript down to the targeted window $[t - 120\text{s}, t + 60\text{s}]$ based on Arjun's current timestamp.
4. **Prompt Templates (`app/prompts/`):**
   - `qa.py`: Contextual Q&A with strict grounding rules and timestamp citations.
   - `explain.py`: 4 modalities (Analogy, Step-by-Step, Simpler, Hinglish).
   - `chapters.py`: Splitting full transcript into 5–7 chapters.
   - `quiz.py`: 3 MCQs per chapter tagged with concepts and clip start/end times.
   - `remediation.py`: Diagnosing incorrect options and finding the exact 30–60s clip to rewatch.
   - `notes.py`: Markdown definitions + LaTeX formulas extraction.
   - `revision.py`: 10-Minute Rapid Revision summary.
5. **Endpoints:**
   - `POST /api/chat`
   - `GET /api/video/{video_id}/revision`

### You DO NOT Touch:
- Frontend code or React components (Members 1 & 2 own this).
- Raw SQLite table setups and `youtube-transcript-api` multi-language scrapers (Member 4 owns this).
- Pre-seeding batch scripts (Member 4 owns this).

---

## 2. The Context Slicer Algorithm (`services/context_slicer.py`)
```python
def slice_transcript(transcript: list[dict], current_sec: float, window_before=120, window_after=60) -> list[dict]:
    """
    Extracts only transcript segments within [current_sec - 120s, current_sec + 60s].
    Guarantees the LLM is laser-focused on what's on screen right now.
    """
    min_time = max(0, current_sec - window_before)
    max_time = current_sec + window_after
    
    sliced = [
        item for item in transcript
        if (item["start"] + item.get("duration", 0)) >= min_time and item["start"] <= max_time
    ]
    return sliced if sliced else transcript[:20]  # fallback if out of bounds
```

---

## 3. Core Prompts & JSON Schemas

### A. Contextual Q&A Prompt (`POST /api/chat`)
**System Instruction:**
> You are an in-situ AI tutor embedded alongside a YouTube lecture. You answer student doubts strictly based on the provided video transcript slice.
> 
> Grounding Rules:
> 1. Answer ONLY using information stated or implied by the instructor in this lecture.
> 2. For every key factual statement, provide a citation with exact start and end seconds: `[{"label": "14:05", "start_sec": 845, "end_sec": 865}]`.
> 3. If the instructor did NOT explain or mention this concept in the video, return `"not_covered": true` and politely state that this lecture does not cover it. Never make up external facts.
> 4. Keep answers crisp (2-4 sentences).

**Pydantic Schema:**
```python
class Citation(BaseModel):
    label: str       # "14:05"
    start_sec: int   # 845
    end_sec: int     # 865

class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation]
    not_covered: bool
    concept_tag: str
```

### B. "Explain Differently" Modes (`POST /api/chat` with `mode`)
- **Analogy:** *"Explain the concept at {timestamp} using an everyday physical metaphor (sports, cooking, mechanics). Avoid heavy jargon."*
- **Step-by-Step:** *"Break down the mathematical derivation or reaction sequence into numbered 1-2-3 logical steps."*
- **Hinglish:** *"Explain the concept in friendly, conversational college Hinglish (e.g. 'Dekho, yahan pe initiator ka kaam hai...')."*
- **Simpler:** *"Explain this concept as if speaking to an intelligent 8th grader without using unnecessary technical acronyms."*

---

## 4. Hour-by-Hour Execution Plan

* **Hour 0–1:** Initialize FastAPI with CORS middleware. Setup `requirements.txt` (`fastapi`, `uvicorn`, `google-genai`, `pydantic`). Verify Gemini API key connection.
* **Hour 1–2:** Build `services/context_slicer.py` and test with a local dummy transcript JSON.
* **Hour 2–3:** Implement `services/gemini.py` using Gemini 2.5 Flash structured output. Write `qa.py` and test in terminal with sample queries.
* **Hour 3–4 (MILESTONE 1 - VERTICAL SLICE):** Deploy `POST /api/chat` on `localhost:8000`. Test end-to-end with Member 2: ask a question from frontend $\rightarrow$ verify response returns in $\le 1$ second with timestamp citations!
* **Hour 4–5:** Implement `explain.py` modalities. Add `mode` parameter to `POST /api/chat`.
* **Hour 5–6:** Build Chaptering prompt (`chapters.py`) and Notes extraction prompt (`notes.py`) with KaTeX LaTeX output formatting.
* **Hour 6–7:** Build Quiz generation prompt (`quiz.py`) and Remediation diagnosis prompt (`remediation.py`). Hand schemas over to Member 4.
* **Hour 7–8:** Build `GET /api/video/{video_id}/revision` returning the 10-minute cheat sheet.
* **Hour 8–9:** Gemini latency optimization (streamline prompts, reduce token budgets to ensure $\le 1.2$s responses).
* **Hour 9–10:** Assist with cloud deployment on Render/Railway.

---

## 5. Definition of Done for Member 3
1. `POST /api/chat` returns valid JSON with citations in $< 1.2$ seconds using Gemini 2.5 Flash.
2. Asking about an irrelevant topic (e.g. "What is quantum mechanics?" during a Polymers lecture) correctly returns `"not_covered": true`.
3. Switching to `mode="hinglish"` or `mode="analogy"` returns an instantly tailored explanation.
4. All prompts enforce strict Pydantic schemas without runtime parsing errors.

