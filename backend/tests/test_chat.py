from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_chat_grounded_question():
    """Verify grounded contextual Q&A returns accurate citations around playback second."""
    payload = {
        "video_id": "demo_polymers",
        "current_timestamp": 845.0,
        "query": "What is the role of benzoyl peroxide here?",
        "mode": "standard",
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "answer" in data
    assert "benzoyl peroxide" in data["answer"].lower()
    assert data["not_covered"] is False
    assert len(data["citations"]) >= 1

    citation = data["citations"][0]
    assert citation["label"] == "14:05"
    assert citation["start_sec"] == 845
    assert citation["end_sec"] == 870


def test_chat_irrelevant_question_guardrail():
    """Verify that off-topic questions trigger the 'not_covered: true' guardrail."""
    payload = {
        "video_id": "demo_polymers",
        "current_timestamp": 845.0,
        "query": "Who won the FIFA World Cup?",
        "mode": "standard",
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["not_covered"] is True
    assert len(data["citations"]) == 0
    assert "not covered" in data["answer"].lower()


def test_chat_propagation_timestamp():
    """Verify Q&A for chain propagation at 950s."""
    payload = {
        "video_id": "demo_polymers",
        "current_timestamp": 950.0,
        "query": "How does the chain propagation happen?",
        "mode": "standard",
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["not_covered"] is False
    assert any("propagation" in c["concept_tag"].lower() or "propagation" in data["answer"].lower() for c in [data])
    assert len(data["citations"]) >= 1
    assert data["citations"][0]["start_sec"] == 950



def test_chat_frontend_camelcase_payload():
    """Verify that the frontend React payload with camelCase aliases works seamlessly."""
    frontend_payload = {
        "sessionTitle": "Polymers & Macromolecules",
        "courseTopic": "Polymers",
        "currentTimestamp": 845.0,
        "formattedTime": "14:05",
        "userQuery": "What is the role of benzoyl peroxide here?",
    }
    response = client.post("/api/chat", json=frontend_payload)
    assert response.status_code == 200
    data = response.json()

    # Verify both backend and frontend compatibility fields
    assert "answer" in data
    assert "text" in data
    assert data["text"] == data["answer"]
    assert "benzoyl peroxide" in data["text"].lower()
    assert "relatedTimestamp" in data
    assert data["relatedTimestamp"] == 845
    assert "suggestedFollowUps" in data
    assert len(data["suggestedFollowUps"]) >= 1
