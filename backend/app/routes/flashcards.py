"""FastAPI Routes for Lurnix AI-Powered Flashcard Learning System."""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Header, Depends
from app.schemas import (
    FlashcardDeck,
    FlashcardItem,
    GenerateFlashcardsRequest,
    CreateCardRequest,
    UpdateCardRequest,
    ReviewCardRequest,
    AiAssistRequest,
    AiAssistResponse,
)
from app.services.flashcard_service import FlashcardService
from app.services.profile_service import ProfileService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/flashcards", tags=["Flashcards"])


def resolve_auth_user(authorization: Optional[str] = Header(None)) -> str:
    """Extracts user ID from Authorization header or falls back to demo student."""
    if authorization:
        user = ProfileService.get_user_by_token(authorization)
        if user:
            return user.id
    return "usr_simona_01"


@router.get("/decks", response_model=List[FlashcardDeck])
async def list_decks(user_id: str = Depends(resolve_auth_user)):
    """Retrieves all flashcard decks belonging to or accessible by current user."""
    return FlashcardService.get_user_decks(user_id)


@router.get("/decks/{deck_id}", response_model=FlashcardDeck)
async def get_deck(deck_id: str, user_id: str = Depends(resolve_auth_user)):
    """Retrieves single deck with ordered cards."""
    deck = FlashcardService.get_deck_by_id(deck_id, user_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Flashcard deck not found.")
    return deck


@router.get("/video/{video_id}", response_model=FlashcardDeck)
async def get_or_create_for_video(video_id: str, session_id: Optional[str] = None, user_id: str = Depends(resolve_auth_user)):
    """Fetches existing deck for the video or generates a lecture-grounded deck automatically."""
    return FlashcardService.get_or_create_deck_for_video(video_id, user_id, session_id)


@router.post("/generate", response_model=FlashcardDeck)
async def generate_deck(req: GenerateFlashcardsRequest, user_id: str = Depends(resolve_auth_user)):
    """Generates a fresh lecture-grounded flashcard deck from video transcript and chapters."""
    return FlashcardService.generate_flashcards(req, user_id)


@router.post("/decks/{deck_id}/cards", response_model=FlashcardItem)
async def add_card(deck_id: str, req: CreateCardRequest, user_id: str = Depends(resolve_auth_user)):
    """Adds a custom student or AI-generated card to an existing deck."""
    card = FlashcardService.add_card_to_deck(deck_id, user_id, req)
    if not card:
        raise HTTPException(status_code=404, detail="Deck not found.")
    return card


@router.put("/cards/{card_id}", response_model=FlashcardItem)
async def update_card(card_id: str, req: UpdateCardRequest, user_id: str = Depends(resolve_auth_user)):
    """Updates question, answer, category, or bookmark status of a card."""
    card = FlashcardService.update_card(card_id, user_id, req)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found or unauthorized.")
    return card


@router.delete("/cards/{card_id}")
async def delete_card(card_id: str, user_id: str = Depends(resolve_auth_user)):
    """Deletes a card from its deck."""
    success = FlashcardService.delete_card(card_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Card not found.")
    return {"success": True, "message": "Card deleted successfully."}


@router.post("/cards/{card_id}/review", response_model=FlashcardItem)
async def review_card(card_id: str, req: ReviewCardRequest, user_id: str = Depends(resolve_auth_user)):
    """Submits student confidence rating ('not_confident', 'somewhat_confident', 'very_confident')."""
    card = FlashcardService.review_card(card_id, user_id, req.confidence)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found.")
    return card


@router.post("/cards/{card_id}/bookmark", response_model=FlashcardItem)
async def toggle_bookmark(card_id: str, user_id: str = Depends(resolve_auth_user)):
    """Toggles bookmark status on a flashcard."""
    conn = FlashcardService.get_deck_by_id  # ensure imported
    from app.services.profile_service import get_db_connection
    c = get_db_connection()
    cur = c.cursor()
    cur.execute("SELECT is_bookmarked FROM flashcards WHERE id = ?", (card_id,))
    row = cur.fetchone()
    if not row:
        c.close()
        raise HTTPException(status_code=404, detail="Card not found.")
    new_state = 0 if row["is_bookmarked"] else 1
    c.close()

    updated = FlashcardService.update_card(card_id, user_id, UpdateCardRequest(is_bookmarked=bool(new_state)))
    return updated


@router.post("/decks/{deck_id}/restart")
async def restart_deck(deck_id: str, user_id: str = Depends(resolve_auth_user)):
    """Resets confidence progress across all cards in a deck."""
    FlashcardService.restart_deck(deck_id, user_id)
    return {"success": True, "message": "Deck progress reset successfully."}


@router.post("/ai-assist", response_model=AiAssistResponse)
async def ai_assist(req: AiAssistRequest, user_id: str = Depends(resolve_auth_user)):
    """Contextual AI tutoring: explain card, simplify wording, provide analogy, or generate more cards."""
    return FlashcardService.ai_assist(req, user_id)
