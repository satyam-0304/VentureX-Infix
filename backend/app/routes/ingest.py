import logging
from typing import Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException
from app.schemas import Chapter
from app.services.transcript import extract_youtube_id, fetch_youtube_transcript
from app.services.sample_data import (
    resolve_demo_key,
    get_demo_chapters,
    get_demo_video_title,
    DEMO_VIDEOS,
)
from app.services.dynamic_cache import (
    store_dynamic_video,
    get_dynamic_chapters,
    generate_proportional_chapters,
)
from app.services.gemini import is_gemini_configured, generate_structured
from app.prompts.chapters import build_chaptering_prompt, ChapteringOutput

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/video", tags=["Video Ingestion"])


class IngestRequest(BaseModel):
    youtube_url: str = Field(description="YouTube video URL or identifier")


class IngestResponse(BaseModel):
    video_id: str
    title: str
    duration_sec: int
    cached: bool
    chapters: list[Chapter]
    transcript: list[dict[str, Any]] = Field(default_factory=list, description="Raw transcript items with text, start, and duration")


@router.post("/ingest", response_model=IngestResponse)
async def ingest_video(request: IngestRequest) -> IngestResponse:
    """Ingest any YouTube URL or demo identifier, generating chapters and curriculum dynamically."""
    raw_input = request.youtube_url.strip()
    if not raw_input:
        raise HTTPException(status_code=400, detail="youtube_url parameter cannot be empty.")

    video_id = extract_youtube_id(raw_input)
    demo_key = resolve_demo_key(video_id)

    try:
        # Case 1: Known demo video fixture
        if demo_key and demo_key in DEMO_VIDEOS:
            title = get_demo_video_title(video_id)
            chapters = get_demo_chapters(video_id)
            demo_data = DEMO_VIDEOS[demo_key]
            duration = demo_data.get("duration_sec", 1800)
            transcript = demo_data.get("transcript", [])
            return IngestResponse(
                video_id=video_id,
                title=title,
                duration_sec=duration,
                cached=True,
                chapters=chapters,
                transcript=transcript,
            )

        # Case 2: Already dynamically cached
        cached_chapters = get_dynamic_chapters(video_id)
        if cached_chapters:
            from app.services.dynamic_cache import get_dynamic_video
            dyn = get_dynamic_video(video_id)
            return IngestResponse(
                video_id=video_id,
                title=dyn["title"] if dyn else f"Lecture Video ({video_id})",
                duration_sec=dyn["duration_sec"] if dyn else 1200,
                cached=True,
                chapters=cached_chapters,
                transcript=dyn.get("transcript", []) if dyn else [],
            )

        # Case 3: Fresh external YouTube video — fetch transcript & generate real chapters
        transcript = fetch_youtube_transcript(video_id)
        if not transcript:
            raise HTTPException(
                status_code=422,
                detail="Captions are unavailable for this video. Enable captions or choose a video with a transcript.",
            )
        duration = int(transcript[-1]["start"] + transcript[-1].get("duration", 0)) if transcript else 1200
        title = f"Lecture Video ({video_id})"

        chapters: list[Chapter] = []

        # Try Gemini AI chapter generation if API key is present
        if is_gemini_configured() and transcript:
            try:
                sample_lines = [f"[{int(t.get('start', 0))}s] {t.get('text', '')}" for t in transcript[:60]]
                formatted_transcript = "\n".join(sample_lines)
                sys_inst, user_prompt = build_chaptering_prompt(title, duration, formatted_transcript)
                output = generate_structured(user_prompt, ChapteringOutput, system_instruction=sys_inst)
                if output and output.chapters:
                    chapters = output.chapters
                    logger.info(f"Gemini successfully generated {len(chapters)} chapters for video {video_id}")
            except Exception as e:
                logger.warning(f"Gemini chapter generation failed for {video_id}: {e}")

        # Fallback: Proportional segmentation based on actual duration and transcript
        if not chapters:
            chapters = generate_proportional_chapters(duration, transcript)

        # Store in dynamic cache so /chapters, /notes, and /quiz serve this specific video
        store_dynamic_video(
            video_id=video_id,
            title=title,
            duration_sec=duration,
            chapters=chapters,
            transcript=transcript,
        )

        return IngestResponse(
            video_id=video_id,
            title=title,
            duration_sec=duration,
            cached=False,
            chapters=chapters,
            transcript=transcript,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to ingest video '{video_id}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to ingest video: {str(e)}")


@router.get("/{video_id}/transcript")
async def get_video_transcript(video_id: str):
    """Retrieve full transcript for a video (from dynamic cache, demo fixture, or live fetch)."""
    from app.services.dynamic_cache import get_dynamic_video
    dyn = get_dynamic_video(video_id)
    if dyn and dyn.get("transcript"):
        return dyn["transcript"]

    from app.services.sample_data import resolve_demo_key, DEMO_VIDEOS
    demo_key = resolve_demo_key(video_id)
    if demo_key and demo_key in DEMO_VIDEOS:
        return DEMO_VIDEOS[demo_key].get("transcript", [])

    try:
        transcript = fetch_youtube_transcript(video_id)
        return transcript
    except Exception as e:
        logger.warning(f"Could not fetch transcript for {video_id}: {e}")
        return []
