import logging
from fastapi import APIRouter, HTTPException
from app.schemas import (
    QuizQuestion,
    QuizSubmissionRequest,
    QuizSubmissionResponse,
    RemediationData,
    RewatchLink,
)
from app.services.sample_data import get_demo_quiz, get_demo_question, get_demo_transcript
from app.services.context_slicer import slice_transcript, format_transcript_slice, format_seconds_to_timestamp
from app.services.gemini import is_gemini_configured, generate_structured
from app.prompts.remediation import build_remediation_prompt

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Quiz & Remediation"])


@router.get("/api/video/{video_id}/quiz", response_model=list[QuizQuestion])
async def get_video_quiz(video_id: str):
    """Retrieve the concept-tagged quiz questions for a video."""
    return get_demo_quiz(video_id)


@router.post("/api/quiz/submit", response_model=QuizSubmissionResponse)
async def submit_quiz_answer(submission: QuizSubmissionRequest):
    """Evaluate a student's quiz answer and close the learning loop with video remediation if incorrect."""
    question = get_demo_question(submission.video_id, submission.question_id)
    if not question:
        raise HTTPException(status_code=404, detail=f"Question ID {submission.question_id} not found.")

    is_correct = (submission.selected_idx == question.correct_idx)
    correct_option = question.options[question.correct_idx]
    selected_option = question.options[submission.selected_idx] if 0 <= submission.selected_idx < len(question.options) else "Invalid Option"

    # If answer is correct: praise and return
    if is_correct:
        return QuizSubmissionResponse(
            is_correct=True,
            correct_idx=question.correct_idx,
            concept_tag=question.concept_tag,
            explanation=f"Excellent! {question.explanation}",
            remediation=None,
            current_mastery_score=1.0,
        )

    # If answer is incorrect: generate targeted remediation & precise rewatch clip
    clip_label = f"{format_seconds_to_timestamp(question.clip_start_sec)} - {format_seconds_to_timestamp(question.clip_end_sec)}"
    rewatch = RewatchLink(
        start_sec=question.clip_start_sec,
        end_sec=question.clip_end_sec,
        label=clip_label,
    )

    remediation = None
    if is_gemini_configured():
        try:
            transcript = get_demo_transcript(submission.video_id)
            clip_slice = slice_transcript(
                transcript,
                current_sec=question.clip_start_sec,
                window_before=15.0,
                window_after=(question.clip_end_sec - question.clip_start_sec) + 15.0,
            )
            formatted_clip = format_transcript_slice(clip_slice)

            system_instruction, user_prompt = build_remediation_prompt(
                question_text=question.question,
                concept_tag=question.concept_tag,
                correct_option_text=correct_option,
                student_selected_text=selected_option,
                clip_start_sec=question.clip_start_sec,
                clip_end_sec=question.clip_end_sec,
                formatted_clip_transcript=formatted_clip,
            )

            remediation = generate_structured(
                prompt=user_prompt,
                response_model=RemediationData,
                system_instruction=system_instruction,
                temperature=0.2,
            )
        except Exception as e:
            logger.warning(f"Gemini remediation generation failed, using fallback: {e}")

    if not remediation:
        # High-yield fallback remediation
        remediation = RemediationData(
            summary=f"You chose '{selected_option}'. However, the instructor explains that '{correct_option}' is the correct principle because {question.explanation.lower()}",
            rewatch_link=rewatch,
        )

    return QuizSubmissionResponse(
        is_correct=False,
        correct_idx=question.correct_idx,
        concept_tag=question.concept_tag,
        explanation=question.explanation,
        remediation=remediation,
        current_mastery_score=0.45,
    )

