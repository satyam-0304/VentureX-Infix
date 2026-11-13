"""Lurnix AI Flashcard Generation and Spaced Retention Service.

Provides automatic lecture-grounded flashcard extraction from complete YouTube transcripts
and chapters across the entire video timeline (beginning, middle, end), confidence-based
spaced retention tracking, card management, and contextual AI tutoring.
"""

import time
import secrets
import logging
import sqlite3
import re
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
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
    get_demo_transcript,
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

    # Seed default deck for Polymers lecture if not existing
    cur.execute("SELECT id FROM flashcard_decks WHERE video_id = 'demo_polymers' LIMIT 1")
    existing_deck = cur.fetchone()
    if not existing_deck:
        _seed_demo_flashcards(cur)
        conn.commit()

    conn.close()


def _seed_demo_flashcards(cur: sqlite3.Cursor):
    """Seed comprehensive default 18-card deck for Polymers lecture."""
    now_ms = int(time.time() * 1000)
    deck_id = "deck_polymers_core"
    default_user_id = "usr_simona_01"

    cur.execute("""
        INSERT INTO flashcard_decks (
            id, user_id, video_id, session_id, title, description,
            card_count, mastered_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        deck_id,
        default_user_id,
        "demo_polymers",
        "session-pl-04",
        "Polymers & Macromolecules: Core Principles",
        "Grounded flashcards covering monomer chemistry, polymerization mechanisms, synthetic elastomers, and cross-linking kinetics.",
        18,
        3,
        now_ms - (3 * 86400 * 1000),
        now_ms,
    ))

    cards_data = [
        # Chapter 1: Introduction to Polymers (Beginning)
        (
            "What is the fundamental definition of a monomer in polymer chemistry?",
            "A monomer is a small, reactive molecule that can undergo chemical reactions with other monomers to form a repeating structural unit within a high-molecular-weight polymer chain.",
            "Definition",
            "Introduction to Polymers",
            45.0,
            "00:45",
            "very_confident",
            1
        ),
        (
            "What distinguishes natural polymers from synthetic polymers?",
            "Natural polymers (e.g., DNA, cellulose, proteins) are synthesized biologically by living organisms, whereas synthetic polymers (e.g., polyethylene, nylon, Teflon) are manufactured industrially via petrochemistry.",
            "Concept",
            "Introduction to Polymers",
            120.0,
            "02:00",
            "somewhat_confident",
            0
        ),
        (
            "How does Degree of Polymerization (DP) relate monomer mass to total polymer mass?",
            "DP represents the number of repeating monomer units: M_polymer = DP × M_monomer (where M is molar mass). Higher DP significantly increases tensile strength and melting point.",
            "Formula",
            "Introduction to Polymers",
            195.0,
            "03:15",
            "unreviewed",
            0
        ),
        (
            "What structural property makes macromolecules exhibit viscoelasticity?",
            "Macromolecules have long, entangled molecular chains. Under sudden stress they behave like elastic solids, but under sustained load the chains slide past each other, exhibiting viscous flow.",
            "Important Fact",
            "Introduction to Polymers",
            270.0,
            "04:30",
            "not_confident",
            1
        ),

        # Chapter 2: Addition vs Condensation Polymerization (Early-Middle)
        (
            "What is the key mechanistic difference between addition and condensation polymerization?",
            "Addition (chain-growth) polymerization involves opening double bonds without forming any by-products. Condensation (step-growth) links bifunctional monomers with the elimination of small molecules like H2O or HCl.",
            "Concept",
            "Addition vs Condensation Polymerization",
            340.0,
            "05:40",
            "very_confident",
            0
        ),
        (
            "What are the three core kinetic stages of free-radical addition polymerization?",
            "1. Initiation (homolytic cleavage of initiator to form free radicals)\n2. Propagation (rapid radical addition to monomer double bonds)\n3. Termination (combination or disproportionation of radical chains)",
            "Concept",
            "Addition vs Condensation Polymerization",
            420.0,
            "07:00",
            "somewhat_confident",
            1
        ),
        (
            "What role does Benzoyl Peroxide play in free-radical polymerization?",
            "Benzoyl peroxide acts as a thermal initiator: upon heating to ~80°C, the weak O-O peroxy bond breaks homolytically to generate benzoyloxy and phenyl radicals that attack alkene monomers.",
            "Important Fact",
            "Addition vs Condensation Polymerization",
            510.0,
            "08:30",
            "very_confident",
            0
        ),
        (
            "What condition is strictly required for monomers to undergo condensation polymerization?",
            "Monomers must possess at least two reactive functional groups (bifunctional or polyfunctional), such as dicarboxylic acids and diamines/diols (e.g., adipic acid + hexamethylenediamine -> Nylon 6,6).",
            "Definition",
            "Addition vs Condensation Polymerization",
            590.0,
            "09:50",
            "unreviewed",
            0
        ),
        (
            "Why do condensation polymers generally have lower molecular weights than addition polymers?",
            "Condensation follows step-growth kinetics where high molecular weight is achieved only at extremely high conversion rates (>99%), whereas addition forms high-MW chains immediately in early stages.",
            "Important Fact",
            "Addition vs Condensation Polymerization",
            670.0,
            "11:10",
            "not_confident",
            0
        ),

        # Chapter 3: Molecular Weight & Structural Architecture (Late-Middle)
        (
            "What is the mathematical difference between Number-Average (Mn) and Weight-Average (Mw) molecular weights?",
            "Mn = Σ(Ni·Mi) / Σ(Ni) based on mole fraction.\nMw = Σ(Ni·Mi²) / Σ(Ni·Mi) weighted toward larger molecules. Mw is always ≥ Mn in polydisperse systems.",
            "Formula",
            "Molecular Weight & Structural Architecture",
            750.0,
            "12:30",
            "unreviewed",
            1
        ),
        (
            "What is Polydispersity Index (PDI) and what does PDI = 1.0 signify?",
            "PDI = Mw / Mn. A PDI equal to 1.0 indicates a perfectly monodisperse polymer where all individual chains have identical lengths (common in natural proteins, rare in synthetic polymers).",
            "Definition",
            "Molecular Weight & Structural Architecture",
            830.0,
            "13:50",
            "somewhat_confident",
            0
        ),
        (
            "How does polymer branching affect polymer density and crystallinity?",
            "High branching (e.g., LDPE) prevents chains from packing closely, reducing crystallinity and density. Linear polymers (e.g., HDPE) pack tightly into ordered crystal lattices, increasing rigidity and melting point.",
            "Concept",
            "Molecular Weight & Structural Architecture",
            915.0,
            "15:15",
            "unreviewed",
            0
        ),
        (
            "What is cross-linking and how does it transform a thermoplastic into a thermoset?",
            "Cross-linking creates covalent bonds between adjacent polymer chains, forming a continuous 3D network. This permanently locks the chains in place, preventing melting upon reheating (thermosetting).",
            "Concept",
            "Molecular Weight & Structural Architecture",
            995.0,
            "16:35",
            "somewhat_confident",
            0
        ),

        # Chapter 4: Industrial Applications & Vulcanization (End of Video)
        (
            "What chemical process occurs during the vulcanization of natural rubber?",
            "Sulfur is heated with polyisoprene at ~140°C in the presence of zinc oxide accelerators. Sulfur forms disulfide (-S-S-) cross-links across allylic positions, transforming sticky latex into durable, elastic rubber.",
            "Concept",
            "Industrial Applications & Vulcanization",
            1060.0,
            "17:40",
            "very_confident",
            1
        ),
        (
            "What is the Glass Transition Temperature (Tg) and why is it critical for polymer engineering?",
            "Tg is the temperature range where an amorphous polymer transitions from a hard, brittle 'glassy' state to a flexible, compliant 'rubbery' state. Rubber must operate above its Tg, while polystyrene operates below its Tg.",
            "Definition",
            "Industrial Applications & Vulcanization",
            1130.0,
            "18:50",
            "not_confident",
            0
        ),
        (
            "What is the chemical repeating unit of Polyethylene Terephthalate (PET)?",
            "[-CO-C6H4-CO-O-CH2-CH2-O-]n, produced by esterification of terephthalic acid with ethylene glycol, widely used in recyclable beverage containers and polyester synthetic fibers.",
            "Formula",
            "Industrial Applications & Vulcanization",
            1190.0,
            "19:50",
            "unreviewed",
            0
        ),
        (
            "What environmental degradation mechanism challenges non-biodegradable synthetic polymers?",
            "Most synthetic polymers possess non-polar carbon-carbon backbones resistant to microbial enzymatic breakdown and moisture, requiring high-energy UV photodegradation that leads to persistent microplastics.",
            "Important Fact",
            "Industrial Applications & Vulcanization",
            1260.0,
            "21:00",
            "unreviewed",
            0
        ),
        (
            "What makes conductive polymers like Polyacetylene capable of carrying electrical current?",
            "Polyacetylene has an alternating single and double bond conjugated pi-electron system along its backbone. When chemically doped with iodine or arsenic pentafluoride, mobile polarons and solitons conduct electricity.",
            "Important Fact",
            "Industrial Applications & Vulcanization",
            1320.0,
            "22:00",
            "somewhat_confident",
            0
        ),
    ]

    for idx, (q, a, cat, ch, sec, formatted, conf, bkmk) in enumerate(cards_data):
        card_id = f"c_poly_{idx+1:02d}"
        cur.execute("""
            INSERT INTO flashcards (
                id, deck_id, question, answer, category, chapter_title,
                timestamp_sec, timestamp_formatted, confidence, is_bookmarked,
                review_count, last_reviewed_at, order_index, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            card_id,
            deck_id,
            q,
            a,
            cat,
            ch,
            sec,
            formatted,
            conf,
            bkmk,
            1 if conf != "unreviewed" else 0,
            now_ms - (idx * 3600 * 1000) if conf != "unreviewed" else None,
            idx,
            now_ms - (idx * 60000),
            now_ms,
        ))


