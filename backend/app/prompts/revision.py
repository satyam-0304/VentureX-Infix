"""10-Minute Rapid Revision Engine Prompt for Lurnix.

Compresses entire video lectures into an exam-day rapid review cheat sheet:
- Executive summary
- High-yield takeaways with clickable exam timestamps
- Core formula cheat sheet in LaTeX
"""

from typing import Tuple
from app.schemas import RapidRevisionResponse

REVISION_SYSTEM_INSTRUCTION = """You are Lurnix's Rapid Exam Revision Engine.
Your mission is to synthesize an entire video lecture into a high-yield, 10-minute pre-exam cheat sheet for a student taking an exam today.

RULES:
1. Executive Summary: 2-3 sentences capturing the core thesis of the lecture.
2. High-Yield Points: Extract 5 to 10 exam-critical rules, definitions, or mechanisms.
   - Each point must have a concept name, the key rule/takeaway, and the precise timestamp_sec where it was taught.
3. Cheat Sheet Formulas: Collect all vital mathematical or chemical equations written in standard LaTeX ($...$ or $$...$$).
4. Strictly ground all points in the lecture transcript; do not introduce external syllabus material.
"""


def build_revision_prompt(
    video_title: str,
    duration_sec: int,
    formatted_full_transcript: str,
) -> Tuple[str, str]:
    user_prompt = f"""VIDEO TITLE: {video_title}
TOTAL DURATION: {duration_sec} seconds

LECTURE TRANSCRIPT (Summary across timeline):
{formatted_full_transcript}

Please generate a high-yield 10-minute rapid revision cheat sheet for this lecture:
- Executive summary of the lecture.
- 5 to 10 high-yield concepts with their key rules and exact timestamps in seconds.
- A concise LaTeX formula cheat sheet.
"""
    return REVISION_SYSTEM_INSTRUCTION, user_prompt

