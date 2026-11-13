from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_video_quiz():
    """Verify fetching chapter quiz questions."""
    response = client.get("/api/video/demo_polymers/quiz")
    assert response.status_code == 200
    questions = response.json()

    assert len(questions) == 3
    for q in questions:
        assert "id" in q
        assert "concept_tag" in q
        assert "question" in q
        assert len(q["options"]) == 4
        assert q["clip_start_sec"] < q["clip_end_sec"]


def test_submit_quiz_correct_answer():
    """Verify submitting a correct answer returns praise without remediation."""
    payload = {
        "session_id": "arjun_session_1",
        "video_id": "demo_polymers",
        "question_id": 101,
        "selected_idx": 0,  # Benzoyl peroxide (correct)
    }
    response = client.post("/api/quiz/submit", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["is_correct"] is True
    assert data["correct_idx"] == 0
    assert data["remediation"] is None
    assert data["current_mastery_score"] == 1.0
    assert "benzoyl peroxide" in data["explanation"].lower()


def test_submit_quiz_incorrect_answer_with_remediation():
    """Verify submitting an incorrect answer closes the loop with remediation & rewatch timestamps."""
    payload = {
        "session_id": "arjun_session_1",
        "video_id": "demo_polymers",
        "question_id": 101,
        "selected_idx": 1,  # Ziegler-Natta (wrong)
    }
    response = client.post("/api/quiz/submit", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["is_correct"] is False
    assert data["correct_idx"] == 0
    assert data["concept_tag"] == "Free Radical Initiators"

    # Crucial Closed-Loop Remediation Check
    assert data["remediation"] is not None
    assert "summary" in data["remediation"]
    assert "Ziegler-Natta" in data["remediation"]["summary"]

    rewatch = data["remediation"]["rewatch_link"]
    assert rewatch["start_sec"] == 830
    assert rewatch["end_sec"] == 880
    assert rewatch["label"] == "13:50 - 14:40"


def test_submit_quiz_not_found():
    """Verify non-existent question returns 404."""
    payload = {
        "session_id": "arjun_session_1",
        "video_id": "demo_polymers",
        "question_id": 9999,
        "selected_idx": 0,
    }
    response = client.post("/api/quiz/submit", json=payload)
    assert response.status_code == 404