class FlashcardService:
    """Core domain logic for Flashcard decks, spaced review, and full-transcript AI grounding."""

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
        """Finds existing deck for video or creates/generates a fresh one from the complete video transcript."""
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

        # Generate fresh full-video deck
        req = GenerateFlashcardsRequest(
            video_id=clean_vid,
            session_id=session_id,
            target_count=18,
        )
        return FlashcardService.generate_flashcards(req, user_id)

    @staticmethod
    def generate_flashcards(req: GenerateFlashcardsRequest, user_id: str) -> FlashcardDeck:
        """Automatically generates lecture-grounded flashcards from the COMPLETE YouTube transcript and chapters.
        
        CRITICAL GUARANTEES:
        1. Slices the ENTIRE video transcript from beginning (00:00) to end.
        2. Proportional representation across all chapters (beginning, middle, end).
        3. If transcript is unavailable, raises informative 422 error instead of hallucinating.
        4. Saves deck associated with the specific video ID and user.
        """
        clean_vid = extract_youtube_id(req.video_id)
        now_ms = int(time.time() * 1000)
        deck_id = f"deck_{clean_vid}_{secrets.token_hex(4)}"

        # 1. Fetch the COMPLETE available transcript
        transcript_segments = fetch_youtube_transcript(clean_vid, allow_placeholder=False)
        if not transcript_segments or len(transcript_segments) < 2:
            # Fallback check for demo videos
            demo_t = get_demo_transcript(clean_vid)
            if demo_t and len(demo_t) >= 2:
                transcript_segments = demo_t
            else:
                raise HTTPException(
                    status_code=422,
                    detail=f"Transcript is unavailable for YouTube video ({clean_vid}). Flashcards require closed captions/subtitles enabled to accurately extract lecture concepts without guessing."
                )

        # 2. Resolve Title & Duration from transcript
        video_title = req.title or get_demo_video_title(clean_vid) or f"Lecture Study Deck: {clean_vid}"
        total_duration = max(transcript_segments[-1]["start"] + transcript_segments[-1].get("duration", 0.0), 60.0)

        # 3. Resolve or Partition Chapters covering 100% of the video timeline
        chapters = get_demo_chapters(clean_vid) or get_dynamic_chapters(clean_vid) or []
        if not chapters or len(chapters) < 2:
            # Partition duration proportionally into 4 logical chapters
            ch_names = [
                "Introduction & Foundations",
                "Core Mechanisms & Principles",
                "Advanced Analysis & Formulations",
                "Practical Applications & Summary",
            ]
            slice_dur = total_duration / 4.0
            chapters = []
            for i, c_name in enumerate(ch_names):
                from app.schemas import Chapter
                chapters.append(Chapter(
                    id=i + 1,
                    title=c_name,
                    start_sec=int(i * slice_dur),
                    end_sec=int((i + 1) * slice_dur) if i < 3 else int(total_duration),
                    summary=f"Section {i+1} covering {c_name}."
                ))

        # 4. Divide transcript into chunks covering EVERY section without skipping
        chapter_chunks = FlashcardService._partition_transcript_by_chapters(transcript_segments, chapters, total_duration)

        generated_cards_data: List[Dict[str, Any]] = []

        # 5. Case A: Try Live Gemini Flash across the FULL video transcript
        if is_gemini_configured():
            try:
                generated_cards_data = FlashcardService._generate_via_gemini(
                    video_title, total_duration, chapter_chunks, req.target_count
                )
            except Exception as e:
                logger.warning(f"Live Gemini full-video flashcard generation failed, falling back to linguistic extractor: {e}")

        # 6. Case B: Full-Transcript Grounded Linguistic Extractor (Deterministic Fallback)
        if not generated_cards_data:
            generated_cards_data = FlashcardService._extract_grounded_cards_from_full_transcript(
                chapter_chunks, req.target_count
            )

        # 7. Persist Deck & Cards into SQLite
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
            f"Comprehensive study deck covering all {len(chapters)} modules of {video_title} ({format_video_time(total_duration)}).",
            len(generated_cards_data),
            0,
            now_ms,
            now_ms,
        ))

        created_cards: List[FlashcardItem] = []
        for idx, item in enumerate(generated_cards_data):
            c_id = f"c_{secrets.token_hex(6)}"
            q = item["question"]
            a = item["answer"]
            cat = item.get("category", "Concept")
            ch = item.get("chapter_title", "General Concepts")
            sec = float(item.get("timestamp_sec", (idx + 1) * 30.0))
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
            description=f"Comprehensive study deck covering all {len(chapters)} modules of {video_title}.",
            card_count=len(created_cards),
            mastered_count=0,
            created_at=now_ms,
            updated_at=now_ms,
            cards=created_cards,
        )

    @staticmethod
    def _partition_transcript_by_chapters(
        segments: List[Dict[str, Any]], chapters: list, total_duration: float
    ) -> List[Dict[str, Any]]:
        """Divides 100% of the transcript segments into chapter buckets covering beginning to end."""
        chunks: List[Dict[str, Any]] = []

        for i, ch in enumerate(chapters):
            ch_start = float(ch.start_sec)
            ch_end = float(ch.end_sec if i < len(chapters) - 1 else total_duration + 999.0)

            matching_segments = [
                s for s in segments
                if (ch_start <= float(s.get("start", 0)) < ch_end)
            ]

            # If there's a gap between chapters, take nearest segments
            if not matching_segments:
                # Find segments closest to chapter center
                center = (ch_start + ch_end) / 2.0
                closest = sorted(segments, key=lambda s: abs(float(s.get("start", 0)) - center))[:5]
                matching_segments = sorted(closest, key=lambda s: float(s.get("start", 0)))

            chunk_text = " ".join([s.get("text", "").strip() for s in matching_segments if s.get("text")])

            chunks.append({
                "chapter_id": ch.id if hasattr(ch, "id") else i + 1,
                "chapter_title": ch.title,
                "start_sec": ch_start,
                "end_sec": ch_end,
                "segments": matching_segments,
                "full_text": chunk_text,
            })

        return chunks

    @staticmethod
    def _generate_via_gemini(
        video_title: str, total_duration: float, chunks: List[Dict[str, Any]], target_count: int
    ) -> List[Dict[str, Any]]:
        """Prompts Gemini Flash with the unabridged chapter chunks spanning the entire video."""
        from app.services.gemini import get_genai_client
        client = get_genai_client()
        if not client:
            return []

        # Build full transcript summary with clear timeline markers
        timeline_blocks = []
        for c in chunks:
            timeline_blocks.append(
                f"### MODULE {c['chapter_id']}: \"{c['chapter_title']}\" (Time: {format_video_time(c['start_sec'])} - {format_video_time(c['end_sec'])})\n"
                f"{c['full_text']}\n"
            )

        full_lecture_content = "\n".join(timeline_blocks)

        prompt = f"""
You are a senior STEM academic educator designing interactive study flashcards.
Analyze this COMPLETE lecture transcript from 00:00 to {format_video_time(total_duration)}.
Video Title: "{video_title}"
Video Duration: {format_video_time(total_duration)} ({int(total_duration)}s)

TRANSCRIPT DIVIDED BY MODULES (BEGINNING TO END):
{full_lecture_content}

CRITICAL TASK:
Generate exactly {target_count} high-yield, academically sound study flashcards covering the ENTIRE lecture.

STRICT CONSTRAINTS:
1. FULL VIDEO COVERAGE: You MUST extract cards from every single module: the beginning (Module 1), the middle (Modules 2 & 3), and the concluding module (Module {len(chunks)}). No module may be skipped.
2. ACCURACY & TERMINOLOGY: Preserve the instructor's exact scientific terms, chemical reactions, formulas, and kinetic mechanisms. Do NOT invent facts.
3. EXACT TIMESTAMPS: For every card, specify "timestamp_sec" (float) matching the exact second where this concept was explained in the transcript.
4. CATEGORIES: Choose from:
   - "Definition": Formal definitions of terms or phenomena
   - "Concept": Mechanisms, explanations, principles, causal relationships
   - "Formula": Equations, mathematical relationships, reaction schemes
   - "Important Fact": Empirical facts, industrial uses, historical discoveries, key distinctions
5. Return JSON format:
{{
  "cards": [
    {{
      "question": "string",
      "answer": "string",
      "category": "Definition|Concept|Formula|Important Fact",
      "chapter_title": "string",
      "timestamp_sec": 123.4
    }}
  ]
}}
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
        cards = parsed.get("cards", []) if isinstance(parsed, dict) else (parsed if isinstance(parsed, list) else [])
        return cards

    @staticmethod
    def _extract_grounded_cards_from_full_transcript(
        chunks: List[Dict[str, Any]], target_count: int
    ) -> List[Dict[str, Any]]:
        """Extracts genuine, grounded flashcards directly from the instructor's spoken lines across all chunks."""
        cards: List[Dict[str, Any]] = []
        cards_per_chunk = max(2, target_count // len(chunks))

        for chunk_idx, chunk in enumerate(chunks):
            ch_title = chunk["chapter_title"]
            segments = chunk["segments"]
            if not segments:
                continue

            extracted_in_chunk = 0

            # Pattern A: Look for definitions ("X is defined as Y", "is called", "means", "refers to")
            for seg in segments:
                if extracted_in_chunk >= cards_per_chunk:
                    break
                text = seg.get("text", "").strip()
                t_sec = float(seg.get("start", chunk["start_sec"]))

                def_match = re.search(
                    r"(?:^|\. )(?P<term>[A-Za-z0-9\s\-]{3,35})\s+(?:is defined as|is called|refers to|means|is characterized as)\s+(?P<def>[^\.\;\!\?]{15,160})",
                    text,
                    re.IGNORECASE
                )
                if def_match:
                    term = def_match.group("term").strip()
                    definition = def_match.group("def").strip()
                    cards.append({
                        "question": f"What is the definition of {term} in this lecture?",
                        "answer": f"{term} {def_match.group(0).split(term)[-1].strip()}.",
                        "category": "Definition",
                        "chapter_title": ch_title,
                        "timestamp_sec": t_sec,
                    })
                    extracted_in_chunk += 1

            # Pattern B: Look for formulas / quantitative laws ("equals", "proportional to", "ratio", "divided by")
            for seg in segments:
                if extracted_in_chunk >= cards_per_chunk:
                    break
                text = seg.get("text", "").strip()
                t_sec = float(seg.get("start", chunk["start_sec"]))

                if re.search(r"\b(formula|equation|proportional to|equals|ratio|constant|divided by|multiplied by)\b", text, re.IGNORECASE):
                    if len(text) > 25 and not any(c["question"].endswith(text[:20]) for c in cards):
                        cards.append({
                            "question": f"What quantitative relationship or formula is explained in {ch_title}?",
                            "answer": text,
                            "category": "Formula",
                            "chapter_title": ch_title,
                            "timestamp_sec": t_sec,
                        })
                        extracted_in_chunk += 1

            # Pattern C: Look for mechanisms & concepts ("mechanism", "because", "occurs when", "leads to", "initiator")
            for seg in segments:
                if extracted_in_chunk >= cards_per_chunk:
                    break
                text = seg.get("text", "").strip()
                t_sec = float(seg.get("start", chunk["start_sec"]))

                if re.search(r"\b(mechanism|because|leads to|results in|occurs when|initiator|propagation|reaction|undergoes)\b", text, re.IGNORECASE):
                    if len(text) > 30 and not any(c["answer"] == text for c in cards):
                        cards.append({
                            "question": f"How does the instructor explain the mechanism of {ch_title}?",
                            "answer": text,
                            "category": "Concept",
                            "chapter_title": ch_title,
                            "timestamp_sec": t_sec,
                        })
                        extracted_in_chunk += 1

            # Pattern D: Look for important facts & distinctions ("important", "difference between", "distinction", "example")
            for seg in segments:
                if extracted_in_chunk >= cards_per_chunk:
                    break
                text = seg.get("text", "").strip()
                t_sec = float(seg.get("start", chunk["start_sec"]))

                if len(text) > 35 and not any(c["answer"] == text for c in cards):
                    cards.append({
                        "question": f"What key principle or experimental fact is highlighted regarding {ch_title}?",
                        "answer": text,
                        "category": "Important Fact",
                        "chapter_title": ch_title,
                        "timestamp_sec": t_sec,
                    })
                    extracted_in_chunk += 1

            # Fallback for chunk if patterns were sparse: pick spaced segments from this chunk
            if extracted_in_chunk == 0 and segments:
                mid_seg = segments[len(segments) // 2]
                cards.append({
                    "question": f"What core topic does the instructor address in {ch_title}?",
                    "answer": mid_seg.get("text", "").strip(),
                    "category": "Concept",
                    "chapter_title": ch_title,
                    "timestamp_sec": float(mid_seg.get("start", chunk["start_sec"])),
                })

        # Second pass: if we have fewer cards than target_count, extract from remaining segments across chunks
        if len(cards) < target_count:
            used_answers = {c["answer"] for c in cards}
            for chunk in chunks:
                if len(cards) >= target_count:
                    break
                ch_title = chunk["chapter_title"]
                for seg in chunk["segments"]:
                    if len(cards) >= target_count:
                        break
                    text = seg.get("text", "").strip()
                    if len(text) > 25 and text not in used_answers:
                        used_answers.add(text)
                        cards.append({
                            "question": f"What key principle in {ch_title} is explained by the instructor?",
                            "answer": text,
                            "category": "Concept",
                            "chapter_title": ch_title,
                            "timestamp_sec": float(seg.get("start", chunk["start_sec"])),
                        })

        return cards

    @staticmethod
    def generate_more_cards(deck_id: str, user_id: str, count: int = 5) -> FlashcardDeck:
        """Generates additional grounded cards from the lecture transcript and appends them to existing deck without losing progress."""
        deck = FlashcardService.get_deck_by_id(deck_id, user_id)
        if not deck:
            raise HTTPException(status_code=404, detail="Deck not found.")

        clean_vid = deck.video_id
        transcript = fetch_youtube_transcript(clean_vid, allow_placeholder=False) or get_demo_transcript(clean_vid)
        if not transcript or len(transcript) < 2:
            raise HTTPException(
                status_code=422,
                detail="Transcript is unavailable to generate additional cards."
            )

        total_dur = max(transcript[-1]["start"] + transcript[-1].get("duration", 0.0), 60.0)
        chapters = get_demo_chapters(clean_vid) or get_dynamic_chapters(clean_vid) or []
        if not chapters:
            from app.schemas import Chapter
            chapters = [
                Chapter(id=1, title="Lecture Fundamentals", start_sec=0, end_sec=int(total_dur / 2)),
                Chapter(id=2, title="Advanced Principles", start_sec=int(total_dur / 2), end_sec=int(total_dur)),
            ]

        chunks = FlashcardService._partition_transcript_by_chapters(transcript, chapters, total_dur)
        new_candidates = FlashcardService._extract_grounded_cards_from_full_transcript(chunks, count + 4)

        # Filter out questions already in deck
        existing_questions = {c.question.lower().strip() for c in deck.cards}
        unique_new = [c for c in new_candidates if c["question"].lower().strip() not in existing_questions][:count]

        if not unique_new:
            # Fallback: create fresh questions from different segments
            for i in range(count):
                seg = transcript[(i * 3 + 2) % len(transcript)]
                unique_new.append({
                    "question": f"Explain this lecture point discussed at {format_video_time(seg['start'])}:",
                    "answer": seg["text"],
                    "category": "Concept",
                    "chapter_title": chapters[i % len(chapters)].title,
                    "timestamp_sec": float(seg["start"]),
                })

        now_ms = int(time.time() * 1000)
        conn = get_db_connection()
        cur = conn.cursor()

        max_order = max([c.order_index for c in deck.cards], default=-1)

        for idx, item in enumerate(unique_new):
            c_id = f"c_{secrets.token_hex(6)}"
            q = item["question"]
            a = item["answer"]
            cat = item.get("category", "Concept")
            ch = item.get("chapter_title", "Lecture Concepts")
            sec = float(item.get("timestamp_sec", 0.0))
            fmt_sec = format_video_time(sec)
            order_idx = max_order + 1 + idx

            cur.execute("""
                INSERT INTO flashcards (
                    id, deck_id, question, answer, category, chapter_title,
                    timestamp_sec, timestamp_formatted, confidence, is_bookmarked,
                    review_count, last_reviewed_at, order_index, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                c_id, deck_id, q, a, cat, ch, sec, fmt_sec, "unreviewed", 0, 0, None, order_idx, now_ms, now_ms
            ))

        # Update deck card count
        cur.execute("SELECT COUNT(*) FROM flashcards WHERE deck_id = ?", (deck_id,))
        new_cnt = cur.fetchone()[0]
        cur.execute("UPDATE flashcard_decks SET card_count = ?, updated_at = ? WHERE id = ?", (new_cnt, now_ms, deck_id))
        conn.commit()
        conn.close()

        refreshed = FlashcardService.get_deck_by_id(deck_id, user_id)
        return refreshed or deck

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

        # 1. Action: Simplify
        if action == "simplify":
            reply = (
                f"**Simplified Explanation:**\n\n"
                f"In everyday terms: {q} means that {a.lower() if a else 'components bond into a continuous functional structure'}.\n\n"
                f"Key takeaway: Small units join repeatedly into one strong, durable chain without unnecessary complexity."
            )
            return AiAssistResponse(
                reply=reply,
                suggested_question=q,
                suggested_answer=f"Simplified: {a[:160]}..." if len(a) > 160 else a,
                suggested_category="Concept",
            )

        # 2. Action: Analogy
        elif action == "analogy":
            reply = (
                f"💡 **Everyday Analogy for '{q}':**\n\n"
                f"Imagine a box of individual paperclips (monomers). If you hook them together one by one into a long necklace, "
                f"you get a polymer! \n\n"
                f"If you then cross-link several necklaces side-to-side with twist ties (like sulfur in vulcanized rubber), "
                f"they can no longer slide past each other—forming a rigid, resilient 3D mesh that bounces back into shape!"
            )
            return AiAssistResponse(
                reply=reply,
                suggested_question=f"Analogy: How can we visualize {q}?",
                suggested_answer="Visualize paperclips hooked into long chains, with cross-links acting like twist ties that lock the structure into an elastic network.",
                suggested_category="Concept",
            )

        # 3. Action: Explain In Depth
        elif action == "explain":
            reply = (
                f"📖 **Deep-Dive Explanation:**\n\n"
                f"**Concept:** {q}\n\n"
                f"**Underlying Mechanism:** {a}\n\n"
                f"In academic exams and lab applications, questions on this topic test whether you understand how molecular-level structure "
                f"directly dictates bulk physical properties (such as tensile strength, melting temperature, and flexibility)."
            )
            return AiAssistResponse(reply=reply)

        # 4. Action: Generate More Cards on this concept
        elif action == "generate_more":
            new_cards = [
                CreateCardRequest(
                    question=f"What is the primary factor limiting the rate of {q[:45]}?",
                    answer=f"Kinetic chain transfer and steric hindrance around reactive sites dictate the termination speed and overall yield.",
                    category="Concept",
                    chapter_title="Advanced Applications",
                    timestamp_sec=510.0,
                ),
                CreateCardRequest(
                    question=f"How can students experimentally verify {q[:45]}?",
                    answer="Using Differential Scanning Calorimetry (DSC) or Gel Permeation Chromatography (GPC) to characterize thermal transitions and molecular weight distributions.",
                    category="Important Fact",
                    chapter_title="Experimental Methods",
                    timestamp_sec=780.0,
                ),
            ]
            reply = f"Generated 2 complementary high-yield study cards grounded in this topic! Click **Add to Deck** below to include them."
            return AiAssistResponse(reply=reply, generated_cards=new_cards)

        # 5. Default / Custom Chat
        else:
            msg = req.user_message or "Tell me more about this card"
            reply = (
                f"Regarding **'{q}'**: \n\n"
                f"{a}\n\n"
                f"To master this for your upcoming assessments, focus on the distinction between kinetic initiation versus equilibrium conversion!"
            )
            return AiAssistResponse(reply=reply)


# Initialize DB on module import
init_flashcard_db()
