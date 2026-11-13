"""Canonical Demo Fixtures for Lurnix.

Provides pre-indexed lecture transcripts, chapters, notes, and canonical quizzes across
multiple distinct academic domains (Chemistry, Computer Science, and Physics) so the backend
and frontend can execute complete end-to-end flows immediately with zero network delay.
"""

from typing import Any
from app.schemas import QuizQuestion, Chapter, ChapterNotes, RapidRevisionResponse, RapidRevisionItem

DEMO_VIDEOS: dict[str, dict[str, Any]] = {
    # DOMAIN 1: Chemistry (Arjun's Case Study)
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
    },

    # DOMAIN 2: Computer Science / Artificial Intelligence
    "demo_neural_nets": {
        "id": "demo_neural_nets",
        "youtube_id": "demo_neural_nets",
        "title": "Neural Networks: Gradient Descent & Backpropagation Explained",
        "duration_sec": 1140,
        "transcript": [
            {"start": 10.0, "duration": 20.0, "text": "Welcome! Today we will understand the core mathematical engine behind deep learning: Neural Networks and Gradient Descent."},
            {"start": 45.0, "duration": 25.0, "text": "An artificial neuron takes numerical inputs, multiplies them by adjustable weights, adds a bias, and passes the sum through an activation function like ReLU."},
            {"start": 180.0, "duration": 30.0, "text": "When the network makes a prediction, we measure how far off it is from the truth using a Cost or Loss function, such as Mean Squared Error."},
            {"start": 350.0, "duration": 35.0, "text": "Our goal during training is to find the set of weights that minimizes this total cost. This brings us to Gradient Descent."},
            {"start": 460.0, "duration": 30.0, "text": "The gradient is a vector that points in the direction of steepest ascent on the cost surface. Therefore, to minimize loss, we step in the negative gradient direction."},
            {"start": 500.0, "duration": 25.0, "text": "The size of this step is governed by the learning rate alpha. If alpha is too small, training takes forever; if alpha is too large, the updates overshoot and diverge."},
            {"start": 740.0, "duration": 35.0, "text": "To calculate the gradient of the loss with respect to every weight in a deep network, we use the Backpropagation algorithm, which is an application of the calculus chain rule."},
            {"start": 820.0, "duration": 30.0, "text": "We propagate error backwards from the output layer to earlier layers, updating each parameter proportionally to its contribution to the final error."},
        ],
    },

    # DOMAIN 3: Physics / JEE
    "demo_electromagnetism": {
        "id": "demo_electromagnetism",
        "youtube_id": "demo_electromagnetism",
        "title": "Electromagnetic Induction & Faraday's Law | Complete Physics",
        "duration_sec": 1800,
        "transcript": [
            {"start": 15.0, "duration": 25.0, "text": "Welcome to Electromagnetic Induction. Today we study how moving magnetic fields generate electric currents."},
            {"start": 60.0, "duration": 30.0, "text": "First, magnetic flux phi measures the total number of magnetic field lines passing through a given surface area: phi equals B dot A."},
            {"start": 460.0, "duration": 35.0, "text": "Faraday's key discovery is that an electromotive force (EMF) is induced in a circuit whenever the magnetic flux linking the circuit changes over time."},
            {"start": 520.0, "duration": 30.0, "text": "Faraday's Law states that the magnitude of the induced EMF is directly proportional to the time rate of change of magnetic flux."},
            {"start": 1120.0, "duration": 35.0, "text": "Now notice the negative sign in Faraday's equation: this represents Lenz's Law, which states that the polarity of the induced EMF opposes the change in flux that produces it."},
            {"start": 1170.0, "duration": 30.0, "text": "Lenz's Law is a direct manifestation of the Conservation of Energy: work must be done against the opposing magnetic force to generate electric power."},
        ],
    },
}

