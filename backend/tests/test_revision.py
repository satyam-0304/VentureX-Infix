from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_rapid_revision_cheat_sheet():
    """Verify fetching the 10-minute rapid revision cheat sheet."""
    response = client.get("/api/video/demo_polymers/revision")
    assert response.status_code == 200
    data = response.json()

    assert data["video_id"] == "demo_polymers"
    assert "Polymers" in data["executive_summary"]

    # Verify high-yield points
    points = data["high_yield_points"]
    assert len(points) >= 5

    for p in points:
        assert "concept" in p
        assert "key_rule" in p
        assert isinstance(p["timestamp_sec"], int)
        assert p["timestamp_sec"] > 0

    # Verify clickable derivation timestamps exist
    timestamps = [p["timestamp_sec"] for p in points]
    assert 845 in timestamps  # Benzoyl peroxide initiation
    assert 2500 in timestamps  # Vulcanization

    # Verify LaTeX formulas
    formulas = data["cheat_sheet_formulas"]
    assert len(formulas) >= 3
    assert any("$$" in f for f in formulas)
    assert any("C}_6\\text{H}_5" in f or "HOOC" in f for f in formulas)

