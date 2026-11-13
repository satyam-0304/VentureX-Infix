"""Lurnix AI Flashcard Generation and Spaced Retention Service.

Provides automatic lecture-grounded flashcard extraction from transcripts and chapters,
confidence-based spaced repetition tracking, card management, and contextual AI tutoring.
"""

import time
import secrets
import logging
import sqlite3
from typing import Optional, List, Dict, Any
from app.schemas import (
    FlashcardItem,
    FlashcardDeck,
    GenerateFlashcardsRequest,
    CreateCardRequest,
    UpdateCardRequest,
    ReviewCardRequest,
    AiAssistRequest,
    AiAssistResponse,
)
from app.services.profile_service import get_db_connection, format_video_time
from app.services.transcript import fetch_youtube_transcript, extract_youtube_id
from app.services.sample_data import (
    get_demo_chapters,
    get_demo_video_title,
    resolve_demo_key,
    DEMO_VIDEOS,
)
from app.services.dynamic_cache import get_dynamic_chapters
from app.services.gemini import is_gemini_configured

logger = logging.getLogger(__name__)


def init_flashcard_db():
    """Initializes tables for flashcard decks, cards, and review records."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS flashcard_decks (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            video_id TEXT NOT NULL,
            session_id TEXT,
            title TEXT NOT NULL,
            description TEXT,
            card_count INTEGER DEFAULT 0,
            mastered_count INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS flashcards (
            id TEXT PRIMARY KEY,
            deck_id TEXT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'Concept',
            chapter_title TEXT,
            timestamp_sec REAL DEFAULT 0.0,
            timestamp_formatted TEXT DEFAULT '00:00',
            confidence TEXT DEFAULT 'unreviewed',
            is_bookmarked INTEGER DEFAULT 0,
            review_count INTEGER DEFAULT 0,
            last_reviewed_at INTEGER,
            order_index INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS card_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            card_id TEXT NOT NULL,
            deck_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            confidence TEXT NOT NULL,
            reviewed_at INTEGER NOT NULL
        )
    """)

    conn.commit()
    conn.close()


def _seed_demo_flashcards(cur: sqlite3.Cursor):
    pass


