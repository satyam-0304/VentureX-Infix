"""Unit and Integration Tests for Lurnix Profile & Account Management Module."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.profile_service import ProfileService, get_db_connection, hash_password

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_clean_demo_user():
    """Ensure tests run against a pristine demo user state."""
    conn = get_db_connection()
    cur = conn.cursor()
    p_hash, p_salt = hash_password("Password123!")
    cur.execute("""
        UPDATE users
        SET full_name = 'Simona Biles',
            bio = 'Pre-engineering student specializing in chemistry, polymer structures, and reaction kinetics.',
            institution = 'Stanford Online Learning & Engineering',
            target_exam = 'GATE / Chemistry Advanced 2026',
            avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80',
            password_hash = ?,
            password_salt = ?
        WHERE email = 'simona@lurnix.edu'
    """, (p_hash, p_salt))
    conn.commit()
    yield
    # Clean up after test
    cur.execute("""
        UPDATE users
        SET full_name = 'Simona Biles',
            password_hash = ?,
            password_salt = ?
        WHERE email = 'simona@lurnix.edu'
    """, (p_hash, p_salt))
    conn.commit()
    conn.close()


def test_login_successful():
    """Verify authenticating with default demo credentials succeeds."""
    response = client.post("/api/auth/login", json={
        "email": "simona@lurnix.edu",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["token"].startswith("lurnix_tok_")
    assert data["user"]["email"] == "simona@lurnix.edu"
    assert data["user"]["full_name"] == "Simona Biles"


def test_login_invalid_password():
    """Verify login with wrong password fails with 401."""
    response = client.post("/api/auth/login", json={
        "email": "simona@lurnix.edu",
        "password": "WrongPassword999!"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_get_profile():
    """Verify retrieving current user profile."""
    # Authenticate first
    login_res = client.post("/api/auth/login", json={
        "email": "simona@lurnix.edu",
        "password": "Password123!"
    })
    token = login_res.json()["token"]

    response = client.get("/api/profile", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "simona@lurnix.edu"
    assert data["full_name"] == "Simona Biles"
    assert "Stanford" in data["institution"]


def test_update_profile():
    """Verify editing user personal information."""
    login_res = client.post("/api/auth/login", json={
        "email": "simona@lurnix.edu",
        "password": "Password123!"
    })
    token = login_res.json()["token"]

    update_payload = {
        "full_name": "Simona Biles (Honors)",
        "bio": "Honors researcher exploring molecular polymer synthesis and thermodynamics.",
        "institution": "Stanford University - Dept of Materials Science",
        "target_exam": "GATE 2026 Rank 1"
    }

    response = client.put("/api/profile", json=update_payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Simona Biles (Honors)"
    assert data["target_exam"] == "GATE 2026 Rank 1"
    assert "Materials Science" in data["institution"]


def test_update_avatar():
    """Verify updating user avatar image."""
    login_res = client.post("/api/auth/login", json={
        "email": "simona@lurnix.edu",
        "password": "Password123!"
    })
    token = login_res.json()["token"]

    new_avatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><circle cx='10' cy='10' r='10' fill='purple'/></svg>"
    response = client.post("/api/profile/avatar", json={"avatar_data": new_avatar}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["avatar_url"] == new_avatar


def test_change_password_workflow():
    """Verify secure password change with verification checks."""
    login_res = client.post("/api/auth/login", json={
        "email": "simona@lurnix.edu",
        "password": "Password123!"
    })
    token = login_res.json()["token"]

    # 1. Reject mismatched passwords
    mismatch_res = client.post("/api/profile/change-password", json={
        "current_password": "Password123!",
        "new_password": "NewSecret2026!",
        "confirm_password": "DifferentSecret99!"
    }, headers={"Authorization": f"Bearer {token}"})
    assert mismatch_res.status_code == 400
    assert "match" in mismatch_res.json()["detail"].lower()

    # 2. Reject weak passwords
    weak_res = client.post("/api/profile/change-password", json={
        "current_password": "Password123!",
        "new_password": "short",
        "confirm_password": "short"
    }, headers={"Authorization": f"Bearer {token}"})
    assert weak_res.status_code == 400
    assert "8 characters" in weak_res.json()["detail"].lower()

    # 3. Reject wrong current password
    wrong_curr = client.post("/api/profile/change-password", json={
        "current_password": "IncorrectPassword!",
        "new_password": "NewValidSecret2026!",
        "confirm_password": "NewValidSecret2026!"
    }, headers={"Authorization": f"Bearer {token}"})
    assert wrong_curr.status_code == 400
    assert "current password" in wrong_curr.json()["detail"].lower()

    # 4. Successful password update
    success_res = client.post("/api/profile/change-password", json={
        "current_password": "Password123!",
        "new_password": "NewValidSecret2026!",
        "confirm_password": "NewValidSecret2026!"
    }, headers={"Authorization": f"Bearer {token}"})
    assert success_res.status_code == 200

    # 5. Verify login with new password succeeds and old password fails
    old_fail = client.post("/api/auth/login", json={
        "email": "simona@lurnix.edu",
        "password": "Password123!"
    })
    assert old_fail.status_code == 401

    new_login = client.post("/api/auth/login", json={
        "email": "simona@lurnix.edu",
        "password": "NewValidSecret2026!"
    })
    assert new_login.status_code == 200

    # Reset back to Password123! for test consistency
    reset_tok = new_login.json()["token"]
    client.post("/api/profile/change-password", json={
        "current_password": "NewValidSecret2026!",
        "new_password": "Password123!",
        "confirm_password": "Password123!"
    }, headers={"Authorization": f"Bearer {reset_tok}"})


def test_learning_stats():
    """Verify retrieving aggregated user learning statistics."""
    login_res = client.post("/api/auth/login", json={
        "email": "simona@lurnix.edu",
        "password": "Password123!"
    })
    token = login_res.json()["token"]

    response = client.get("/api/profile/stats", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["total_lectures_watched"] >= 1
    assert data["quizzes_attempted"] >= 1
    assert data["average_quiz_accuracy"] >= 0.0
    assert data["current_streak_days"] >= 1


def test_watch_history_and_recording():
    """Verify recording and querying watch history with standardized time formats."""
    login_res = client.post("/api/auth/login", json={
        "email": "simona@lurnix.edu",
        "password": "Password123!"
    })
    token = login_res.json()["token"]

    record_res = client.post("/api/profile/history", json={
        "session_id": "session-test-01",
        "video_id": "demo_test",
        "title": "Introduction to Quantum Mechanics",
        "course_name": "Modern Physics",
        "current_timestamp_sec": 845.0,
        "duration_sec": 3600.0,
        "completed": False
    }, headers={"Authorization": f"Bearer {token}"})
    assert record_res.status_code == 200
    item = record_res.json()
    assert item["last_timestamp_formatted"] == "14:05"  # 845s = 14m 05s
    assert item["duration_formatted"] == "01:00:00"     # 3600s = 1h 00m 00s

    # Retrieve history
    history_res = client.get("/api/profile/history", headers={"Authorization": f"Bearer {token}"})
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) >= 1
    assert any(h["session_id"] == "session-test-01" for h in history)


def test_achievements_list():
    """Verify retrieving student milestones and badges."""
    login_res = client.post("/api/auth/login", json={
        "email": "simona@lurnix.edu",
        "password": "Password123!"
    })
    token = login_res.json()["token"]

    response = client.get("/api/profile/achievements", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    achievements = response.json()
    assert len(achievements) >= 4
    assert any(a["badge_key"] == "first_lecture" for a in achievements)
    assert any(a["badge_key"] == "streak_master" for a in achievements)


def test_logout():
    """Verify logout revokes active authentication token."""
    login_res = client.post("/api/auth/login", json={
        "email": "simona@lurnix.edu",
        "password": "Password123!"
    })
    token = login_res.json()["token"]

    logout_res = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200
    assert "Logged out successfully" in logout_res.json()["message"]
