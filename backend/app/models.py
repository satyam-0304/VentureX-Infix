import datetime
from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey, DateTime
from database import Base

class Video(Base):
    __tablename__ = "videos"
    id = Column(String, primary_key=True)               # e.g., "vid_123" or youtube_id
    youtube_id = Column(String, unique=True, index=True)
    title = Column(String, default="Untitled Video")
    duration_sec = Column(Integer, default=0)
    transcript_json = Column(Text)                      # JSON string of raw transcript list[dict]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(String, primary_key=True)
    video_id = Column(String, ForeignKey("videos.id"), index=True)
    title = Column(String)
    start_sec = Column(Integer)
    end_sec = Column(Integer)
    summary = Column(Text)
    order_idx = Column(Integer)

class Note(Base):
    __tablename__ = "notes"
    id = Column(String, primary_key=True)
    video_id = Column(String, ForeignKey("videos.id"), index=True)
    chapter_id = Column(String, ForeignKey("chapters.id"), index=True)
    content_markdown = Column(Text)
    formulas_json = Column(Text, default="[]")          # JSON array of LaTeX formulas

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id = Column(String, primary_key=True)
    video_id = Column(String, ForeignKey("videos.id"), index=True)
    chapter_id = Column(String, ForeignKey("chapters.id"), index=True)
    concept_tag = Column(String)
    question = Column(Text)
    options_json = Column(Text)                         # JSON array of options: ["A", "B", "C", "D"]
    correct_idx = Column(Integer)                       # 0, 1, 2, or 3
    explanation = Column(Text)
    clip_start_sec = Column(Integer)                    # Timestamp start for rewatch
    clip_end_sec = Column(Integer)                      # Timestamp end for rewatch

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(String, primary_key=True)
    session_id = Column(String, index=True)
    question_id = Column(String, ForeignKey("quiz_questions.id"))
    selected_idx = Column(Integer)
    is_correct = Column(Boolean)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Mastery(Base):
    __tablename__ = "mastery"
    id = Column(String, primary_key=True)
    session_id = Column(String, index=True)
    concept_tag = Column(String)
    mastery_score = Column(Integer, default=0)          # 0 to 100
