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


def fetch_youtube_transcript(video_id: str, allow_placeholder: bool = False) -> list[dict[str, Any]]:
    """Retrieve complete transcript for a given video ID with multi-language and auto-translation fallback.
    
    Returns full transcript segments covering the entire video from start to finish.
    If no transcript is available and allow_placeholder is False, returns empty list so
    callers can properly notify the user instead of hallucinating.
    """
    from app.services.sample_data import DEMO_VIDEOS, get_demo_transcript
    from app.services.dynamic_cache import get_dynamic_video

    # 1. Zero-latency demo fixture shortcut (checks DEMO_VIDEOS, YOUTUBE_TO_DEMO_MAP, and session IDs)
    demo_transcript = get_demo_transcript(video_id)
    if demo_transcript:
        return demo_transcript

    if video_id in DEMO_VIDEOS:
        return DEMO_VIDEOS[video_id]["transcript"]

    # 2. Check dynamic runtime cache for previously ingested videos
    dyn = get_dynamic_video(video_id)
    if dyn and dyn.get("transcript"):
        return dyn["transcript"]

    # 3. Live YouTube API extraction
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        # Try native English, Hindi, or Indian English transcripts
        preferred_languages = ["en", "en-US", "en-GB", "hi", "en-IN"]
        try:
            transcript = transcript_list.find_transcript(preferred_languages)
            return transcript.fetch()
        except Exception:
            pass

        # Fallback: Auto-translate whatever caption track is available to English
        try:
            for t in transcript_list:
                return t.translate("en").fetch()
        except Exception:
            pass

    except Exception as e:
        logger.warning(f"Live transcript fetch failed for {video_id}: {e}")

    if not allow_placeholder:
        logger.warning(f"No transcript found for video {video_id}")
        return []

    logger.info(f"Generating minimal placeholder transcript for video {video_id}")
    return [
        {"start": 0.0, "duration": 30.0, "text": f"Lecture video ({video_id}) initialized. Interactive chapters synchronized."},
        {"start": 30.0, "duration": 60.0, "text": "Core topic introduction and conceptual definitions."},
        {"start": 90.0, "duration": 90.0, "text": "Detailed analysis and principle exploration."},
        {"start": 180.0, "duration": 120.0, "text": "Worked examples and practical application summary."},
    ]
