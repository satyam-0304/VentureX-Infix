from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_video_chapters():
    """Verify fetching structured chapter boundaries for a lecture."""
    response = client.get("/api/video/demo_polymers/chapters")
    assert response.status_code == 200
    chapters = response.json()

    assert len(chapters) == 4
    # First chapter starts at 0
    assert chapters[0]["start_sec"] == 0
    # Sequential boundaries
    for i in range(len(chapters)):
        assert chapters[i]["start_sec"] < chapters[i]["end_sec"]
        assert "title" in chapters[i]
        assert "summary" in chapters[i]


def test_get_all_video_notes():
    """Verify fetching complete structured notes and formulas."""
    response = client.get("/api/video/demo_polymers/notes")
    assert response.status_code == 200
    all_notes = response.json()

    assert len(all_notes) >= 3
    # Check Chapter 2 (Addition Polymerization) has LaTeX formulas
    ch2 = next(n for n in all_notes if n["chapter_id"] == 2)
    assert "Addition" in ch2["chapter_title"]
    assert "###" in ch2["markdown_content"]
    assert len(ch2["formulas"]) >= 1
    assert "$$" in ch2["formulas"][0]
    assert len(ch2["key_takeaways"]) >= 3


def test_get_single_chapter_notes():
    """Verify fetching notes for a specific chapter."""
    response = client.get("/api/video/demo_polymers/notes/2")
    assert response.status_code == 200
    ch2 = response.json()

    assert ch2["chapter_id"] == 2
    assert "Chain Initiation" in ch2["markdown_content"]
    assert any("benzoyl" in t.lower() or "ethene" in t.lower() for t in ch2["key_takeaways"])


def test_get_single_chapter_notes_not_found():
    """Verify non-existent chapter returns 404."""
    response = client.get("/api/video/demo_polymers/notes/9999")
    assert response.status_code == 404

