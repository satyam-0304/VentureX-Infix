import logging
from fastapi import APIRouter, HTTPException
from app.schemas import Chapter, ChapterNotes
from app.services.sample_data import get_demo_chapters, get_demo_notes, get_demo_chapter_notes

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Chapters & Notes"])


@router.get("/api/video/{video_id}/chapters", response_model=list[Chapter])
async def get_video_chapters(video_id: str):
    """Retrieve structured chapter timeline boundaries for a video."""
    return get_demo_chapters(video_id)


@router.get("/api/video/{video_id}/notes", response_model=list[ChapterNotes])
async def get_all_video_notes(video_id: str):
    """Retrieve auto-generated notes and LaTeX formulas for all chapters in a video."""
    return get_demo_notes(video_id)


@router.get("/api/video/{video_id}/notes/{chapter_id}", response_model=ChapterNotes)
async def get_single_chapter_notes(video_id: str, chapter_id: int):
    """Retrieve structured notes and formulas for a specific chapter."""
    notes = get_demo_chapter_notes(video_id, chapter_id)
    if not notes:
        raise HTTPException(
            status_code=404,
            detail=f"Notes for chapter ID {chapter_id} in video '{video_id}' not found.",
        )
    return notes

