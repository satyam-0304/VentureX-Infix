import logging
from fastapi import APIRouter
from app.schemas import RapidRevisionResponse
from app.services.sample_data import get_demo_revision, get_demo_transcript, get_demo_video_title
from app.services.context_slicer import format_transcript_slice
from app.services.gemini import is_gemini_configured, generate_structured
from app.prompts.revision import build_revision_prompt

logger = logging.getLogger(__name__)

router = APIRouter(tags=["10-Minute Rapid Revision"])


@router.get("/api/video/{video_id}/revision", response_model=RapidRevisionResponse)
async def get_rapid_revision_cheat_sheet(video_id: str):
    """Generate or retrieve a 10-minute exam cheat sheet with clickable key timestamps."""
    if is_gemini_configured():
        try:
            transcript = get_demo_transcript(video_id)
            title = get_demo_video_title(video_id)
            # Sample across timeline for high-yield synthesis
            formatted = format_transcript_slice(transcript[::2] if len(transcript) > 20 else transcript)

            system_instruction, user_prompt = build_revision_prompt(
                video_title=title,
                duration_sec=3050,
                formatted_full_transcript=formatted,
            )

            return generate_structured(
                prompt=user_prompt,
                response_model=RapidRevisionResponse,
                system_instruction=system_instruction,
                temperature=0.2,
            )
        except Exception as e:
            logger.warning(f"Live revision generation failed, using fallback: {e}")

    # Fallback to pre-indexed high-yield revision
    return get_demo_revision(video_id)
