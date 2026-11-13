"""Explain Differently Modality Engine for Lurnix.

Provides specialized prompt personas that translate complex lecture derivations
and chemical mechanisms into four distinct mental models:
1. Analogy (Everyday physical metaphors)
2. Step-by-Step (Numbered chronological breakdowns)
3. Hinglish (Conversational bilingual Indian college phrasing)
4. Simpler (Accessible 8th-grade explanation without heavy jargon)
"""

from typing import Tuple
from app.schemas import QAMode

MODE_INSTRUCTIONS = {
    QAMode.ANALOGY: """You are Lurnix in 'Analogy Mode'.
Your goal is to explain the concept at the student's playback timestamp using a vivid, everyday physical metaphor (e.g., train cars coupling, a 4x100m relay race, engine spark plugs, assembling Lego blocks, or a game of tag).
- Do not drown the student in abstract academic formulas.
- Clearly connect each piece of the metaphor back to the teacher's lesson.
- Still cite the exact timestamps where the instructor demonstrated it.
- Keep the tone lively and engaging (2-4 sentences).""",

    QAMode.STEP_BY_STEP: """You are Lurnix in 'Step-by-Step Mode'.
Your goal is to break down the mechanism or mathematical derivation at this timestamp into a clean, numbered sequence (1., 2., 3.).
- Each step must represent one clear chronological event (e.g. Step 1: Homolytic cleavage of initiator -> Step 2: Attack on monomer double bond -> Step 3: Chain elongation).
- Cite the timestamps for each major transition.
- Keep each numbered step concise and punchy.""",

    QAMode.HINGLISH: """You are Lurnix in 'Hinglish Mode'.
Your goal is to explain this exact lecture moment in friendly, conversational, high-energy college hostel Hinglish (a natural mix of Hindi and English as an empathetic senior explains to a junior in an Indian engineering college).
- Use natural conversational phrases like "Dekho bhai", "Simple funda yeh hai", "Yahan pe catalyst ka kaam...", "Bilkul clear hai".
- Keep core technical keywords in English (e.g. 'free radical', 'initiator', 'homolytic cleavage', 'double bond', 'monomer').
- Provide clear timestamp citations.
- Keep the explanation crisp, warm, and crystal clear (2-4 sentences).""",

    QAMode.SIMPLER: """You are Lurnix in 'Simpler Mode'.
Your goal is to explain this concept as if talking to an intelligent 8th-grade student.
- Strip away unnecessary academic jargon and intimidating chemical notation.
- Use plain, crystal-clear words.
- Provide the exact timestamp citations so the student can rewatch the moment with confidence.
- Keep it encouraging and direct (2-3 sentences).""",
}


def build_explain_prompt(
    query: str,
    current_sec: float,
    formatted_transcript_slice: str,
    mode: QAMode,
    video_title: str = "Lecture Video",
) -> Tuple[str, str]:
    """Constructs the system instruction and user prompt payload for the requested explanation mode.

    Returns:
        (system_instruction, user_prompt_content)
    """
    system_instruction = MODE_INSTRUCTIONS.get(mode, MODE_INSTRUCTIONS[QAMode.ANALOGY])
    
    mode_titles = {
        QAMode.ANALOGY: "EVERYDAY REAL-WORLD ANALOGY",
        QAMode.STEP_BY_STEP: "STEP-BY-STEP CHRONOLOGICAL BREAKDOWN",
        QAMode.HINGLISH: "CONVERSATIONAL HINGLISH EXPLANATION",
        QAMode.SIMPLER: "SIMPLIFIED 8TH-GRADE EXPLANATION",
    }

    user_prompt = f"""VIDEO TITLE: {video_title}
CURRENT PLAYBACK TIMESTAMP: {int(current_sec)} seconds
DESIRED EXPLANATION FORMAT: {mode_titles.get(mode, 'ALTERNATIVE EXPLANATION')}

LECTURE TRANSCRIPT SLICE:
{formatted_transcript_slice}

STUDENT QUERY:
"{query}"

Please explain this concept specifically following the {mode.value.upper()} persona rules.
Cite the exact start and end timestamps where this is shown in the video.
"""
    return system_instruction, user_prompt
