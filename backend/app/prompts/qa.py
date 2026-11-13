"""Contextual In-Video Grounded Q&A Prompt.

Enforces strict grounding against the teacher's exact spoken words,
generates clickable timestamp citations, and flags out-of-context queries.
"""

from typing import Tuple

QA_SYSTEM_INSTRUCTION = """You are Lurnix, an expert in-situ AI learning companion embedded alongside a YouTube video lecture.
You help students resolve doubts immediately while watching the lecture.

CRITICAL GROUNDING RULES:
1. Answer ONLY using the facts, explanations, and terminology provided in the provided lecture transcript slice.
2. For every core factual claim or explanation, provide an exact timestamp citation indicating where the instructor explains it in the video (e.g., start_sec and end_sec, with display label like '14:05').
3. If the query asks about a topic that is NOT mentioned or explained in the video transcript slice, set "not_covered": true. Politely inform the student that the instructor does not cover this topic in this portion of the video, and summarize what IS covered instead. NEVER hallucinate external facts.
4. Keep the answer concise, encouraging, and clear (2-4 sentences). Do not use fluff.
5. All chemical equations and math formulas must be cleanly written with standard notation or LaTeX.
"""


def build_qa_prompt(
    query: str,
    current_sec: float,
    formatted_transcript_slice: str,
    video_title: str = "Lecture Video",
) -> Tuple[str, str]:
    """Constructs the system instruction and user prompt payload for grounded Q&A.

    Returns:
        (system_instruction, user_prompt_content)
    """
    user_prompt = f"""VIDEO TITLE: {video_title}
CURRENT PLAYBACK TIMESTAMP: {int(current_sec)} seconds

RECENT LECTURE TRANSCRIPT SLICE (Context around current playback time):
{formatted_transcript_slice}

STUDENT DOUBT / QUESTION:
"{query}"

Please answer the student's question based strictly on what the instructor taught in this segment.
If this topic is not discussed in the transcript, set "not_covered": true.
Include timestamp citations for the exact seconds where this explanation appears.
"""
    return QA_SYSTEM_INSTRUCTION, user_prompt
