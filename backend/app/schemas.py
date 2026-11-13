from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class QAMode(str, Enum):
    STANDARD = "standard"
    SIMPLER = "simpler"
    ANALOGY = "analogy"
    STEP_BY_STEP = "step_by_step"
    HINGLISH = "hinglish"


class Citation(BaseModel):
    label: str = Field(description="Display label, e.g. '14:05'")
    start_sec: int = Field(description="Start time in seconds")
    end_sec: int = Field(description="End time in seconds")


class ChatRequest(BaseModel):
    video_id: str = Field(description="YouTube video ID or slug")
    current_timestamp: float = Field(default=0.0, description="Current video playback position in seconds")
    query: str = Field(description="Student's question or doubt")
    mode: QAMode = Field(default=QAMode.STANDARD, description="Explanation mode")


class ChatResponse(BaseModel):
    answer: str = Field(description="Direct, grounded explanation answering the doubt")
    citations: list[Citation] = Field(default_factory=list, description="Clickable timestamp citations")
    not_covered: bool = Field(default=False, description="True if query is not covered in the lecture")
    concept_tag: Optional[str] = Field(default=None, description="Topic/concept tag")


class RewatchLink(BaseModel):
    start_sec: int
    end_sec: int
    label: str  # e.g. "13:50 - 14:40"


class RemediationData(BaseModel):
    summary: str
    rewatch_link: RewatchLink


class QuizQuestion(BaseModel):
    id: Optional[int] = None
    concept_tag: str
    question: str
    options: list[str] = Field(min_length=4, max_length=4)
    correct_idx: int = Field(ge=0, le=3)
    explanation: str
    clip_start_sec: int
    clip_end_sec: int


class QuizSubmissionRequest(BaseModel):
    session_id: str
    video_id: str
    question_id: int
    selected_idx: int


class QuizSubmissionResponse(BaseModel):
    is_correct: bool
    correct_idx: int
    concept_tag: str
    explanation: str
    remediation: Optional[RemediationData] = None
    current_mastery_score: Optional[float] = None


class Chapter(BaseModel):
    id: int
    title: str
    start_sec: int
    end_sec: int
    summary: Optional[str] = None


class ChapterNotes(BaseModel):
    chapter_id: int
    chapter_title: str
    markdown_content: str
    formulas: list[str] = Field(default_factory=list)
    key_takeaways: list[str] = Field(default_factory=list)


class RapidRevisionItem(BaseModel):
    concept: str
    key_rule: str
    timestamp_sec: int


class RapidRevisionResponse(BaseModel):
    video_id: str
    executive_summary: str
    high_yield_points: list[RapidRevisionItem]
    cheat_sheet_formulas: list[str]


class HealthResponse(BaseModel):
    status: str
    service: str
    gemini_configured: bool
    environment: str

