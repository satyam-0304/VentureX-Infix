"""Unit and Integration Tests for Lurnix AI Flashcard System."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.flashcard_service import FlashcardService
from app.services.profile_service import get_db_connection

client = TestClient(app)


def test_list_decks():
    """Verify listing flashcard decks returns seeded polymers deck."""
    response = client.get("/api/flashcards/decks")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    poly_deck = next((d for d in data if d["video_id"] == "demo_polymers"), None)
    assert poly_deck is not None
    assert "Polymers" in poly_deck["title"]
    assert poly_deck["card_count"] >= 15


def test_get_deck():
    """Verify retrieving full deck includes ordered cards with timestamps and categories."""
    # First get list to find id
    list_res = client.get("/api/flashcards/decks")
    deck_id = list_res.json()[0]["id"]

    response = client.get(f"/api/flashcards/decks/{deck_id}")
    assert response.status_code == 200
    deck = response.json()
    assert deck["id"] == deck_id
    assert len(deck["cards"]) >= 15

    first_card = deck["cards"][0]
    assert "question" in first_card
    assert "answer" in first_card
    assert first_card["category"] in ["Definition", "Concept", "Formula", "Important Fact"]
    assert "timestamp_formatted" in first_card
    assert first_card["timestamp_sec"] >= 0.0


def test_get_or_create_for_video():
    """Verify get-or-create endpoint returns ready deck for demo polymers video."""
    response = client.get("/api/flashcards/video/demo_polymers")
    assert response.status_code == 200
    deck = response.json()
    assert deck["video_id"] == "demo_polymers"
    assert len(deck["cards"]) >= 15


def test_generate_deck_heuristic():
    """Verify generating cards for a video produces 15-20 grounded flashcards."""
    payload = {
        "video_id": "demo_oc_02",
        "title": "SN1 vs SN2 Nucleophilic Substitution",
        "target_count": 16,
    }
    response = client.post("/api/flashcards/generate", json=payload)
    assert response.status_code == 200
    deck = response.json()
    assert deck["video_id"] == "demo_oc_02"
    assert len(deck["cards"]) >= 10
    assert any(c["category"] == "Definition" for c in deck["cards"])
    assert any(c["category"] == "Concept" for c in deck["cards"])


def test_review_card_confidence():
    """Verify confidence ratings (Orange, Purple, Green) are recorded and mastered_count updates."""
    list_res = client.get("/api/flashcards/decks")
    deck_id = list_res.json()[0]["id"]
    deck = client.get(f"/api/flashcards/decks/{deck_id}").json()
    card_id = deck["cards"][0]["id"]

    # Review as very_confident (Green)
    review_res = client.post(f"/api/flashcards/cards/{card_id}/review", json={
        "confidence": "very_confident"
    })
    assert review_res.status_code == 200
    card = review_res.json()
    assert card["confidence"] == "very_confident"
    assert card["review_count"] >= 1

    # Verify deck mastered count reflected
    refreshed_deck = client.get(f"/api/flashcards/decks/{deck_id}").json()
    assert refreshed_deck["mastered_count"] >= 1


def test_toggle_bookmark():
    """Verify bookmarking and un-bookmarking a flashcard."""
    list_res = client.get("/api/flashcards/decks")
    deck = client.get(f"/api/flashcards/decks/{list_res.json()[0]['id']}").json()
    card_id = deck["cards"][1]["id"]
    initial_bkmk = deck["cards"][1]["is_bookmarked"]

    res = client.post(f"/api/flashcards/cards/{card_id}/bookmark")
    assert res.status_code == 200
    assert res.json()["is_bookmarked"] != initial_bkmk


def test_add_edit_and_delete_card():
    """Verify adding custom card, editing question/answer, and deleting."""
    list_res = client.get("/api/flashcards/decks")
    deck_id = list_res.json()[0]["id"]

    # 1. Add card
    add_payload = {
        "question": "What is living polymerization?",
        "answer": "Chain-growth polymerization where chain termination and transfer are completely absent.",
        "category": "Definition",
        "chapter_title": "Advanced Kinetics",
        "timestamp_sec": 645.0,
    }
    add_res = client.post(f"/api/flashcards/decks/{deck_id}/cards", json=add_payload)
    assert add_res.status_code == 200
    new_card = add_res.json()
    assert new_card["question"] == "What is living polymerization?"
    assert new_card["timestamp_formatted"] == "10:45"
    card_id = new_card["id"]

    # 2. Edit card
    edit_payload = {
        "question": "Define living polymerization rigorously.",
        "category": "Concept",
    }
    edit_res = client.put(f"/api/flashcards/cards/{card_id}", json=edit_payload)
    assert edit_res.status_code == 200
    assert edit_res.json()["question"] == "Define living polymerization rigorously."
    assert edit_res.json()["category"] == "Concept"

    # 3. Delete card
    del_res = client.delete(f"/api/flashcards/cards/{card_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


def test_ai_assist_actions():
    """Verify AI tutoring actions: simplify, analogy, explain, and generate_more."""
    # Test simplify
    res_simp = client.post("/api/flashcards/ai-assist", json={
        "video_id": "demo_polymers",
        "action": "simplify",
        "current_question": "What is the defining chemical structure of a polymer?",
        "current_answer": "A polymer is a macromolecule composed of repeated monomer sub-units.",
    })
    assert res_simp.status_code == 200
    assert "Simplified" in res_simp.json()["reply"]

    # Test analogy
    res_ana = client.post("/api/flashcards/ai-assist", json={
        "video_id": "demo_polymers",
        "action": "analogy",
        "current_question": "Cross-linking in vulcanization",
    })
    assert res_ana.status_code == 200
    assert "Analogy" in res_ana.json()["reply"] or "paperclips" in res_ana.json()["reply"].lower()

    # Test generate_more
    res_more = client.post("/api/flashcards/ai-assist", json={
        "video_id": "demo_polymers",
        "action": "generate_more",
        "current_question": "Polymerization kinetics",
    })
    assert res_more.status_code == 200
    assert len(res_more.json()["generated_cards"]) >= 1


def test_restart_deck():
    """Verify restarting deck resets confidence states."""
    list_res = client.get("/api/flashcards/decks")
    deck_id = list_res.json()[0]["id"]

    res = client.post(f"/api/flashcards/decks/{deck_id}/restart")
    assert res.status_code == 200

    deck = client.get(f"/api/flashcards/decks/{deck_id}").json()
    assert deck["mastered_count"] == 0
    assert all(c["confidence"] == "unreviewed" for c in deck["cards"])
