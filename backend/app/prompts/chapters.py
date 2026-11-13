"""Video Ingestion & Chaptering Prompt for Lurnix.

Segments full video lecture transcripts into 4-7 cohesive study chapters
with precise start and end timestamps.
"""

from typing import Tuple
from pydantic import BaseModel, Field
from app.schemas import Chapter


class ChapteringOutput(BaseModel):
    chapters: list[Chapter] = Field(min_length=3, max_length=8)


CHAPTERING_SYSTEM_INSTRUCTION = """You are Lurnix's Lecture Structure Engine.
Your job is to read an entire video lecture transcript and split it into 4 to 7 coherent study chapters.

RULES:
1. Chapter start_sec must correspond to a real transition point in the lecture where a new major topic begins.
2. The first chapter must start at 0 seconds.
3. The chapters must cover the full duration of the lecture without time gaps or overlapping.
4. Keep chapter titles concise, academic, and clear (e.g. 'Addition Polymerization Mechanism').
5. Provide a 1-sentence summary of what is covered in each chapter.
"""


def build_chaptering_prompt(
    video_title: str,
    duration_sec: int,
    formatted_full_transcript: str,
) -> Tuple[str, str]:
    user_prompt = f"""VIDEO TITLE: {video_title}
TOTAL DURATION: {duration_sec} seconds

FULL LECTURE TRANSCRIPT (Sampled across timestamps):
{formatted_full_transcript}

Please divide this lecture into logical study chapters with accurate start and end seconds.
"""
    return CHAPTERING_SYSTEM_INSTRUCTION, user_prompt

