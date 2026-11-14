"""YouTube Transcript Extraction Service for Lurnix.

Handles multi-format URL parsing, local demo fixture shortcuts,
and multi-language YouTube caption scraping with auto-translation fallback.
"""

import re
import logging
from typing import Any
from youtube_transcript_api import YouTubeTranscriptApi


logger = logging.getLogger(__name__)


def extract_youtube_id(url_or_id: str) -> str:
    """Extract standard 11-character YouTube video ID from various URL patterns or bare ID.

    Examples:
        - https://www.youtube.com/watch?v=dQw4w9WgXcQ -> dQw4w9WgXcQ
        - https://youtu.be/dQw4w9WgXcQ -> dQw4w9WgXcQ
        - https://www.youtube.com/embed/dQw4w9WgXcQ -> dQw4w9WgXcQ
        - demo_polymers -> demo_polymers
    """
    clean_input = url_or_id.strip()

    # Direct match for standard demo slugs or raw 11-char IDs
    if re.match(r"^[a-zA-Z0-9_-]{11}$", clean_input) or clean_input.startswith("demo_"):
        return clean_input

    # Standard YouTube watch URL
    match_watch = re.search(r"[?&]v=([^&#]+)", clean_input)
    if match_watch:
        return match_watch.group(1)

    # youtu.be short link
    match_short = re.search(r"youtu\.be/([^?&#]+)", clean_input)
    if match_short:
        return match_short.group(1)

    # embed URL
    match_embed = re.search(r"youtube\.com/embed/([^?&#]+)", clean_input)
    if match_embed:
        return match_embed.group(1)

    # Fallback to the string itself
    return clean_input


def fetch_youtube_transcript(video_id: str) -> list[dict[str, Any]]:
    """Fetch real captions, using stored transcripts only for recognized demos.

    Empty list means captions could not be retrieved. Never fabricate a transcript.
    """
    from app.services.sample_data import DEMO_VIDEOS, get_demo_transcript

    # 1. Zero-latency demo fixture shortcut
    if video_id in DEMO_VIDEOS:
        return DEMO_VIDEOS[video_id]["transcript"]

    # 2. Live YouTube API extraction
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        # Try native English, Hindi, or Indian English transcripts
        preferred_languages = ["en", "en-US", "en-GB", "hi", "en-IN"]
        try:
            transcript = transcript_list.find_transcript(preferred_languages)
            entries = transcript.fetch()
            return [_normalize_entry(entry) for entry in entries]
        except Exception:
            pass

        # Fallback: Auto-translate whatever caption track is available to English
        try:
            for t in transcript_list:
                return [_normalize_entry(entry) for entry in t.translate("en").fetch()]
        except Exception:
            pass

    except Exception as e:
        logger.warning(f"Live transcript fetch failed for {video_id}: {e}")

    # 3. Demo fixture lookup
    demo_transcript = get_demo_transcript(video_id)
    if demo_transcript:
        return demo_transcript

    logger.warning("No transcript found for video %s", video_id)
    return []


def _normalize_entry(entry: Any) -> dict[str, Any]:
    """Normalize transcript library objects and legacy dictionaries."""
    if isinstance(entry, dict):
        return {
            "start": float(entry.get("start", 0)),
            "duration": float(entry.get("duration", 0)),
            "text": str(entry.get("text", "")),
        }
    return {
        "start": float(getattr(entry, "start", 0)),
        "duration": float(getattr(entry, "duration", 0)),
        "text": str(getattr(entry, "text", "")),
    }