DEMO_CHAPTERS: dict[str, list[Chapter]] = {
    "demo_polymers": [
        Chapter(id=1, title="Introduction & Classification by Source", start_sec=0, end_sec=620, summary="Definition of macromolecules and classification into natural, semi-synthetic, and synthetic polymers."),
        Chapter(id=2, title="Addition Polymerization & Free Radical Mechanism", start_sec=620, end_sec=1450, summary="Chain-growth polymerization through initiation with benzoyl peroxide, radical propagation on ethene, and termination."),
        Chapter(id=3, title="Condensation Polymerization & Step-Growth", start_sec=1450, end_sec=2200, summary="Polycondensation mechanisms involving loss of simple molecules (H2O, alcohol); Nylon 6,6 and Bakelite."),
        Chapter(id=4, title="Vulcanization of Rubber & Cross-Linking", start_sec=2200, end_sec=3050, summary="Enhancement of physical properties of natural rubber by heating with sulfur at 373-415 K."),
    ],
    "demo_neural_nets": [
        Chapter(id=1, title="Perceptrons & Neural Architecture", start_sec=0, end_sec=320, summary="Inputs, weights, biases, and non-linear activation functions."),
        Chapter(id=2, title="Loss Functions & Gradient Descent", start_sec=320, end_sec=720, summary="Measuring error and taking steps proportional to the negative gradient governed by learning rate."),
        Chapter(id=3, title="Backpropagation & Calculus Chain Rule", start_sec=720, end_sec=1140, summary="Propagating error backwards through layers to update weights efficiently."),
    ],
    "demo_electromagnetism": [
        Chapter(id=1, title="Magnetic Flux Fundamentals", start_sec=0, end_sec=450, summary="Definition of magnetic flux as the surface integral of B over area A."),
        Chapter(id=2, title="Faraday's Law of Induction", start_sec=450, end_sec=1100, summary="Induced EMF is proportional to the time derivative of magnetic flux."),
        Chapter(id=3, title="Lenz's Law & Energy Conservation", start_sec=1100, end_sec=1800, summary="The negative sign indicates that induced currents oppose flux changes in accordance with energy conservation."),
    ],
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
    ],
    "demo_neural_nets": [
        ChapterNotes(
            chapter_id=2,
            chapter_title="Loss Functions & Gradient Descent",
            markdown_content="""### Gradient Descent Optimization
Gradient descent minimizes the objective cost function $L(w)$ by iteratively updating weights in the opposite direction of the gradient vector $\\nabla L(w)$.

#### Weight Update Equation:
$$w_{t+1} = w_t - \\alpha \\nabla L(w_t)$$
Where:
- $w_t$: Current parameter weights.
- $\\alpha$: Learning rate hyperparameter.
- $\\nabla L(w_t)$: Partial derivatives vector of loss with respect to weights.""",
            formulas=[
                "$$w_{t+1} = w_t - \\alpha \\nabla L(w_t)$$",
                "$$\\text{MSE} = \\frac{1}{N}\\sum_{i=1}^N (y_i - \\hat{y}_i)^2$$",
            ],
            key_takeaways=[
                "The gradient points in the direction of steepest increase in loss.",
                "Stepping along negative gradient guarantees loss minimization on convex surfaces.",
                "Learning rate alpha governs convergence stability.",
            ],
        )
    ],
    "demo_electromagnetism": [
        ChapterNotes(
            chapter_id=2,
            chapter_title="Faraday's Law of Induction",
            markdown_content="""### Faraday's Law & Lenz's Law
The induced electromotive force (EMF) $\\mathcal{E}$ in any closed loop is equal to the negative rate of change of magnetic flux through the loop.

$$\\mathcal{E} = -\\frac{d\\Phi_B}{dt}$$
$$\\Phi_B = \\int \\vec{B} \\cdot d\\vec{A} = B A \\cos(\\theta)$$""",
            formulas=[
                "$$\\mathcal{E} = -\\frac{d\\Phi_B}{dt}$$",
                "$$\\Phi_B = B A \\cos(\\theta)$$",
            ],
            key_takeaways=[
                "Induced EMF requires time-varying magnetic flux.",
                "Negative sign represents Lenz's law (energy conservation).",
            ],
        )
    ],
}

