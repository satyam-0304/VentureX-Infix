from fastapi.testclient import TestClient
from app.main import app
from app.services.transcript import extract_youtube_id

client = TestClient(app)


def test_youtube_url_id_extraction():
    """Verify robust extraction of 11-char video IDs across diverse YouTube formats."""
    assert extract_youtube_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    assert extract_youtube_id("https://youtu.be/dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    assert extract_youtube_id("https://www.youtube.com/embed/dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    assert extract_youtube_id("dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    assert extract_youtube_id("demo_neural_nets") == "demo_neural_nets"


def test_ingest_demo_polymers():
    """Verify ingesting primary Chemistry demo lecture."""
    response = client.post("/api/video/ingest", json={"youtube_url": "https://www.youtube.com/watch?v=demo_polymers"})
    assert response.status_code == 200
    data = response.json()

    assert data["video_id"] == "demo_polymers"
    assert data["cached"] is True
    assert len(data["chapters"]) == 4


def test_ingest_and_evaluate_neural_networks_domain():
    """Verify that Lurnix is fully domain-agnostic by testing Computer Science & AI content."""
    # 1. Ingest Neural Networks video
    ingest_res = client.post("/api/video/ingest", json={"youtube_url": "demo_neural_nets"})
    assert ingest_res.status_code == 200
    data = ingest_res.json()
    assert "Neural Networks" in data["title"]
    assert len(data["chapters"]) == 3

    # 2. Fetch Quiz for Computer Science
    quiz_res = client.get("/api/video/demo_neural_nets/quiz")
    assert quiz_res.status_code == 200
    quizzes = quiz_res.json()
    assert len(quizzes) >= 1
    assert "Gradient Descent" in quizzes[0]["concept_tag"]

    # 3. Submit Wrong Answer to test Remediation for Computer Science
    submit_res = client.post(
        "/api/quiz/submit",
        json={
            "session_id": "cs_student_1",
            "video_id": "demo_neural_nets",
            "question_id": 201,
            "selected_idx": 0,  # Wrong answer: "decreases monotonically"
        },
    )
    assert submit_res.status_code == 200
    sub_data = submit_res.json()
    assert sub_data["is_correct"] is False
    assert sub_data["remediation"] is not None
    assert sub_data["remediation"]["rewatch_link"]["start_sec"] == 480

    # 4. Fetch Notes for Computer Science
    notes_res = client.get("/api/video/demo_neural_nets/notes")
    assert notes_res.status_code == 200
    notes = notes_res.json()
    assert len(notes) >= 1
    assert "\\nabla L(w_t)" in notes[0]["formulas"][0]


def test_ingest_and_evaluate_physics_domain():
    """Verify Physics / Electromagnetism domain support."""
    # Ingest Physics video
    res = client.post("/api/video/ingest", json={"youtube_url": "demo_electromagnetism"})
    assert res.status_code == 200
    assert "Faraday" in res.json()["title"]

    # Fetch Physics Revision Cheat Sheet
    rev_res = client.get("/api/video/demo_electromagnetism/revision")
    assert rev_res.status_code == 200
    rev_data = rev_res.json()
    assert any("Lenz" in p["concept"] for p in rev_data["high_yield_points"])


def test_telemetry_seek_confusion_nudge():
    """Verify rewind telemetry detects learner hesitation and triggers proactive assistance."""
    # 1. Significant rewind of 30 seconds -> trigger confusion nudge
    rewind_event = {
        "session_id": "arjun_live",
        "video_id": "demo_polymers",
        "from_sec": 890.0,
        "to_sec": 845.0,  # rewound 45 seconds back to benzoyl peroxide
    }
    res = client.post("/api/telemetry/seek", json=rewind_event)
    assert res.status_code == 200
    data = res.json()
    assert data["confusion_detected"] is True
    assert data["nudge"] is not None
    assert "analogy" in data["nudge"]["suggested_modes"]
    assert data["nudge"]["target_timestamp"] == 845.0

    # 2. Normal forward seek (e.g. skipping intro) -> no confusion nudge
    forward_event = {
        "session_id": "arjun_live",
        "video_id": "demo_polymers",
        "from_sec": 10.0,
        "to_sec": 300.0,
    }
    res2 = client.post("/api/telemetry/seek", json=forward_event)
    assert res2.status_code == 200
    assert res2.json()["confusion_detected"] is False
    assert res2.json()["nudge"] is None
