import pytest

@pytest.fixture(autouse=True)
def mock_gemini_in_tests(monkeypatch):
    """
    Ensure automated pytest runs execute deterministically against mock pedagogical fixtures,
    avoiding live API costs, quota exhaustion, and non-deterministic LLM wording differences.
    """
    from app.config import settings
    monkeypatch.setattr(settings, "gemini_api_key", "")
    monkeypatch.setattr("app.services.gemini.is_gemini_configured", lambda: False)
    monkeypatch.setattr("app.routes.chat.is_gemini_configured", lambda: False)
    monkeypatch.setattr("app.routes.revision.is_gemini_configured", lambda: False)
    monkeypatch.setattr("app.routes.quiz.is_gemini_configured", lambda: False)
    monkeypatch.setattr("app.routes.ingest.is_gemini_configured", lambda: False)