DEMO_QUIZZES: dict[str, list[QuizQuestion]] = {
    "demo_polymers": [
        QuizQuestion(
            id=101,
            concept_tag="Free Radical Initiators",
            question="Which substance initiates chain growth in addition polymerisation according to the instructor?",
            options=["Benzoyl peroxide", "Ziegler-Natta catalyst", "Sulfuric acid", "Zinc chloride"],
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
    ],
    "demo_neural_nets": [
        QuizQuestion(
            id=201,
            concept_tag="Gradient Descent Learning Rate",
            question="What happens if the learning rate alpha is set excessively high during gradient descent?",
            options=[
                "The loss decreases monotonically and safely",
                "The weight updates overshoot the minimum and may diverge",
                "All model parameters automatically collapse to zero",
                "The training loss becomes independent of data",
            ],
            correct_idx=1,
            explanation="An excessively large learning rate causes updates to bounce across valley walls, overshooting the local minimum and often causing numerical divergence.",
            clip_start_sec=480,
            clip_end_sec=530,
        )
    ],
    "demo_electromagnetism": [
        QuizQuestion(
            id=301,
            concept_tag="Lenz's Law and Conservation of Energy",
            question="What is the physical significance of the negative sign in Faraday's law of induction?",
            options=[
                "Induced EMF always has negative magnitude",
                "The induced current produces a magnetic field opposing the flux change (Lenz's Law)",
                "Electrical energy is destroyed during induction",
                "Magnetic field lines can never form closed loops",
            ],
            correct_idx=1,
            explanation="The negative sign reflects Lenz's Law: the direction of induced current opposes the flux change that produced it, ensuring conservation of energy.",
            clip_start_sec=1120,
            clip_end_sec=1180,
        )
    ],
}

DEMO_REVISIONS: dict[str, RapidRevisionResponse] = {
    "demo_polymers": RapidRevisionResponse(
        video_id="demo_polymers",
        executive_summary="This lecture covers the complete CBSE Class 12 chemistry unit on Polymers, focusing on source classification, free radical chain addition mechanisms (using benzoyl peroxide), step-growth polycondensation (Nylon 6,6 and Bakelite), and rubber vulcanization.",
        high_yield_points=[
            RapidRevisionItem(concept="Polymer Definition & Molecular Mass", key_rule="High molecular mass macromolecules (10^3 to 10^7 u) formed by covalent repetition of monomers.", timestamp_sec=35),
            RapidRevisionItem(concept="Source Classification", key_rule="Natural (starch, cellulose, natural rubber) vs Semi-synthetic (Rayon) vs Synthetic (Polythene, Nylon).", timestamp_sec=120),
            RapidRevisionItem(concept="Free Radical Chain Initiation", key_rule="Benzoyl peroxide homolytically splits on mild heating into phenyl free radicals to trigger addition.", timestamp_sec=845),
            RapidRevisionItem(concept="Condensation Elimination Rule", key_rule="Unlike addition, condensation requires bifunctional monomers and eliminates small molecules (H2O, alcohol).", timestamp_sec=1480),
            RapidRevisionItem(concept="Rubber Vulcanization Chemistry", key_rule="Heating raw rubber with sulfur at 373-415 K creates disulfide bridges between double bonds, stopping stickiness.", timestamp_sec=2500),
        ],
        cheat_sheet_formulas=[
            "$$\\text{Initiator Cleavage: } \\text{C}_6\\text{H}_5\\text{-CO-O-O-CO-C}_6\\text{H}_5 \\xrightarrow{\\Delta} 2 \\text{C}_6\\text{H}_5^\\bullet + 2\\text{CO}_2$$",
            "$$\\text{Propagation Attack: } \\text{C}_6\\text{H}_5^\\bullet + \\text{CH}_2=\\text{CH}_2 \\rightarrow \\text{C}_6\\text{H}_5\\text{-CH}_2\\text{-CH}_2^\\bullet$$",
            "$$\\text{Nylon 6,6: } n\\,\\text{HOOC-(CH}_2)_4\\text{-COOH} + n\\,\\text{H}_2\\text{N-(CH}_2)_6\\text{-NH}_2 \\rightarrow \\text{Polymer} + (2n-1)\\text{H}_2\\text{O}$$",
        ],
    ),
    "demo_neural_nets": RapidRevisionResponse(
        video_id="demo_neural_nets",
        executive_summary="Deep learning optimization guide covering artificial neurons, MSE loss surfaces, gradient descent stepping, and backpropagation chain rule calculus.",
        high_yield_points=[
            RapidRevisionItem(concept="Neuron Activation", key_rule="Linear combination of weights and inputs passed through a non-linear activation.", timestamp_sec=45),
            RapidRevisionItem(concept="Negative Gradient Direction", key_rule="The gradient points towards steepest ascent; step negative to minimize loss.", timestamp_sec=460),
            RapidRevisionItem(concept="Learning Rate Hyperparameter", key_rule="Alpha scales step size; excessive alpha causes overshoot and divergence.", timestamp_sec=500),
            RapidRevisionItem(concept="Backpropagation Calculus", key_rule="Efficient application of chain rule to compute loss derivatives across all weights.", timestamp_sec=740),
        ],
        cheat_sheet_formulas=[
            "$$w_{t+1} = w_t - \\alpha \\nabla L(w_t)$$",
            "$$\\frac{\\partial L}{\\partial w_i} = \\frac{\\partial L}{\\partial y}\\frac{\\partial y}{\\partial z}\\frac{\\partial z}{\\partial w_i}$$",
        ],
    ),
    "demo_electromagnetism": RapidRevisionResponse(
        video_id="demo_electromagnetism",
        executive_summary="Complete overview of electromagnetic induction, magnetic flux calculations, Faraday's time derivative relationship, and Lenz's law of energy conservation.",
        high_yield_points=[
            RapidRevisionItem(concept="Magnetic Flux Definition", key_rule="Phi equals surface integral of B dot dA. Measured in Webers.", timestamp_sec=60),
            RapidRevisionItem(concept="Faraday's Induction Law", key_rule="Magnitude of induced EMF is proportional to time rate of change of magnetic flux.", timestamp_sec=520),
            RapidRevisionItem(concept="Lenz's Law Negative Sign", key_rule="Induced current polarity creates magnetic field opposing flux change.", timestamp_sec=1120),
        ],
        cheat_sheet_formulas=[
            "$$\\Phi_B = B A \\cos(\\theta)$$",
            "$$\\mathcal{E} = -\\frac{d\\Phi_B}{dt}$$",
        ],
    ),
}


# Mapping from known YouTube video IDs to demo fixture keys (emptied to prevent hijacking live URLs)
YOUTUBE_TO_DEMO_MAP: dict[str, str] = {}


def resolve_demo_key(video_id: str) -> str | None:
    """Resolve a video_id (which could be a slug or a YouTube ID) to a demo key."""
    if video_id in DEMO_VIDEOS:
        return video_id
    if video_id in YOUTUBE_TO_DEMO_MAP:
        return YOUTUBE_TO_DEMO_MAP[video_id]
    return None


def get_demo_transcript(video_id: str) -> list[dict[str, Any]]:
    """Retrieve transcript for a given video ID. Returns empty list if not a demo video."""
    key = resolve_demo_key(video_id)
    if key and key in DEMO_VIDEOS:
        return DEMO_VIDEOS[key]["transcript"]
    return []


def get_demo_video_title(video_id: str) -> str:
    """Retrieve title for a video."""
    key = resolve_demo_key(video_id)
    if key and key in DEMO_VIDEOS:
        return DEMO_VIDEOS[key]["title"]
    return f"Lecture Video ({video_id})"


def get_demo_chapters(video_id: str) -> list[Chapter]:
    """Retrieve chapter boundaries for a given video. Returns empty list if not a demo video."""
    key = resolve_demo_key(video_id)
    if key and key in DEMO_CHAPTERS:
        return DEMO_CHAPTERS[key]
    return []


def get_demo_notes(video_id: str) -> list[ChapterNotes]:
    """Retrieve structured notes for a given video. Returns empty list if not a demo video."""
    key = resolve_demo_key(video_id)
    if key and key in DEMO_NOTES:
        return DEMO_NOTES[key]
    return []


def get_demo_chapter_notes(video_id: str, chapter_id: int) -> ChapterNotes | None:
    """Retrieve notes for a specific chapter."""
    all_notes = get_demo_notes(video_id)
    for n in all_notes:
        if n.chapter_id == chapter_id:
            return n
    return None


def get_demo_quiz(video_id: str) -> list[QuizQuestion]:
    """Retrieve canonical quiz questions for a given demo video. Returns empty list if not a demo video."""
    key = resolve_demo_key(video_id)
    if key and key in DEMO_QUIZZES:
        return DEMO_QUIZZES[key]
    return []


def get_demo_question(video_id: str, question_id: int) -> QuizQuestion | None:
    """Find a specific quiz question by ID."""
    quiz = get_demo_quiz(video_id)
    for q in quiz:
        if q.id == question_id:
            return q
    return None


def get_demo_revision(video_id: str) -> RapidRevisionResponse | None:
    """Retrieve 10-minute rapid revision cheat sheet for a video. Returns None if not a demo video."""
    key = resolve_demo_key(video_id)
    if key and key in DEMO_REVISIONS:
        return DEMO_REVISIONS[key]
    return None
