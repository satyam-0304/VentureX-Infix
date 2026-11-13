import logging
from typing import Optional, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/telemetry", tags=["Telemetry & Confusion Detection"])


class SeekEventRequest(BaseModel):
    session_id: str = Field(description="Unique session ID for learner")
    video_id: str = Field(description="Target video ID")
    from_sec: float = Field(description="Scrubber position before seek")
    to_sec: float = Field(description="Scrubber position after seek")


class NudgeData(BaseModel):
    target_timestamp: float
    message: str
    suggested_modes: list[str]


class SeekResponse(BaseModel):
    confusion_detected: bool
    nudge: Optional[NudgeData] = None


@router.post("/seek", response_model=SeekResponse)
async def log_seek_and_check_confusion(event: SeekEventRequest) -> SeekResponse:
    """Analyze player seek behavior to proactively detect confusion and offer tailored assistance."""
    # Detect backward seek of 15 seconds or greater
    is_rewind = event.to_sec < event.from_sec
    rewind_distance = event.from_sec - event.to_sec

    if is_rewind and rewind_distance >= 15.0:
        return SeekResponse(
            confusion_detected=True,
            nudge=NudgeData(
                target_timestamp=event.to_sec,
                message="You rewound this section. Want a real-world analogy or a step-by-step breakdown?",
                suggested_modes=["analogy", "step_by_step", "hinglish", "simpler"],
            ),
        )

    return SeekResponse(confusion_detected=False, nudge=None)
