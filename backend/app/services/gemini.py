import json
import logging
from typing import Type, TypeVar, Optional
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

_client = None


def get_genai_client():
    """Lazily initialize Google GenAI Client with the configured API key."""
    global _client
    if _client is not None:
        return _client

    api_key = settings.gemini_api_key
    if not api_key:
        logger.warning("GEMINI_API_KEY is not configured in settings or environment.")
        return None

    try:
        from google import genai
        _client = genai.Client(api_key=api_key)
        return _client
    except Exception as e:
        logger.error(f"Failed to initialize google-genai client: {e}")
        return None


def is_gemini_configured() -> bool:
    """Check if Gemini API is ready to use."""
    return bool(settings.gemini_api_key and settings.gemini_api_key != "your_gemini_api_key_here")


def generate_structured(
    prompt: str,
    response_model: Type[T],
    system_instruction: Optional[str] = None,
    temperature: float = 0.2,
) -> T:
    """
    Call Gemini Flash with strict structured JSON output guaranteed against response_model schema.
    """
    client = get_genai_client()
    if client is None:
        raise ValueError(
            "Gemini client is not initialized. Please set GEMINI_API_KEY in backend/.env"
        )

    from google.genai import types

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_json_schema=response_model.model_json_schema(),
        temperature=temperature,
        system_instruction=system_instruction,
    )

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=config,
    )

    if not response.text:
        raise ValueError("Received empty response from Gemini API.")

    # Validate and parse into Pydantic model
    return response_model.model_validate_json(response.text)

