"""Dynamic Ingestion & Curriculum Cache for Arbitrary YouTube Videos.

Stores generated chapters, notes, and quiz checkpoints for any YouTube video ID
ingested at runtime, ensuring /api/video/{id}/chapters, /notes, and /quiz return
video-specific data rather than hardcoded fallbacks.
"""

import logging
from typing import Any
from app.schemas import Chapter, ChapterNotes, QuizQuestion

logger = logging.getLogger(__name__)

# In-memory storage for runtime ingested video data
_DYNAMIC_CACHE: dict[str, dict[str, Any]] = {}


def store_dynamic_video(
    video_id: str,
    title: str,
    duration_sec: int,
    chapters: list[Chapter],
    transcript: list[dict[str, Any]],
    quiz: list[QuizQuestion] | None = None,
    notes: list[ChapterNotes] | None = None,
):
    """Store dynamically generated curriculum for a newly ingested video."""
    _DYNAMIC_CACHE[video_id] = {
        "title": title,
        "duration_sec": duration_sec,
        "chapters": chapters,
        "transcript": transcript,
        "quiz": quiz or generate_default_quiz_for_chapters(video_id, chapters),
        "notes": notes or generate_default_notes_for_chapters(video_id, chapters),
    }
    logger.info(f"Stored dynamic curriculum for video {video_id} ({len(chapters)} chapters)")


def get_dynamic_video(video_id: str) -> dict[str, Any] | None:
    return _DYNAMIC_CACHE.get(video_id)


def get_dynamic_chapters(video_id: str) -> list[Chapter] | None:
    data = _DYNAMIC_CACHE.get(video_id)
    return data["chapters"] if data else None


def get_dynamic_quiz(video_id: str) -> list[QuizQuestion] | None:
    data = _DYNAMIC_CACHE.get(video_id)
    return data["quiz"] if data else None


def get_dynamic_notes(video_id: str) -> list[ChapterNotes] | None:
    data = _DYNAMIC_CACHE.get(video_id)
    return data["notes"] if data else None


def generate_proportional_chapters(duration_sec: int, transcript: list[dict[str, Any]]) -> list[Chapter]:
    """
    Split any video into 3 coherent academic chapters based on proportional duration.
    Extracts summary lines from actual transcript segments if available.
    """
    dur = max(duration_sec, 300)
    c1_end = int(dur * 0.25)
    c2_end = int(dur * 0.65)

    def extract_summary(start: int, end: int, default: str) -> str:
        matches = [t["text"] for t in transcript if start <= t.get("start", 0) < end]
        if matches:
            text = " ".join(matches[:3])
            return text[:140] + ("..." if len(text) > 140 else "")
        return default

    return [
        Chapter(
            id=1,
            title="Introduction & Overview",
            start_sec=0,
            end_sec=c1_end,
            summary=extract_summary(0, c1_end, "Overview of lecture themes, fundamental definitions, and setup."),
        ),
        Chapter(
            id=2,
            title="Core Conceptual Framework",
            start_sec=c1_end,
            end_sec=c2_end,
            summary=extract_summary(c1_end, c2_end, "Detailed analysis, mechanisms, and core theoretical principles."),
        ),
        Chapter(
            id=3,
            title="Applications & Summary",
            start_sec=c2_end,
            end_sec=dur,
            summary=extract_summary(c2_end, dur, "Practical applications, worked examples, and final review."),
        ),
    ]


def generate_default_quiz_for_chapters(video_id: str, chapters: list[Chapter]) -> list[QuizQuestion]:
    """Generate domain-neutral quiz questions grounded in the video's actual chapters."""
    questions = []
    for idx, ch in enumerate(chapters):
        q_id = 9000 + idx + 1
        clip_start = ch.start_sec + 20
        clip_end = min(ch.start_sec + 80, ch.end_sec)
        questions.append(
            QuizQuestion(
                id=q_id,
                concept_tag=f"Chapter {ch.id}: {ch.title}",
                question=f"What is the primary focus of '{ch.title}'?",
                options=[
                    ch.summary or f"Fundamental conceptual principles of Chapter {ch.id}.",
                    "An unrelated hypothesis from outside the lecture scope.",
                    "An unverified external historical anecdote.",
                    "A contradictory assertion disproven earlier.",
                ],
                correct_idx=0,
                explanation=f"In Chapter {ch.id} ({ch.title}), the lecture focuses on: {ch.summary}",
                clip_start_sec=clip_start,
                clip_end_sec=clip_end,
            )
        )
    return questions


def generate_default_notes_for_chapters(video_id: str, chapters: list[Chapter]) -> list[ChapterNotes]:
    """Generate structured notes for each chapter."""
    notes = []
    for ch in chapters:
        notes.append(
            ChapterNotes(
                chapter_id=ch.id,
                chapter_title=ch.title,
                markdown_content=f"### {ch.title}\n\n{ch.summary}\n\n* Study timestamp range: {ch.start_sec}s – {ch.end_sec}s",
                formulas=[],
                key_takeaways=[
                    ch.summary,
                    f"Core segment from {ch.start_sec}s to {ch.end_sec}s.",
                ],
            )
        )
    return notes

