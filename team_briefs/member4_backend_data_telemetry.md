# TEAM BRIEF — MEMBER 4: BACKEND DATA & INGEST
**Project:** Lurnix (VentureX E-Summit'26 PS3)  
**Role:** Backend Data Engineer (Database, Transcript Pipeline, Quiz/Notes API & Pre-Seed Fixtures)  
**Teammates:** Member 1 (Frontend Lead), Member 2 (Frontend Features), Member 3 (Backend/AI Lead)

---

## 1. What You Own (Strict Boundaries)
You are the master of data, ingestion reliability, and demo safety. You handle database persistence (SQLite), bulletproof YouTube transcript scraping, the quiz grading/remediation workflow, and the pre-seeding safety net for Arjun’s demo lecture.

### You OWN:
1. **SQLite Database (`database.py` & `models.py`):**
   - Tables: `videos`, `chapters`, `notes`, `quiz_questions`, `quiz_attempts`, `mastery`.
2. **Robust Multi-Language Transcript Fetcher (`services/transcript.py`):**
   - Extracts transcripts via `youtube-transcript-api`.
   - Multi-language fallback: English (`en`, `en-US`), Hindi (`hi`), Indian English (`en-IN`), or auto-translated fallback.
3. **Progressive Ingestion Endpoint (`routes/ingest.py`):**
   - `POST /api/video/ingest`: Checks SQLite first. If cached, returns chapters in 50ms. If new, extracts transcript, calls Member 3's Chaptering prompt, saves to DB, and returns.
4. **Notes & Quiz Endpoints (`routes/notes.py` & `routes/quiz.py`):**
   - `GET /api/video/{id}/notes`: Returns chapter notes.
   - `GET /api/video/{id}/quiz?chapter_id=...`: Returns chapter questions.
   - `POST /api/quiz/submit`: Grades the answer. If wrong, calls Member 3's Remediation prompt to generate the exact `"rewatch_link"`.
5. **The Pre-Seeding Batch Script (`scripts/preseed_demo.py`):**
   - Runs in Hours 8–10 to pre-generate and save complete transcripts, chapters, notes, and quizzes for 3 demo videos (including Arjun's Polymers video) into a bundled `cache/tutor_seed.db`.
6. **Cloud Deployment Setup:** `Dockerfile` and `render.yaml` for Render/Railway.

### You DO NOT Touch:
- Frontend React UI or player controls (Members 1 & 2 own this).
- Prompt template wording and LLM persona instructions (Member 3 owns this).

---

## 2. Multi-Language Transcript Engine (`services/transcript.py`)
Cloud IPs (Render/Railway) can be blocked by YouTube, and Indian lectures often mix English and Hindi captions. Write this defensively:
```python
from youtube_transcript_api import YouTubeTranscriptApi

def get_video_transcript(youtube_id: str) -> list[dict]:
    transcript_list = YouTubeTranscriptApi.list_transcripts(youtube_id)
    
    # 1. Try explicit manual / auto transcripts in order of preference
    preferred_languages = ['en', 'en-US', 'en-GB', 'hi', 'en-IN']
    try:
        transcript = transcript_list.find_transcript(preferred_languages)
        return transcript.fetch()
    except Exception:
        pass

    # 2. Try auto-translating any available caption to English
    try:
        for t in transcript_list:
            return t.translate('en').fetch()
    except Exception:
        pass
        
    raise ValueError("Transcripts are disabled or unavailable for this video.")
```

---

## 3. Database Schema (`models.py`)
Use SQLite with SQLAlchemy or raw SQLite:
* `videos`: `id` (PK, string), `youtube_id`, `title`, `duration_sec`, `transcript_json`, `created_at`.
* `chapters`: `id` (PK), `video_id` (FK), `title`, `start_sec`, `end_sec`, `summary`, `order_idx`.
* `notes`: `id` (PK), `video_id` (FK), `chapter_id`, `content_markdown`, `formulas_json`.
* `quiz_questions`: `id` (PK), `video_id` (FK), `chapter_id`, `concept_tag`, `question`, `options_json`, `correct_idx`, `explanation`, `clip_start_sec`, `clip_end_sec`.
* `quiz_attempts`: `id` (PK), `session_id`, `question_id`, `selected_idx`, `is_correct`, `timestamp`.

---

## 4. The Quiz Remediation Workflow (`routes/quiz.py`)
When Arjun submits an answer:
1. Lookup question in `quiz_questions`.
2. Check `is_correct = (selected_idx == question.correct_idx)`.
3. If correct:
   ```json
   { "is_correct": true, "explanation": "Correct! Benzoyl peroxide generates free radicals." }
   ```
4. If incorrect:
   - Call Member 3's `remediation.py` prompt with the question, user's wrong answer, and the transcript segment between `clip_start_sec` and `clip_end_sec`.
   - Return:
   ```json
   {
     "is_correct": false,
     "correct_idx": question.correct_idx,
     "concept_tag": question.concept_tag,
     "explanation": "Ziegler-Natta is used for coordination polymerization, not free-radical addition.",
     "remediation": {
       "summary": "You confused coordination catalysts with radical initiators.",
       "rewatch_link": {
         "start_sec": question.clip_start_sec,
         "end_sec": question.clip_end_sec,
         "label": "13:50 - 14:40"
       }
     }
   }
   ```

---

## 5. Hour-by-Hour Execution Plan

* **Hour 0–1:** Setup SQLite database connection (`database.py`) and write table models (`models.py`).
* **Hour 1–2:** Build `services/transcript.py` with multi-language fallback. Test fetching transcripts for 3 different educational URLs.
* **Hour 2–3:** Build `POST /api/video/ingest`. Wire it to save raw transcript into SQLite.
* **Hour 3–4 (MILESTONE 1 - VERTICAL SLICE):** Connect Ingest API to Member 3’s Chaptering prompt. Test pasting a URL $\rightarrow$ verify chapters appear in DB and return to frontend.
* **Hour 4–5:** Implement `GET /api/video/{id}/notes` and background notes generation.
* **Hour 5–6:** Implement `GET /api/video/{id}/quiz` and background quiz generation.
* **Hour 6–7:** Implement `POST /api/quiz/submit` with the wrong-answer remediation diagnosis loop.
* **Hour 7–8:** Build `scripts/preseed_demo.py` to pre-seed 3 demo videos (Chemistry, Physics, Computer Science) directly into `cache/tutor_seed.db`.
* **Hour 8–9:** Setup `Dockerfile` and deploy backend to Render / Railway. Configure CORS environment variables.
* **Hour 9–10:** Verify that if the live transcript API hits a rate limit or cloud block, the backend automatically serves the pre-seeded SQLite video seamlessly!

---

## 6. Definition of Done for Member 4
1. Ingesting an already-seen video returns chapters from SQLite in under 50ms.
2. Ingesting a new English or Hindi lecture fetches captions reliably.
3. Submitting an incorrect quiz answer returns the diagnosis and precise `rewatch_link` timestamps.
4. The pre-seed script successfully loads Arjun's Polymers video so the entire demo can run with zero external network dependency.

