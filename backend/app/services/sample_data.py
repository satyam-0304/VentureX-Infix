"""Canonical Demo Fixtures for Lurnix.

Provides pre-indexed lecture transcripts so the backend and frontend
can execute complete end-to-end flows immediately with zero network delay.
"""

from typing import Any

DEMO_VIDEOS: dict[str, dict[str, Any]] = {
    "demo_polymers": {
        "id": "demo_polymers",
        "youtube_id": "demo_polymers",
        "title": "Polymers Class 12 Chemistry | Full Chapter Explanation",
        "duration_sec": 3050,
        "transcript": [
            {"start": 10.0, "duration": 15.0, "text": "Hello students, today we begin our complete study of Polymers for Class 12 Chemistry."},
            {"start": 35.0, "duration": 20.0, "text": "A polymer is a large macromolecule composed of repeating structural units called monomers."},
            {"start": 120.0, "duration": 25.0, "text": "First, polymers can be classified based on source: natural polymers like rubber and starch, and synthetic polymers like polythene and nylon."},
            {"start": 620.0, "duration": 20.0, "text": "Now, let us examine the major mechanism: Addition Polymerization, also known as chain growth polymerization."},
            {"start": 650.0, "duration": 30.0, "text": "In addition polymerization, the monomer units possess double or triple bonds, like ethene or vinyl chloride."},
            {"start": 780.0, "duration": 35.0, "text": "This reaction typically proceeds through a free radical mechanism in the presence of an initiator."},
            {"start": 845.0, "duration": 25.0, "text": "Here the instructor shows benzoyl peroxide: upon heating, the peroxide O-O bond undergoes homolytic cleavage to form two benzoyloxy free radicals."},
            {"start": 870.0, "duration": 20.0, "text": "These benzoyloxy radicals can further lose carbon dioxide to generate phenyl free radicals, which attack the ethene monomer double bond."},
            {"start": 910.0, "duration": 30.0, "text": "This generates a new, larger free radical. This step is the Chain Initiation step of addition polymerization."},
            {"start": 950.0, "duration": 40.0, "text": "In the Chain Propagation step, this active radical successively adds hundreds of monomer molecules, rapidly growing the chain."},
            {"start": 1050.0, "duration": 35.0, "text": "Finally, in Chain Termination, two growing radical chains combine together, or undergo disproportionation, stopping the reaction."},
            {"start": 1450.0, "duration": 30.0, "text": "Now let us turn to Condensation Polymerization or step growth polymerization."},
            {"start": 1480.0, "duration": 40.0, "text": "Unlike addition, condensation polymerization occurs between bifunctional monomers with the loss of small molecules like water or alcohol, as seen in Nylon 6,6."},
            {"start": 1800.0, "duration": 30.0, "text": "Bakelite is formed by the cross-linking condensation of phenol with formaldehyde in the presence of an acid or base catalyst."},
            {"start": 2500.0, "duration": 35.0, "text": "Lastly, we cover the vulcanization of natural rubber by heating raw rubber with sulfur at 373 K to 415 K, creating sulfur cross-links."},
        ],
    }
}


def get_demo_transcript(video_id: str) -> list[dict[str, Any]]:
    """Retrieve transcript for a given video ID or return the primary demo polymer transcript."""
    if video_id in DEMO_VIDEOS:
        return DEMO_VIDEOS[video_id]["transcript"]
    return DEMO_VIDEOS["demo_polymers"]["transcript"]


def get_demo_video_title(video_id: str) -> str:
    """Retrieve title for a demo video."""
    if video_id in DEMO_VIDEOS:
        return DEMO_VIDEOS[video_id]["title"]
    return "Polymers Class 12 Chemistry"