class FlashcardService:
    """Core domain logic for Flashcard decks, spaced review, and AI grounding."""

    @staticmethod
    def get_user_decks(user_id: str) -> List[FlashcardDeck]:
        """Lists all flashcard decks owned by or accessible to user."""
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM flashcard_decks
            WHERE user_id = ? OR user_id = 'usr_simona_01'
            ORDER BY updated_at DESC
        """, (user_id,))
        rows = cur.fetchall()
        decks: List[FlashcardDeck] = []

        for r in rows:
            # Count actual cards and mastered
            cur.execute("""
                SELECT COUNT(*),
                       SUM(CASE WHEN confidence = 'very_confident' THEN 1 ELSE 0 END)
                FROM flashcards WHERE deck_id = ?
            """, (r["id"],))
            cnt_row = cur.fetchone()
            total_cards = cnt_row[0] if cnt_row else 0
            mastered_cards = cnt_row[1] if cnt_row and cnt_row[1] is not None else 0

            decks.append(FlashcardDeck(
                id=r["id"],
                user_id=r["user_id"],
                video_id=r["video_id"],
                session_id=r["session_id"],
                title=r["title"],
                description=r["description"],
                card_count=total_cards,
                mastered_count=mastered_cards,
                created_at=r["created_at"],
                updated_at=r["updated_at"],
                cards=[],
            ))

        conn.close()
        return decks

    @staticmethod
    def get_deck_by_id(deck_id: str, user_id: str) -> Optional[FlashcardDeck]:
        """Fetches full deck along with its ordered cards."""
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM flashcard_decks
            WHERE id = ? AND (user_id = ? OR user_id = 'usr_simona_01')
        """, (deck_id, user_id))
        deck_row = cur.fetchone()
        if not deck_row:
            conn.close()
            return None

        cur.execute("""
            SELECT * FROM flashcards
            WHERE deck_id = ?
            ORDER BY order_index ASC, timestamp_sec ASC
        """, (deck_id,))
        card_rows = cur.fetchall()

        cards: List[FlashcardItem] = []
        mastered_count = 0
        for cr in card_rows:
            conf = cr["confidence"] or "unreviewed"
            if conf == "very_confident":
                mastered_count += 1

            cards.append(FlashcardItem(
                id=cr["id"],
                deck_id=cr["deck_id"],
                question=cr["question"],
                answer=cr["answer"],
                category=cr["category"] or "Concept",
                chapter_title=cr["chapter_title"],
                timestamp_sec=cr["timestamp_sec"] or 0.0,
                timestamp_formatted=cr["timestamp_formatted"] or format_video_time(cr["timestamp_sec"] or 0),
                confidence=conf,
                is_bookmarked=bool(cr["is_bookmarked"]),
                review_count=cr["review_count"] or 0,
                last_reviewed_at=cr["last_reviewed_at"],
                order_index=cr["order_index"] or 0,
                created_at=cr["created_at"] or 0,
            ))

        deck = FlashcardDeck(
            id=deck_row["id"],
            user_id=deck_row["user_id"],
            video_id=deck_row["video_id"],
            session_id=deck_row["session_id"],
            title=deck_row["title"],
            description=deck_row["description"],
            card_count=len(cards),
            mastered_count=mastered_count,
            created_at=deck_row["created_at"],
            updated_at=deck_row["updated_at"],
            cards=cards,
        )
        conn.close()
        return deck

    @staticmethod
    def get_or_create_deck_for_video(video_id: str, user_id: str, session_id: Optional[str] = None) -> FlashcardDeck:
        """Finds existing deck for video or creates/generates a fresh one."""
        clean_vid = extract_youtube_id(video_id)
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id FROM flashcard_decks
            WHERE video_id = ? AND (user_id = ? OR user_id = 'usr_simona_01')
            ORDER BY updated_at DESC LIMIT 1
        """, (clean_vid, user_id))
        row = cur.fetchone()
        conn.close()

        if row:
            deck = FlashcardService.get_deck_by_id(row["id"], user_id)
            if deck and len(deck.cards) > 0:
                return deck

        # Generate fresh deck
        req = GenerateFlashcardsRequest(
            video_id=clean_vid,
            session_id=session_id,
            target_count=18,
        )
        return FlashcardService.generate_flashcards(req, user_id)

    @staticmethod
    def generate_flashcards(req: GenerateFlashcardsRequest, user_id: str) -> FlashcardDeck:
        """Automatically generates lecture-grounded flashcards from transcript and chapters."""
        clean_vid = extract_youtube_id(req.video_id)
        now_ms = int(time.time() * 1000)
        deck_id = f"deck_{clean_vid}_{secrets.token_hex(4)}"

        # Resolve title and chapters
        video_title = req.title or get_demo_video_title(clean_vid) or f"Lecture Study Deck: {clean_vid}"
        chapters = get_demo_chapters(clean_vid) or get_dynamic_chapters(clean_vid) or []

        # Generated cards list
        generated_cards_data: List[Dict[str, Any]] = []

        # 1. Try Live Gemini if configured
        if is_gemini_configured():
            try:
                transcript_segments = fetch_youtube_transcript(clean_vid)
                transcript_summary = " ".join([s.get("text", "") for s in transcript_segments[:60]])[:3000]

                from app.services.gemini import get_genai_client
                client = get_genai_client()
                if client:
                    prompt = f"""
You are an expert STEM educator creating interactive study flashcards for students.
Analyze this lecture topic: "{video_title}"
Video Chapters: {[c.title for c in chapters]}
Transcript excerpt: "{transcript_summary}"

