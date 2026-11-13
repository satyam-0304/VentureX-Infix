import logging
from fastapi import APIRouter, HTTPException
from app.schemas import ChatRequest, ChatResponse, Citation, QAMode
from app.services.context_slicer import (
    slice_transcript,
    format_transcript_slice,
    format_seconds_to_timestamp,
)
from app.services.sample_data import get_demo_transcript, get_demo_video_title
from app.services.gemini import is_gemini_configured, generate_structured
from app.prompts.qa import build_qa_prompt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Contextual Q&A"])


def _deterministic_mock_response(query: str, current_sec: float, sliced_items: list[dict]) -> ChatResponse:
    """Fallback generator when GEMINI_API_KEY is not configured or in offline test mode."""
    q_lower = query.lower()

    # Out of context check
    irrelevant_keywords = ["world cup", "football", "fifa", "capital of", "weather", "president", "movie"]
    if any(k in q_lower for k in irrelevant_keywords):
        return ChatResponse(
            answer="This topic is not covered by the instructor in this lecture. The current section focuses strictly on addition polymerization mechanisms.",
            citations=[],
            not_covered=True,
            concept_tag="Out of Scope",
        )

    # Specific topic matches for Arjun's Polymers lecture
    if any(k in q_lower for k in ["benzoyl", "peroxide", "initiator", "free radical", "radical"]):
        return ChatResponse(
            answer="In this lecture, the instructor explains that benzoyl peroxide acts as the free-radical initiator. Upon mild heating, its peroxide O-O bond breaks homolytically to produce active benzoyloxy radicals that kick off chain growth.",
            citations=[Citation(label="14:05", start_sec=845, end_sec=870)],
            not_covered=False,
            concept_tag="Free Radical Initiators",
        )

    if any(k in q_lower for k in ["propagation", "grow", "chain"]):
        return ChatResponse(
            answer="The instructor explains that in the chain propagation phase, the active radical successively attacks hundreds of monomer double bonds, rapidly elongating the macromolecule.",
            citations=[Citation(label="15:50", start_sec=950, end_sec=990)],
            not_covered=False,
            concept_tag="Chain Propagation",
        )

    if any(k in q_lower for k in ["condensation", "nylon", "water"]):
        return ChatResponse(
            answer="Condensation polymerization involves reactions between bifunctional or polyfunctional monomers accompanied by the elimination of small molecules like water or alcohol.",
            citations=[Citation(label="24:10", start_sec=1450, end_sec=1480)],
            not_covered=False,
            concept_tag="Condensation Polymerization",
        )

    # Generic contextual response derived from closest slice item
    citation_start = int(current_sec)
    citation_end = citation_start + 25
    label = format_seconds_to_timestamp(citation_start)

    closest_text = sliced_items[0]["text"] if sliced_items else "the lecture material"
    return ChatResponse(
        answer=f"At this point in the lecture ({label}), the instructor is explaining: '{closest_text}'.",
        citations=[Citation(label=label, start_sec=citation_start, end_sec=citation_end)],
        not_covered=False,
        concept_tag="Lecture Overview",
    )


@router.post("", response_model=ChatResponse)
async def ask_contextual_doubt(request: ChatRequest) -> ChatResponse:
    """Answer a student's question grounded strictly in the video transcript at the current timestamp."""
    try:
        # 1. Retrieve full transcript for video
        transcript = get_demo_transcript(request.video_id)
        video_title = get_demo_video_title(request.video_id)

        # 2. Slice transcript around current playback timestamp [t-120s, t+60s]
        sliced_items = slice_transcript(
            transcript=transcript,
            current_sec=request.current_timestamp,
            window_before=120.0,
            window_after=60.0,
        )

        # 3. Format into timestamped lines
        formatted_slice = format_transcript_slice(sliced_items)

        # 4. If Gemini is configured, invoke Gemini 2.5 Flash with structured output
        if is_gemini_configured():
            system_instruction, user_prompt = build_qa_prompt(
                query=request.query,
                current_sec=request.current_timestamp,
                formatted_transcript_slice=formatted_slice,
                video_title=video_title,
            )
            return generate_structured(
                prompt=user_prompt,
                response_model=ChatResponse,
                system_instruction=system_instruction,
                temperature=0.2,
            )

        # 5. Fallback for offline development / test runs without API key
        return _deterministic_mock_response(
            query=request.query,
            current_sec=request.current_timestamp,
            sliced_items=sliced_items,
        )

    except Exception as e:
        logger.error(f"Error processing Q&A request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")
