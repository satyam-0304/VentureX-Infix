"""Remediation & Closed-Loop Feedback Prompt for Lurnix.

When a student selects an incorrect quiz option, this engine diagnoses
their specific conceptual misconception and routes them directly back to the
exact video clip to master the concept.
"""

from typing import Tuple
from app.schemas import RemediationData

REMEDIATION_SYSTEM_INSTRUCTION = """You are Lurnix's Diagnostic Remediation Engine.
A student just answered a multiple-choice question incorrectly while studying from a video lecture.
Your mission is to close the learning loop:
1. Explain WHY their chosen option is wrong and identify the common misconception they fell into.
2. Provide a 1-2 sentence clarification based on what the instructor taught.
3. Supply the exact start and end seconds of the video clip the student should rewatch to clear up the confusion.
4. Keep the label in clean 'mm:ss - mm:ss' format.
"""


def build_remediation_prompt(
    question_text: str,
    concept_tag: str,
    correct_option_text: str,
    student_selected_text: str,
    clip_start_sec: int,
    clip_end_sec: int,
    formatted_clip_transcript: str,
) -> Tuple[str, str]:
    user_prompt = f"""CONCEPT TESTED: {concept_tag}
QUESTION: "{question_text}"
CORRECT ANSWER: "{correct_option_text}"
STUDENT'S WRONG ANSWER: "{student_selected_text}"

ORIGINAL VIDEO CLIP TRANSCRIPT (seconds {clip_start_sec} to {clip_end_sec}):
{formatted_clip_transcript}

Please diagnose the student's mistake:
- What confusion caused them to choose "{student_selected_text}"?
- Give a friendly clarification of why "{correct_option_text}" is the correct principle taught in this video.
- Recommend rewatching the video between {clip_start_sec} and {clip_end_sec} seconds.
"""
    return REMEDIATION_SYSTEM_INSTRUCTION, user_prompt

