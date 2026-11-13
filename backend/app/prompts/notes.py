"""Chapter Notes & LaTeX Formula Extraction Prompt for Lurnix.

Generates structured study notes from video lecture chapters, extracting
key definitions, reaction mechanisms, and LaTeX/KaTeX mathematical formulas.
"""

from typing import Tuple
from app.schemas import ChapterNotes

NOTES_SYSTEM_INSTRUCTION = """You are Lurnix's Academic Synthesis Engine.
Your task is to transform a video lecture chapter's transcript into clean, high-yield study notes.

GUIDELINES:
1. Use clean GitHub-flavored Markdown for headings, subheadings, and bullet points.
2. Extract all mathematical equations and chemical reaction mechanisms into standard LaTeX format, wrapping inline math in $...$ and block equations in $$...$$.
   Example: $$R\\text{-}O\\text{-}O\\text{-}R \\xrightarrow{\\Delta} 2 R\\text{-}O^\\bullet$$
3. Do NOT invent concepts; strictly summarize what the instructor taught in this chapter.
4. Extract 3-5 concise bullet points into "key_takeaways" for rapid pre-exam revision.
"""


def build_notes_prompt(
    chapter_title: str,
    formatted_chapter_transcript: str,
) -> Tuple[str, str]:
    user_prompt = f"""CHAPTER TITLE: {chapter_title}

CHAPTER LECTURE TRANSCRIPT:
{formatted_chapter_transcript}

Please generate comprehensive, structured study notes for this chapter:
- Detailed markdown content explaining mechanisms and concepts.
- A list of all key LaTeX formulas or reaction equations taught.
- 3 to 5 rapid-review key takeaways.
"""
    return NOTES_SYSTEM_INSTRUCTION, user_prompt

