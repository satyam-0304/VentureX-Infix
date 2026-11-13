import pytest
from app.services.context_slicer import (
    format_seconds_to_timestamp,
    slice_transcript,
    format_transcript_slice,
)


@pytest.fixture
def sample_polymer_transcript():
    return [
        {"start": 10.0, "duration": 5.0, "text": "Welcome to class on Polymers."},
        {"start": 60.0, "duration": 8.0, "text": "Polymers are high molecular mass macromolecules."},
        {"start": 720.0, "duration": 10.0, "text": "Now we move to addition polymerization."},
        {"start": 780.0, "duration": 12.0, "text": "It requires an initiator such as benzoyl peroxide."},
        {"start": 845.0, "duration": 15.0, "text": "Benzoyl peroxide breaks homolytically to yield benzoyloxy radicals."},
        {"start": 870.0, "duration": 10.0, "text": "These radicals attack the monomer double bond."},
        {"start": 910.0, "duration": 14.0, "text": "This begins the chain propagation phase."},
        {"start": 1500.0, "duration": 20.0, "text": "Finally, we discuss condensation polymers like Nylon 6,6."},
    ]


def test_format_seconds_to_timestamp():
    assert format_seconds_to_timestamp(0) == "00:00"
    assert format_seconds_to_timestamp(45) == "00:45"
    assert format_seconds_to_timestamp(845) == "14:05"
    assert format_seconds_to_timestamp(3665) == "01:01:05"


def test_slice_transcript_standard_window(sample_polymer_transcript):
    # current_sec = 845 (14:05)
    # window_before = 120 -> 725
    # window_after = 60 -> 905
    sliced = slice_transcript(sample_polymer_transcript, current_sec=845, window_before=120, window_after=60)
    
    starts = [item["start"] for item in sliced]
    # Expected: 780 (ends at 792 >= 725), 845, 870
    assert 845.0 in starts
    assert 870.0 in starts
    assert 780.0 in starts
    # Should NOT include 10.0, 60.0, or 1500.0
    assert 10.0 not in starts
    assert 60.0 not in starts
    assert 1500.0 not in starts


def test_slice_transcript_near_start(sample_polymer_transcript):
    # current_sec = 15s (near video start)
    sliced = slice_transcript(sample_polymer_transcript, current_sec=15, window_before=120, window_after=60)
    starts = [item["start"] for item in sliced]
    assert 10.0 in starts
    assert 60.0 in starts
    assert 845.0 not in starts


def test_slice_transcript_empty():
    assert slice_transcript([], current_sec=100) == []


def test_format_transcript_slice(sample_polymer_transcript):
    sliced = slice_transcript(sample_polymer_transcript, current_sec=845, window_before=120, window_after=60)
    formatted = format_transcript_slice(sliced)
    
    assert "[14:05] Benzoyl peroxide breaks homolytically" in formatted
    assert "[14:30] These radicals attack the monomer double bond." in formatted

