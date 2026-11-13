"""Canonical Demo Fixtures for Lurnix.

Provides pre-indexed lecture transcripts, chapters, notes, and canonical quizzes so the backend
and frontend can execute complete end-to-end flows immediately with zero network delay.
"""

from typing import Any
from app.schemas import QuizQuestion, Chapter, ChapterNotes

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

DEMO_CHAPTERS: dict[str, list[Chapter]] = {
    "demo_polymers": [
        Chapter(
            id=1,
            title="Introduction & Classification by Source",
            start_sec=0,
            end_sec=620,
            summary="Definition of high molecular weight macromolecules; classification into natural, semi-synthetic, and synthetic polymers.",
        ),
        Chapter(
            id=2,
            title="Addition Polymerization & Free Radical Mechanism",
            start_sec=620,
            end_sec=1450,
            summary="Chain-growth polymerization through initiation with benzoyl peroxide, radical propagation on ethene, and termination.",
        ),
        Chapter(
            id=3,
            title="Condensation Polymerization & Step-Growth",
            start_sec=1450,
            end_sec=2200,
            summary="Polycondensation mechanisms involving loss of simple molecules (H2O, alcohol); formation of Nylon 6,6 and cross-linked Bakelite.",
        ),
        Chapter(
            id=4,
            title="Vulcanization of Rubber & Cross-Linking",
            start_sec=2200,
            end_sec=3050,
            summary="Enhancement of physical properties of natural rubber by heating with sulfur at 373-415 K to create disulfide cross-links.",
        ),
    ]
}

DEMO_NOTES: dict[str, list[ChapterNotes]] = {
    "demo_polymers": [
        ChapterNotes(
            chapter_id=1,
            chapter_title="Introduction & Classification by Source",
            markdown_content="""### 1. Fundamentals of Polymers
- **Definition:** Polymers are high molecular mass macromolecules ($10^3 - 10^7\\text{ u}$) composed of repeating monomer units.
- **Classification by Origin:**
  - **Natural Polymers:** Found in plants/animals (e.g., cellulose, starch, natural rubber).
  - **Semi-Synthetic:** Chemically modified natural polymers (e.g., cellulose acetate / rayon).
  - **Synthetic:** Man-made laboratory polymers (e.g., polythene, nylon 6,6, buna-S).""",
            formulas=[],
            key_takeaways=[
                "Monomers join via covalent bonds into macromolecular chains.",
                "Natural rubber is a cis-1,4-polyisoprene polymer.",
            ],
        ),
        ChapterNotes(
            chapter_id=2,
            chapter_title="Addition Polymerization & Free Radical Mechanism",
            markdown_content="""### 2. Addition (Chain-Growth) Polymerization
Addition polymerization occurs in unsaturated monomers containing double or triple bonds without the elimination of any by-product molecules.

#### Three Core Reaction Stages:
1. **Chain Initiation:**
   The organic initiator undergoes homolytic cleavage upon mild heating to generate active free radicals.
   $$\\text{C}_6\\text{H}_5\\text{-CO-O-O-CO-C}_6\\text{H}_5 \\xrightarrow{\\Delta} 2 \\text{C}_6\\text{H}_5\\text{-CO-O}^\\bullet \\rightarrow 2 \\text{C}_6\\text{H}_5^\\bullet + 2\\text{CO}_2$$
2. **Chain Propagation:**
   The phenyl radical attacks the monomer double bond, generating a larger reactive radical that rapidly captures hundreds of monomer units:
   $$\\text{C}_6\\text{H}_5^\\bullet + \\text{CH}_2=\\text{CH}_2 \\rightarrow \\text{C}_6\\text{H}_5\\text{-CH}_2\\text{-CH}_2^\\bullet$$
3. **Chain Termination:**
   Radical chains terminate either through radical combination or disproportionation.""",
            formulas=[
                "$$\\text{C}_6\\text{H}_5\\text{-CO-O-O-CO-C}_6\\text{H}_5 \\xrightarrow{\\Delta} 2 \\text{C}_6\\text{H}_5^\\bullet + 2\\text{CO}_2$$",
                "$$\\text{C}_6\\text{H}_5^\\bullet + \\text{CH}_2=\\text{CH}_2 \\rightarrow \\text{C}_6\\text{H}_5\\text{-CH}_2\\text{-CH}_2^\\bullet$$",
            ],
            key_takeaways=[
                "Requires unsaturated monomers like ethene or vinyl chloride.",
                "Benzoyl peroxide serves as the vital free-radical initiator.",
                "Chain propagation is an ultra-fast exothermic cascade.",
            ],
        ),
        ChapterNotes(
            chapter_id=3,
            chapter_title="Condensation Polymerization & Step-Growth",
            markdown_content="""### 3. Condensation (Step-Growth) Polymerization
Occurs between bifunctional or polyfunctional monomers accompanied by the repeated loss of small molecules (such as $\\text{H}_2\\text{O}$ or $\\text{CH}_3\\text{OH}$).

#### Canonical Example: Nylon 6,6
Prepared by the condensation polymerization of adipic acid with hexamethylenediamine under high pressure and temperature:
$$n\\,\\text{HOOC-(CH}_2)_4\\text{-COOH} + n\\,\\text{H}_2\\text{N-(CH}_2)_6\\text{-NH}_2 \\xrightarrow{553\\text{ K}} [\\text{-CO-(CH}_2)_4\\text{-CO-NH-(CH}_2)_6\\text{-NH-}]_n + (2n-1)\\text{H}_2\\text{O}$$""",
            formulas=[
                "$$n\\,\\text{HOOC-(CH}_2)_4\\text{-COOH} + n\\,\\text{H}_2\\text{N-(CH}_2)_6\\text{-NH}_2 \\xrightarrow{553\\text{ K}} [\\text{-CO-(CH}_2)_4\\text{-CO-NH-(CH}_2)_6\\text{-NH-}]_n + (2n-1)\\text{H}_2\\text{O}$$"
            ],
            key_takeaways=[
                "Always eliminates small by-product molecules like water.",
                "Nylon 6,6 has strong intermolecular hydrogen bonding giving high tensile strength.",
            ],
        ),
    ]
}

