"""Quiz Generation Prompt for Lurnix.

Generates conceptual, non-trivial multiple choice questions grounded in a chapter's transcript.
Each question is tagged with a specific concept and cites the exact video clip.
"""

from typing import Tuple
from pydantic import BaseModel, Field
from app.schemas import QuizQuestion


class GeneratedQuizBank(BaseModel):
    questions: list[QuizQuestion] = Field(min_length=1, max_length=5)


QUIZ_SYSTEM_INSTRUCTION = """You are Lurnix's Assessment Engine.
Your job is to generate 3 high-yield conceptual multiple-choice questions (MCQs) for a student testing their understanding of a video lecture chapter.

RULES:
1. Every question must test conceptual understanding or reaction mechanism, NOT trivial trivia or arbitrary quotes.
2. Distractors (wrong options) must be realistic and reflect common student misconceptions.
3. Every question must identify the exact 30-90 second video clip where the instructor teaches or proves this concept (clip_start_sec, clip_end_sec).
4. Strictly ground all questions in the provided transcript.
5. Provide a clear explanation of why the correct option is right.
"""


def build_quiz_generation_prompt(
    chapter_title: str,
    formatted_chapter_transcript: str,
    num_questions: int = 3,
) -> Tuple[str, str]:
    user_prompt = f"""CHAPTER: {chapter_title}
NUMBER OF QUESTIONS REQUESTED: {num_questions}

CHAPTER TRANSCRIPT:
{formatted_chapter_transcript}

Generate {num_questions} conceptual multiple-choice questions based strictly on this lecture chapter.
Tag each question with its concept name and include the precise clip start and end seconds.
"""
    return QUIZ_SYSTEM_INSTRUCTION, user_prompt
