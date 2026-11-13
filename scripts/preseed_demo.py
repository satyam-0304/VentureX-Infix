"""Lurnix Pre-Seeding and Offline Fixture Engine.

This CLI script pre-generates, verifies, and packages multi-domain lecture fixtures
(transcripts, chapters, notes, concept-tagged quizzes, and revision cheat sheets)
into offline cached stores (JSON & SQLite) so the Lurnix platform has zero external
dependency or cloud latency during live presentations.
"""

import os
import sys
import json
import sqlite3
import argparse
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.services.sample_data import (
    DEMO_VIDEOS,
    DEMO_CHAPTERS,
    DEMO_NOTES,
    DEMO_QUIZZES,
    DEMO_REVISIONS,
    get_demo_transcript,
    get_demo_chapters,
    get_demo_notes,
    get_demo_quiz,
    get_demo_revision,
)


def export_fixtures_json(output_dir: Path) -> Path:
    """Exports all pre-seeded multi-domain fixtures into a unified JSON file."""
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / "tutor_fixtures.json"

    export_payload = {}
    for video_id, video_data in DEMO_VIDEOS.items():
        chapters = [c.model_dump() for c in get_demo_chapters(video_id)]
        notes = [n.model_dump() for n in get_demo_notes(video_id)]
        quiz = [q.model_dump() for q in get_demo_quiz(video_id)]
        revision = get_demo_revision(video_id)
        revision_dict = revision.model_dump() if revision else None

        export_payload[video_id] = {
            "metadata": {
                "id": video_id,
                "title": video_data.get("title", ""),
                "duration_sec": video_data.get("duration_sec", 0),
            },
            "transcript_count": len(video_data.get("transcript", [])),
            "transcript": video_data.get("transcript", []),
            "chapters": chapters,
            "notes": notes,
            "quiz": quiz,
            "revision": revision_dict,
        }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(export_payload, f, indent=2, ensure_ascii=False)

    return json_path


def export_fixtures_sqlite(output_dir: Path) -> Path:
    """Exports all fixtures into a standalone SQLite database cache/tutor_seed.db."""
    output_dir.mkdir(parents=True, exist_ok=True)
    db_path = output_dir / "tutor_seed.db"

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS videos (
            id TEXT PRIMARY KEY,
            title TEXT,
            duration_sec INTEGER,
            transcript_json TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS chapters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id TEXT,
            chapter_id INTEGER,
            title TEXT,
            start_sec INTEGER,
            end_sec INTEGER,
            summary TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id TEXT,
            chapter_id INTEGER,
            chapter_title TEXT,
            markdown_content TEXT,
            formulas_json TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS quiz_questions (
            id INTEGER PRIMARY KEY,
            video_id TEXT,
            concept_tag TEXT,
            question TEXT,
            options_json TEXT,
            correct_idx INTEGER,
            explanation TEXT,
            clip_start_sec INTEGER,
            clip_end_sec INTEGER
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS rapid_revisions (
            video_id TEXT PRIMARY KEY,
            executive_summary TEXT,
            high_yield_points_json TEXT,
            formulas_json TEXT
        )
    """)

    # Populate tables
    for video_id, video_data in DEMO_VIDEOS.items():
        cur.execute(
            "INSERT OR REPLACE INTO videos (id, title, duration_sec, transcript_json) VALUES (?, ?, ?, ?)",
            (
                video_id,
                video_data.get("title", ""),
                video_data.get("duration_sec", 0),
                json.dumps(video_data.get("transcript", [])),
            ),
        )

        for chapter in get_demo_chapters(video_id):
            cur.execute(
                """INSERT OR REPLACE INTO chapters 
                   (video_id, chapter_id, title, start_sec, end_sec, summary) 
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (video_id, chapter.id, chapter.title, chapter.start_sec, chapter.end_sec, chapter.summary),
            )

        for note in get_demo_notes(video_id):
            cur.execute(
                """INSERT OR REPLACE INTO notes 
                   (video_id, chapter_id, chapter_title, markdown_content, formulas_json) 
                   VALUES (?, ?, ?, ?, ?)""",
                (
                    video_id,
                    note.chapter_id,
                    note.chapter_title,
                    note.markdown_content,
                    json.dumps(note.formulas),
                ),
            )

        for q in get_demo_quiz(video_id):
            cur.execute(
                """INSERT OR REPLACE INTO quiz_questions 
                   (id, video_id, concept_tag, question, options_json, correct_idx, explanation, clip_start_sec, clip_end_sec) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    q.id,
                    video_id,
                    q.concept_tag,
                    q.question,
                    json.dumps(q.options),
                    q.correct_idx,
                    q.explanation,
                    q.clip_start_sec,
                    q.clip_end_sec,
                ),
            )

        rev = get_demo_revision(video_id)
        if rev:
            cur.execute(
                """INSERT OR REPLACE INTO rapid_revisions 
                   (video_id, executive_summary, high_yield_points_json, formulas_json) 
                   VALUES (?, ?, ?, ?)""",
                (
                    video_id,
                    rev.executive_summary,
                    json.dumps([p.model_dump() for p in rev.high_yield_points]),
                    json.dumps(rev.cheat_sheet_formulas),
                ),
            )

    conn.commit()
    conn.close()
    return db_path


def verify_fixtures() -> bool:
    """Verifies that all pre-seeded domain fixtures meet required standards."""
    print("==================================================")
    print("LURNIX MULTI-DOMAIN FIXTURE INTEGRITY AUDIT")
    print("==================================================")

    all_passed = True
    for video_id in DEMO_VIDEOS.keys():
        transcript = get_demo_transcript(video_id)
        chapters = get_demo_chapters(video_id)
        notes = get_demo_notes(video_id)
        quiz = get_demo_quiz(video_id)
        revision = get_demo_revision(video_id)

        print(f"\n[Domain: {video_id}]")
        print(f"  • Transcript cues:    {len(transcript)} timestamps")
        print(f"  • Chapters segmented: {len(chapters)} chapters")
        print(f"  • Notes generated:    {len(notes)} chapter notes")
        print(f"  • Quiz items:         {len(quiz)} concept-tagged questions")
        print(f"  • Rapid revision:     {'OK' if revision else 'MISSING'}")

        if not transcript or not chapters or not notes or not quiz:
            print(f"  FAILED: Missing critical fixture components in {video_id}")
            all_passed = False
        else:
            print(f"  STATUS: PASS (100% Pre-Seeded & Ready)")

    return all_passed


def main():
    parser = argparse.ArgumentParser(description="Lurnix Pre-Seeding Batch Utility")
    parser.add_argument("--verify", action="store_true", help="Audit existing fixtures")
    parser.add_argument("--export", action="store_true", help="Export fixtures to JSON and SQLite")
    parser.add_argument("--outdir", type=str, default="backend/app/cache", help="Output directory")

    args = parser.parse_args()
    outdir = Path(args.outdir)

    if args.verify or (not args.verify and not args.export):
        success = verify_fixtures()
        if not success:
            sys.exit(1)

    if args.export or (not args.verify and not args.export):
        json_file = export_fixtures_json(outdir)
        db_file = export_fixtures_sqlite(outdir)
        print("\n==================================================")
        print(f"Exported JSON Fixtures:   {json_file}")
        print(f"Exported SQLite Database: {db_file}")
        print("==================================================")


if __name__ == "__main__":
    main()