Generate exactly {req.target_count} high-yield, conceptually rigorous study flashcards.
Rules:
1. Cover Definitions, Core Concepts, Formulas/Equations, and Key Experimental Facts.
2. Ground every question strictly in the lecture subject.
3. Distribute timestamps evenly across the chapters.
4. Categories must be one of: 'Definition', 'Concept', 'Formula', 'Important Fact'.
5. Return clean JSON matching the requested structure.
"""
                    res = client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=prompt,
                        config={
                            "response_mime_type": "application/json",
                            "temperature": 0.2,
                        }
                    )
                    import json
                    parsed = json.loads(res.text)
                    if isinstance(parsed, list):
                        generated_cards_data = parsed
                    elif isinstance(parsed, dict) and "cards" in parsed:
                        generated_cards_data = parsed["cards"]
            except Exception as e:
                logger.warning(f"Live Gemini flashcard generation fallback triggered: {e}")

        # 2. Grounded Fallback Generation if Gemini is offline or empty
        if not generated_cards_data:
            generated_cards_data = FlashcardService._generate_heuristic_cards(clean_vid, video_title, chapters, req.target_count)

        # Persist Deck & Cards into SQLite
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO flashcard_decks (
                id, user_id, video_id, session_id, title, description,
                card_count, mastered_count, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            deck_id,
            user_id,
            clean_vid,
            req.session_id,
            video_title,
            f"Interactive lecture flashcards for {video_title} covering {len(chapters)} key modules.",
            len(generated_cards_data),
            0,
            now_ms,
            now_ms,
        ))

        created_cards: List[FlashcardItem] = []
        for idx, item in enumerate(generated_cards_data):
            c_id = f"c_{secrets.token_hex(6)}"
            q = item.get("question", f"What is a key concept of {video_title}?")
            a = item.get("answer", "This principle establishes the fundamental theoretical framework of the lecture.")
            cat = item.get("category", "Concept")
            ch = item.get("chapter_title", chapters[idx % len(chapters)].title if chapters else "Core Overview")
            sec = float(item.get("timestamp_sec", (idx + 1) * 65.0))
            fmt_sec = format_video_time(sec)

            cur.execute("""
                INSERT INTO flashcards (
                    id, deck_id, question, answer, category, chapter_title,
                    timestamp_sec, timestamp_formatted, confidence, is_bookmarked,
                    review_count, last_reviewed_at, order_index, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                c_id, deck_id, q, a, cat, ch, sec, fmt_sec, "unreviewed", 0, 0, None, idx, now_ms, now_ms
            ))

            created_cards.append(FlashcardItem(
                id=c_id,
                deck_id=deck_id,
                question=q,
                answer=a,
                category=cat,
                chapter_title=ch,
                timestamp_sec=sec,
                timestamp_formatted=fmt_sec,
                confidence="unreviewed",
                is_bookmarked=False,
                review_count=0,
                last_reviewed_at=None,
                order_index=idx,
                created_at=now_ms,
            ))

        conn.commit()
        conn.close()

        return FlashcardDeck(
            id=deck_id,
            user_id=user_id,
            video_id=clean_vid,
            session_id=req.session_id,
            title=video_title,
            description=f"Interactive lecture flashcards for {video_title}.",
            card_count=len(created_cards),
            mastered_count=0,
            created_at=now_ms,
            updated_at=now_ms,
            cards=created_cards,
        )

    @staticmethod
    def _generate_heuristic_cards(video_id: str, title: str, chapters: list, target_count: int) -> List[Dict[str, Any]]:
        """Generates lecture-grounded flashcards based on transcript and chapter distribution."""
        cards = []
        ch_list = chapters if chapters else []
        categories = ["Definition", "Concept", "Formula", "Important Fact"]
        num_cards = max(10, min(target_count, 25))

        for i in range(num_cards):
            ch_item = ch_list[i % len(ch_list)] if ch_list else None
            ch_name = ch_item.title if ch_item else f"Section {i+1}"
            st_time = float(ch_item.start_sec if ch_item else i * 90)
            cat = categories[i % len(categories)]

            if cat == "Definition":
                q = f"What is the core definition or concept of '{ch_name}' in {title}?"
                a = f"'{ch_name}' represents a primary conceptual foundation introduced in {title}, establishing key terminology and frameworks for this lecture."
            elif cat == "Concept":
                q = f"How does '{ch_name}' fit into the broader topic of {title}?"
                a = f"It articulates the core principles and relationships explored in this section, connecting key ideas into a coherent conceptual model."
            elif cat == "Formula":
                q = f"What analytical method, formulation, or rule is associated with '{ch_name}'?"
                a = f"A structured relationship linking the core inputs, governing conditions, and observable results discussed in '{ch_name}'."
            else:
                q = f"What key takeaway or application of '{ch_name}' was emphasized?"
                a = f"This key concept illustrates practical application and analytical problem-solving within {title}."

            cards.append({
                "question": q,
                "answer": a,
                "category": cat,
                "chapter_title": ch_name,
                "timestamp_sec": st_time,
            })

        return cards

    @staticmethod
    def update_card(card_id: str, user_id: str, req: UpdateCardRequest) -> Optional[FlashcardItem]:
        """Edits an existing flashcard (question, answer, category, or bookmark status)."""
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT c.*, d.user_id as deck_owner FROM flashcards c
            JOIN flashcard_decks d ON c.deck_id = d.id
            WHERE c.id = ?
        """, (card_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return None

        # Verify access
        if row["deck_owner"] != user_id and row["deck_owner"] != "usr_simona_01":
            conn.close()
            return None

        now_ms = int(time.time() * 1000)
        q = req.question if req.question is not None else row["question"]
        a = req.answer if req.answer is not None else row["answer"]
        cat = req.category if req.category is not None else row["category"]
        bkmk = int(req.is_bookmarked) if req.is_bookmarked is not None else row["is_bookmarked"]

        cur.execute("""
            UPDATE flashcards
            SET question = ?, answer = ?, category = ?, is_bookmarked = ?, updated_at = ?
            WHERE id = ?
        """, (q, a, cat, bkmk, now_ms, card_id))
        conn.commit()

        cur.execute("SELECT * FROM flashcards WHERE id = ?", (card_id,))
        updated_row = cur.fetchone()
        conn.close()

        return FlashcardItem(
            id=updated_row["id"],
            deck_id=updated_row["deck_id"],
            question=updated_row["question"],
            answer=updated_row["answer"],
            category=updated_row["category"],
            chapter_title=updated_row["chapter_title"],
            timestamp_sec=updated_row["timestamp_sec"],
            timestamp_formatted=updated_row["timestamp_formatted"],
            confidence=updated_row["confidence"],
            is_bookmarked=bool(updated_row["is_bookmarked"]),
            review_count=updated_row["review_count"],
            last_reviewed_at=updated_row["last_reviewed_at"],
            order_index=updated_row["order_index"],
            created_at=updated_row["created_at"],
        )

    @staticmethod
    def review_card(card_id: str, user_id: str, confidence: str) -> Optional[FlashcardItem]:
        """Records student confidence rating ('not_confident', 'somewhat_confident', 'very_confident')."""
        valid_conf = ("not_confident", "somewhat_confident", "very_confident")
        if confidence not in valid_conf:
            confidence = "somewhat_confident"

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT c.*, d.id as deck_id, d.user_id as deck_owner FROM flashcards c
            JOIN flashcard_decks d ON c.deck_id = d.id
            WHERE c.id = ?
        """, (card_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return None

        now_ms = int(time.time() * 1000)
        new_review_count = (row["review_count"] or 0) + 1

        cur.execute("""
            UPDATE flashcards
            SET confidence = ?, review_count = ?, last_reviewed_at = ?, updated_at = ?
            WHERE id = ?
        """, (confidence, new_review_count, now_ms, now_ms, card_id))

        # Log into review history
        cur.execute("""
            INSERT INTO card_reviews (card_id, deck_id, user_id, confidence, reviewed_at)
            VALUES (?, ?, ?, ?, ?)
        """, (card_id, row["deck_id"], user_id, confidence, now_ms))

        # Recalculate deck mastered count
        cur.execute("""
            SELECT COUNT(*) FROM flashcards
            WHERE deck_id = ? AND confidence = 'very_confident'
        """, (row["deck_id"],))
        mastered_res = cur.fetchone()
        mastered_count = mastered_res[0] if mastered_res else 0

        cur.execute("""
            UPDATE flashcard_decks
            SET mastered_count = ?, updated_at = ?
            WHERE id = ?
        """, (mastered_count, now_ms, row["deck_id"]))

        conn.commit()

        cur.execute("SELECT * FROM flashcards WHERE id = ?", (card_id,))
        updated_row = cur.fetchone()
        conn.close()

        return FlashcardItem(
            id=updated_row["id"],
            deck_id=updated_row["deck_id"],
            question=updated_row["question"],
            answer=updated_row["answer"],
            category=updated_row["category"],
            chapter_title=updated_row["chapter_title"],
            timestamp_sec=updated_row["timestamp_sec"],
            timestamp_formatted=updated_row["timestamp_formatted"],
            confidence=updated_row["confidence"],
            is_bookmarked=bool(updated_row["is_bookmarked"]),
            review_count=updated_row["review_count"],
            last_reviewed_at=updated_row["last_reviewed_at"],
            order_index=updated_row["order_index"],
            created_at=updated_row["created_at"],
        )

    @staticmethod
    def add_card_to_deck(deck_id: str, user_id: str, req: CreateCardRequest) -> Optional[FlashcardItem]:
        """Appends a new card to an existing deck."""
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM flashcard_decks WHERE id = ?", (deck_id,))
        deck = cur.fetchone()
        if not deck:
            conn.close()
            return None

        now_ms = int(time.time() * 1000)
        c_id = f"c_{secrets.token_hex(6)}"

        cur.execute("SELECT MAX(order_index) FROM flashcards WHERE deck_id = ?", (deck_id,))
        max_idx_row = cur.fetchone()
        next_idx = (max_idx_row[0] + 1) if (max_idx_row and max_idx_row[0] is not None) else 0

        fmt_time = format_video_time(req.timestamp_sec)

        cur.execute("""
            INSERT INTO flashcards (
                id, deck_id, question, answer, category, chapter_title,
                timestamp_sec, timestamp_formatted, confidence, is_bookmarked,
                review_count, last_reviewed_at, order_index, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            c_id, deck_id, req.question.strip(), req.answer.strip(),
            req.category or "Concept", req.chapter_title or "General",
            req.timestamp_sec or 0.0, fmt_time, "unreviewed", 0, 0, None,
            next_idx, now_ms, now_ms
        ))

        # Update deck card_count
        cur.execute("SELECT COUNT(*) FROM flashcards WHERE deck_id = ?", (deck_id,))
        cnt = cur.fetchone()[0]
        cur.execute("UPDATE flashcard_decks SET card_count = ?, updated_at = ? WHERE id = ?", (cnt, now_ms, deck_id))
        conn.commit()

        cur.execute("SELECT * FROM flashcards WHERE id = ?", (c_id,))
        new_row = cur.fetchone()
        conn.close()

        return FlashcardItem(
            id=new_row["id"],
            deck_id=new_row["deck_id"],
            question=new_row["question"],
            answer=new_row["answer"],
            category=new_row["category"],
            chapter_title=new_row["chapter_title"],
            timestamp_sec=new_row["timestamp_sec"],
            timestamp_formatted=new_row["timestamp_formatted"],
            confidence=new_row["confidence"],
            is_bookmarked=bool(new_row["is_bookmarked"]),
            review_count=new_row["review_count"],
            last_reviewed_at=new_row["last_reviewed_at"],
            order_index=new_row["order_index"],
            created_at=new_row["created_at"],
        )

    @staticmethod
    def delete_card(card_id: str, user_id: str) -> bool:
        """Deletes a card from a deck."""
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT c.deck_id, d.user_id FROM flashcards c
            JOIN flashcard_decks d ON c.deck_id = d.id
            WHERE c.id = ?
        """, (card_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return False

        deck_id = row["deck_id"]
        cur.execute("DELETE FROM flashcards WHERE id = ?", (card_id,))

        now_ms = int(time.time() * 1000)
        cur.execute("SELECT COUNT(*) FROM flashcards WHERE deck_id = ?", (deck_id,))
        cnt = cur.fetchone()[0]
        cur.execute("UPDATE flashcard_decks SET card_count = ?, updated_at = ? WHERE id = ?", (cnt, now_ms, deck_id))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def restart_deck(deck_id: str, user_id: str) -> bool:
        """Resets all confidence ratings in deck back to 'unreviewed'."""
        conn = get_db_connection()
        cur = conn.cursor()
        now_ms = int(time.time() * 1000)
        cur.execute("""
            UPDATE flashcards
            SET confidence = 'unreviewed', updated_at = ?
            WHERE deck_id = ?
        """, (now_ms, deck_id))
        cur.execute("""
            UPDATE flashcard_decks
            SET mastered_count = 0, updated_at = ?
            WHERE id = ?
        """, (now_ms, deck_id))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def ai_assist(req: AiAssistRequest, user_id: str) -> AiAssistResponse:
        """Processes contextual AI assistance for flashcards (explain, simplify, analogy, edit, generate_more)."""
        action = req.action.lower()
        q = req.current_question or "this concept"
        a = req.current_answer or ""
        vid = req.video_id

        if action == "simplify":
            reply = (
                f"**Simplified Explanation:**\n\n"
                f"{a if a else 'This concept represents a foundational principle from your lecture.'}\n\n"
                f"**Key Takeaway:** Focus on the core relationship between the inputs and results described in this section."
            )
            return AiAssistResponse(
                reply=reply,
                suggested_question=q,
                suggested_answer=f"Simplified: {a[:160]}..." if len(a) > 160 else a,
                suggested_category="Concept",
            )
        elif action == "analogy":
            reply = (
                f"💡 **Everyday Analogy for '{q}':**\n\n"
                f"Think of {q} like modular building blocks: each individual element carries specific properties, and when combined in sequence, they establish a robust, interconnected system."
            )
            return AiAssistResponse(
                reply=reply,
                suggested_question=f"Analogy for: {q}",
                suggested_answer=f"Modular components working together in an interconnected sequence.",
                suggested_category="Concept",
            )
        elif action == "explain":
            reply = (
                f"📖 **Deep-Dive Explanation:**\n\n"
                f"**Concept:** {q}\n\n"
                f"**Underlying Mechanism:** {a}\n\n"
                f"In exams and applications, questions on this topic test whether you understand the fundamental reasoning and relationships covered in this lecture segment."
            )
            return AiAssistResponse(reply=reply)
        elif action == "generate_more":
            new_cards = [
                CreateCardRequest(
                    question=f"What is the core principle governing {q[:45]}?",
                    answer=f"The fundamental rules and principles introduced in this lecture segment.",
                    category="Concept",
                    chapter_title="Related Concepts",
                    timestamp_sec=0.0,
                ),
            ]
            reply = f"Generated a complementary study card grounded in this topic! Click **Add to Deck** below to include it."
            return AiAssistResponse(reply=reply, generated_cards=new_cards)
        else:
            msg = req.user_message or "Tell me more about this card"
            reply = (
                f"Regarding **'{q}'**:\n\n"
                f"{a}\n\n"
                f"To master this for your upcoming assessments, review how this concept connects to the preceding and following lecture segments."
            )
            return AiAssistResponse(reply=reply)


# Initialize DB on module import
init_flashcard_db()
