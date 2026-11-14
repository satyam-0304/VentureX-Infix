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
from app.prompts.explain import build_explain_prompt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Contextual Q&A"])


def _deterministic_mock_response(query: str, current_sec: float, sliced_items: list[dict], mode: QAMode = QAMode.STANDARD) -> ChatResponse:
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

    # Modality specific overrides
    if mode == QAMode.ANALOGY:
        return ChatResponse(
            answer="Think of benzoyl peroxide like an engine spark plug: on mild heating, it splits apart to produce eager free radicals that immediately kick off the chain reaction like cars coupling onto a moving locomotive.",
            citations=[Citation(label="14:05", start_sec=845, end_sec=870)],
            not_covered=False,
            concept_tag="Analogy: Spark Plug",
        )

    if mode == QAMode.STEP_BY_STEP:
        return ChatResponse(
            answer="1. Initiation: Benzoyl peroxide breaks homolytically upon mild heating into two benzoyloxy radicals.\n2. Attack: The radical attacks the ethene monomer double bond, creating a new radical.\n3. Propagation: This radical successively attaches hundreds of monomers to rapidly grow the chain.",
            citations=[Citation(label="14:05", start_sec=845, end_sec=910)],
            not_covered=False,
            concept_tag="Step-by-Step Breakdown",
        )

    if mode == QAMode.HINGLISH:
        return ChatResponse(
            answer="Dekho simple funda yeh hai: Benzoyl peroxide yahan initiator ki tarah kaam karta hai. Thoda sa heat hote hi iska O-O bond homolytically break ho jata hai aur free radicals ban jaate hain jo monomer pe attack karke chain reaction shuru kar dete hain!",
            citations=[Citation(label="14:05", start_sec=845, end_sec=870)],
            not_covered=False,
            concept_tag="Hinglish Explanation",
        )

    if mode == QAMode.SIMPLER:
        return ChatResponse(
            answer="Imagine a long train being built. Benzoyl peroxide is like the starter engine that grabs onto the very first passenger car so more cars can link on behind it.",
            citations=[Citation(label="14:05", start_sec=845, end_sec=870)],
            not_covered=False,
            concept_tag="Simplified Concept",
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
        # 1. Retrieve full transcript for video (check dynamic cache, demo fixture, or live fetch)
        from app.services.dynamic_cache import get_dynamic_video
        dyn = get_dynamic_video(request.video_id)
        if dyn and dyn.get("transcript"):
            transcript = dyn["transcript"]
            video_title = dyn.get("title", f"Lecture ({request.video_id})")
        else:
            transcript = get_demo_transcript(request.video_id)
            video_title = get_demo_video_title(request.video_id)
            if not transcript and len(request.video_id) >= 11:
                try:
                    from app.services.transcript import fetch_youtube_transcript
                    transcript = fetch_youtube_transcript(request.video_id)
                except Exception:
                    pass

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
            if request.mode == QAMode.STANDARD:
                system_instruction, user_prompt = build_qa_prompt(
                    query=request.query,
                    current_sec=request.current_timestamp,
                    formatted_transcript_slice=formatted_slice,
                    video_title=video_title,
                )
            else:
                system_instruction, user_prompt = build_explain_prompt(
                    query=request.query,
                    current_sec=request.current_timestamp,
                    formatted_transcript_slice=formatted_slice,
                    mode=request.mode,
                    video_title=video_title,
                )

            # Gemini request handling
            resp = generate_structured(
                prompt=user_prompt,
                response_model=ChatResponse,
                system_instruction=system_instruction,
                temperature=0.3 if request.mode != QAMode.STANDARD else 0.2,
            )
            if resp.not_covered:
                resp.citations = []
            if request.mode == QAMode.ANALOGY and "analogy" not in resp.concept_tag.lower():
                resp.concept_tag = f"{resp.concept_tag} (Analogy)"
            elif request.mode == QAMode.STEP_BY_STEP and "step" not in resp.concept_tag.lower():
                resp.concept_tag = f"{resp.concept_tag} (Step-by-Step)"
            elif request.mode == QAMode.HINGLISH and "hinglish" not in resp.concept_tag.lower():
                resp.concept_tag = f"{resp.concept_tag} (Hinglish)"
            elif request.mode == QAMode.SIMPLER and "simpl" not in resp.concept_tag.lower():
                resp.concept_tag = f"{resp.concept_tag} (Simplified)"
            return resp

        # 5. Fallback for offline development / test runs or transient API limits
        return _deterministic_mock_response(
            query=request.query,
            current_sec=request.current_timestamp,
            sliced_items=sliced_items,
            mode=request.mode,
        )

    except Exception as e:
        logger.error(f"Error processing Q&A request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")

