import json
from app.schemas import (
    Citation,
    ChatRequest,
    ChatResponse,
    QAMode,
    QuizQuestion,
    RemediationData,
    RewatchLink,
    QuizSubmissionResponse,
    Chapter,
    ChapterNotes,
    RapidRevisionResponse,
    RapidRevisionItem,
)


def test_chat_response_schema_validation():
    payload = {
        "answer": "Benzoyl peroxide breaks homolytically to yield free radicals.",
        "citations": [
            {"label": "14:05", "start_sec": 845, "end_sec": 865}
        ],
        "not_covered": False,
        "concept_tag": "Chain Initiation",
    }
    obj = ChatResponse.model_validate(payload)
    assert obj.answer.startswith("Benzoyl")
    assert len(obj.citations) == 1
    assert obj.citations[0].start_sec == 845
    assert obj.not_covered is False


def test_quiz_remediation_schema_validation():
    payload = {
        "is_correct": False,
        "correct_idx": 0,
        "concept_tag": "Free Radical Initiators",
        "explanation": "Ziegler-Natta is for coordination polymerisation.",
        "remediation": {
            "summary": "You confused coordination with free radical.",
            "rewatch_link": {
                "start_sec": 830,
                "end_sec": 880,
                "label": "13:50 - 14:40",
            },
        },
        "current_mastery_score": 0.5,
    }
    obj = QuizSubmissionResponse.model_validate(payload)
    assert obj.is_correct is False
    assert obj.remediation is not None
    assert obj.remediation.rewatch_link.start_sec == 830


def test_rapid_revision_schema_validation():
    payload = {
        "video_id": "demo_polymers",
        "executive_summary": "Core focus is addition and condensation polymer mechanisms.",
        "high_yield_points": [
            {
                "concept": "Free radical initiation",
                "key_rule": "Benzoyl peroxide initiator splits on mild heat.",
                "timestamp_sec": 845,
            }
        ],
        "cheat_sheet_formulas": [
            "R-O-O-R -> 2 R-O*"
        ],
    }
    obj = RapidRevisionResponse.model_validate(payload)
    assert obj.video_id == "demo_polymers"
    assert len(obj.high_yield_points) == 1
    assert obj.high_yield_points[0].timestamp_sec == 845
