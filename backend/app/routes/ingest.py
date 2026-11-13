import logging
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException
from app.schemas import Chapter
from app.services.transcript import extract_youtube_id, fetch_youtube_transcript
from app.services.sample_data import get_demo_chapters, get_demo_video_title, DEMO_VIDEOS

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


@router.post("/ingest", response_model=IngestResponse)
async def ingest_video(request: IngestRequest) -> IngestResponse:
    """Ingest any YouTube URL or demo identifier, pulling chapters and transcripts."""
    raw_input = request.youtube_url.strip()
    if not raw_input:
        raise HTTPException(status_code=400, detail="youtube_url parameter cannot be empty.")

    video_id = extract_youtube_id(raw_input)
    is_cached = video_id in DEMO_VIDEOS

    try:
        # Fetch or retrieve transcript
        transcript = fetch_youtube_transcript(video_id)
        title = get_demo_video_title(video_id) if is_cached else f"Lecture Video ({video_id})"
        chapters = get_demo_chapters(video_id)

        duration = int(transcript[-1]["start"] + transcript[-1].get("duration", 0)) if transcript else 1800

        return IngestResponse(
            video_id=video_id,
            title=title,
            duration_sec=duration,
            cached=is_cached,
            chapters=chapters,
        )
    except Exception as e:
        logger.error(f"Failed to ingest video '{video_id}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to ingest video: {str(e)}")

