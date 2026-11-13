from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, model_validator


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
    video_id: str = Field(default="demo_polymers", description="YouTube video ID or slug")
    current_timestamp: float = Field(default=0.0, description="Current video playback position in seconds", alias="currentTimestamp")
    query: str = Field(default="", description="Student's question or doubt", alias="userQuery")
    mode: QAMode = Field(default=QAMode.STANDARD, description="Explanation mode")

    model_config = {"populate_by_name": True}


class ChatResponse(BaseModel):
    answer: str = Field(description="Direct, grounded explanation answering the doubt")
    citations: list[Citation] = Field(default_factory=list, description="Clickable timestamp citations")
    not_covered: bool = Field(default=False, description="True if query is not covered in the lecture")
    concept_tag: Optional[str] = Field(default=None, description="Topic/concept tag")
    suggestedFollowUps: list[str] = Field(
        default=[
            "Explain this with an everyday analogy",
            "Show the step-by-step reaction mechanism",
            "Explain this in conversational Hinglish",
        ]
    )
    relatedTimestamp: Optional[int] = None
    text: Optional[str] = None

    model_config = {"populate_by_name": True}

    @model_validator(mode="after")
    def populate_frontend_compat(self) -> "ChatResponse":
        if not self.text:
            self.text = self.answer
        if self.relatedTimestamp is None and self.citations:
            self.relatedTimestamp = self.citations[0].start_sec
        return self


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


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    bio: Optional[str] = ""
    avatar_url: Optional[str] = ""
    institution: Optional[str] = ""
    target_exam: Optional[str] = ""
    created_at: int
    updated_at: int


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    institution: Optional[str] = None
    target_exam: Optional[str] = None


class AvatarUploadRequest(BaseModel):
    avatar_data: str = Field(description="Base64 encoded image or data URI")


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class LearningStats(BaseModel):
    total_lectures_watched: int
    total_lectures_completed: int
    total_learning_time_sec: int
    total_learning_time_formatted: str
    quizzes_attempted: int
    quizzes_completed: int
    average_quiz_accuracy: float
    current_streak_days: int
    active_modules_count: int


class WatchHistoryItem(BaseModel):
    id: int
    session_id: str
    video_id: str
    title: str
    course_name: str
    last_timestamp_sec: float
    last_timestamp_formatted: str
    duration_sec: float
    duration_formatted: str
    progress_percent: float
    completed: bool
    updated_at: int
    updated_at_relative: str


class RecordWatchRequest(BaseModel):
    session_id: str
    video_id: str
    title: str
    course_name: str
    current_timestamp_sec: float
    duration_sec: float
    completed: Optional[bool] = False


class AchievementItem(BaseModel):
    id: str
    badge_key: str
    title: str
    description: str
    icon: str
    tier: str  # bronze, silver, gold, platinum
    is_unlocked: bool
    unlocked_at: Optional[int] = None
    progress_percent: int


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: UserProfile


# ==========================================
# Flashcard Feature Schemas
# ==========================================

class FlashcardItem(BaseModel):
    id: str
    deck_id: str
    question: str
    answer: str
    category: str = Field(default="Concept", description="Definition, Concept, Formula, Important Fact")
    chapter_title: Optional[str] = None
    timestamp_sec: float = 0.0
    timestamp_formatted: str = "00:00"
    confidence: str = Field(default="unreviewed", description="not_confident, somewhat_confident, very_confident, unreviewed")
    is_bookmarked: bool = False
    review_count: int = 0
    last_reviewed_at: Optional[int] = None
    order_index: int = 0
    created_at: int = 0


class FlashcardDeck(BaseModel):
    id: str
    user_id: str
    video_id: str
    session_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    card_count: int = 0
    mastered_count: int = 0
    created_at: int = 0
    updated_at: int = 0
    cards: list[FlashcardItem] = Field(default_factory=list)


class GenerateFlashcardsRequest(BaseModel):
    video_id: str = Field(default="demo_polymers", description="YouTube video ID or slug")
    session_id: Optional[str] = None
    title: Optional[str] = None
    target_count: int = Field(default=18, ge=5, le=40, description="Target number of cards to generate (15-20 default)")
    chapter_filter: Optional[str] = None


class CreateCardRequest(BaseModel):
    question: str
    answer: str
    category: str = "Concept"
    chapter_title: Optional[str] = None
    timestamp_sec: float = 0.0


class UpdateCardRequest(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    is_bookmarked: Optional[bool] = None


class ReviewCardRequest(BaseModel):
    confidence: str = Field(description="not_confident, somewhat_confident, very_confident")


class AiAssistRequest(BaseModel):
    video_id: str
    deck_id: Optional[str] = None
    card_id: Optional[str] = None
    action: str = Field(description="explain, simplify, analogy, generate_more, edit, custom_chat")
    user_message: Optional[str] = None
    current_question: Optional[str] = None
    current_answer: Optional[str] = None
    concept: Optional[str] = None


class AiAssistResponse(BaseModel):
    reply: str
    suggested_question: Optional[str] = None
    suggested_answer: Optional[str] = None
    suggested_category: Optional[str] = None
    generated_cards: list[CreateCardRequest] = Field(default_factory=list)


