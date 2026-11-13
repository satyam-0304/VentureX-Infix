from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_explain_analogy_mode():
    """Verify 'Analogy' mode returns real-world metaphors with citations."""
    payload = {
        "video_id": "demo_polymers",
        "current_timestamp": 845.0,
        "query": "Can you explain this with an analogy?",
        "mode": "analogy",
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["not_covered"] is False
    assert len(data["citations"]) >= 1
    assert "Analogy" in data["concept_tag"]
    # Metaphor keywords
    assert any(w in data["answer"].lower() for w in ["spark plug", "train", "locomotive", "coupling"])


def test_explain_step_by_step_mode():
    """Verify 'Step-by-Step' mode formats derivation into numbered steps."""
    payload = {
        "video_id": "demo_polymers",
        "current_timestamp": 845.0,
        "query": "Break this mechanism down step by step",
        "mode": "step_by_step",
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["not_covered"] is False
    assert "Step-by-Step" in data["concept_tag"]
    assert "1." in data["answer"]
    assert "2." in data["answer"]
    assert "3." in data["answer"]
    assert len(data["citations"]) >= 1


def test_explain_hinglish_mode():
    """Verify 'Hinglish' mode uses conversational Indian college phrasing."""
    payload = {
        "video_id": "demo_polymers",
        "current_timestamp": 845.0,
        "query": "Hinglish me samjhao na bhai",
        "mode": "hinglish",
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["not_covered"] is False
    assert "Hinglish" in data["concept_tag"]
    # Conversational phrasing
    assert any(w in data["answer"] for w in ["Dekho", "funda", "shuru", "hai", "kaam"])
    # Technical terms preserved in English
    assert "benzoyl peroxide" in data["answer"].lower() or "free radical" in data["answer"].lower()
    assert len(data["citations"]) >= 1


def test_explain_simpler_mode():
    """Verify 'Simpler' mode gives accessible explanation for high schoolers."""
    payload = {
        "video_id": "demo_polymers",
        "current_timestamp": 845.0,
        "query": "Explain simpler without jargon",
        "mode": "simpler",
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["not_covered"] is False
    assert "Simplified" in data["concept_tag"]
    assert len(data["citations"]) >= 1

