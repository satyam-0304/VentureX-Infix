"""Transcript Context Slicer Engine.

Laser-targets the LLM's context window by slicing full-length video transcripts
down to a targeted temporal window surrounding the user's current playback position.
"""

from typing import Any


def format_seconds_to_timestamp(seconds: float) -> str:
    """Format seconds into 'mm:ss' or 'hh:mm:ss' display string."""
    total_seconds = max(0, int(seconds))
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60

    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def slice_transcript(
    transcript: list[dict[str, Any]],
    current_sec: float,
    window_before: float = 120.0,
    window_after: float = 60.0,
) -> list[dict[str, Any]]:
    """Slice a transcript array to items intersecting [current_sec - window_before, current_sec + window_after].

    Args:
        transcript: List of dicts, expected keys: 'text', 'start', optional 'duration'.
        current_sec: Current video playback position in seconds.
        window_before: Seconds of context to capture before current_sec (default 120s / 2min).
        window_after: Seconds of context to capture after current_sec (default 60s / 1min).

    Returns:
        Filtered list of transcript dictionaries in chronological order.
    """
    if not transcript:
        return []

    current_sec = max(0.0, float(current_sec))
    start_bound = max(0.0, current_sec - window_before)
    end_bound = current_sec + window_after

    sliced = []
    for item in transcript:
        item_start = float(item.get("start", 0.0))
        item_duration = float(item.get("duration", 0.0))
        item_end = item_start + item_duration if item_duration > 0 else item_start

        # Segment overlaps target window if:
        # segment starts before window ends AND segment ends after window starts
        if item_start <= end_bound and item_end >= start_bound:
            sliced.append(item)

    # Edge case: If window landed in a gap between subtitles, return closest 5 segments
    if not sliced and transcript:
        closest = sorted(transcript, key=lambda x: abs(float(x.get("start", 0.0)) - current_sec))
        sliced = sorted(closest[:5], key=lambda x: float(x.get("start", 0.0)))

    return sliced


def format_transcript_slice(slice_items: list[dict[str, Any]]) -> str:
    """Format a sliced transcript into timestamped lines suitable for LLM prompt injection.

    Example output:
        [14:05] The instructor begins explaining the free radical mechanism.
        [14:18] Benzoyl peroxide splits into benzoyloxy radicals upon heating.
    """
    if not slice_items:
        return "(No transcript segments available for this segment)"

    lines = []
    for item in slice_items:
        start_sec = float(item.get("start", 0.0))
        label = format_seconds_to_timestamp(start_sec)
        text = str(item.get("text", "")).strip()
        lines.append(f"[{label}] {text}")

    return "\n".join(lines)