DEMO_QUIZZES: dict[str, list[QuizQuestion]] = {
    "demo_polymers": [
        QuizQuestion(
            id=101,
            concept_tag="Free Radical Initiators",
            question="Which substance initiates chain growth in addition polymerisation according to the instructor?",
            options=[
                "Benzoyl peroxide",
                "Ziegler-Natta catalyst",
                "Sulfuric acid",
                "Zinc chloride",
            ],
            correct_idx=0,
            explanation="The instructor demonstrates that benzoyl peroxide undergoes homolytic cleavage upon mild heating to generate free radicals that start addition polymerization.",
            clip_start_sec=830,
            clip_end_sec=880,
        ),
        QuizQuestion(
            id=102,
            concept_tag="Addition vs Condensation Mechanism",
            question="What is the key distinguishing feature of condensation polymerisation like Nylon 6,6 described in the lecture?",
            options=[
                "It proceeds without losing any by-product molecules",
                "It requires elimination of small molecules like water or alcohol",
                "It only occurs with gaseous monomers like ethene",
                "It relies exclusively on free radical chain growth",
            ],
            correct_idx=1,
            explanation="The instructor emphasizes that condensation polymerisation occurs between bifunctional monomers with the loss of simple molecules such as water or alcohol.",
            clip_start_sec=1450,
            clip_end_sec=1500,
        ),
        QuizQuestion(
            id=103,
            concept_tag="Vulcanization of Rubber",
            question="Why is natural rubber heated with sulfur during the vulcanization process according to the lecture?",
            options=[
                "To break down polymer chains into smaller monomers",
                "To introduce sulfur cross-links between polymer chains at double bond sites",
                "To dissolve the rubber into a liquid lubricant",
                "To remove all carbon atoms from the polyisoprene chain",
            ],
            correct_idx=1,
            explanation="Heating with sulfur forms cross-links at the reactive sites of double bonds, making rubber stiff, elastic, and non-sticky.",
            clip_start_sec=2500,
            clip_end_sec=2550,
        ),
    ]
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


def get_demo_chapters(video_id: str) -> list[Chapter]:
    """Retrieve chapter boundaries for a given video."""
    if video_id in DEMO_CHAPTERS:
        return DEMO_CHAPTERS[video_id]
    return DEMO_CHAPTERS["demo_polymers"]


def get_demo_notes(video_id: str) -> list[ChapterNotes]:
    """Retrieve structured notes for a given video."""
    if video_id in DEMO_NOTES:
        return DEMO_NOTES[video_id]
    return DEMO_NOTES["demo_polymers"]


def get_demo_chapter_notes(video_id: str, chapter_id: int) -> ChapterNotes | None:
    """Retrieve notes for a specific chapter."""
    all_notes = get_demo_notes(video_id)
    for n in all_notes:
        if n.chapter_id == chapter_id:
            return n
    return None


def get_demo_quiz(video_id: str) -> list[QuizQuestion]:
    """Retrieve canonical quiz questions for a given demo video."""
    if video_id in DEMO_QUIZZES:
        return DEMO_QUIZZES[video_id]
    return DEMO_QUIZZES["demo_polymers"]


def get_demo_question(video_id: str, question_id: int) -> QuizQuestion | None:
    """Find a specific quiz question by ID."""
    quiz = get_demo_quiz(video_id)
    for q in quiz:
        if q.id == question_id:
            return q
    return None
