/**
 * Lurnix Flashcard Service Layer.
 * 
 * Interacts with FastAPI backend `/api/flashcards` endpoints with resilient
 * offline caching and instant local responsiveness for spaced retention study.
 */

import { FlashcardDeck, FlashcardItem, FlashcardConfidence, FlashcardCategory } from '../types';
import { profileService } from './profileService';
import { formatVideoTime } from '../utils/timeFormat';

export interface CreateCardInput {
  question: string;
  answer: string;
  category: FlashcardCategory;
  chapter_title?: string;
  timestamp_sec: number;
}

export interface UpdateCardInput {
  question?: string;
  answer?: string;
  category?: FlashcardCategory;
  is_bookmarked?: boolean;
}

export interface AiAssistInput {
  video_id: string;
  deck_id?: string;
  card_id?: string;
  action: 'explain' | 'simplify' | 'analogy' | 'generate_more' | 'custom_chat';
  user_message?: string;
  current_question?: string;
  current_answer?: string;
}

export interface AiAssistResult {
  reply: string;
  suggested_question?: string;
  suggested_answer?: string;
  suggested_category?: string;
  generated_cards?: CreateCardInput[];
}

const STORAGE_KEY = 'lurnix_flashcard_decks';

// Initial local seed deck for Polymers
const SEED_POLYMERS_DECK: FlashcardDeck = {
  id: 'deck_polymers_core',
  user_id: 'usr_simona_01',
  video_id: 'demo_polymers',
  session_id: 'session-pl-04',
  title: 'Polymers & Macromolecules: Core Principles',
  description: 'Grounded flashcards covering monomer chemistry, polymerization mechanisms, synthetic elastomers, and cross-linking kinetics.',
  card_count: 18,
  mastered_count: 4,
  created_at: Date.now() - 3 * 86400 * 1000,
  updated_at: Date.now(),
  cards: [
    {
      id: 'c_poly_01',
      deck_id: 'deck_polymers_core',
      question: 'What is the fundamental definition of a monomer in polymer chemistry?',
      answer: 'A monomer is a small, reactive molecule that can undergo chemical reactions with other monomers to form a repeating structural unit within a high-molecular-weight polymer chain.',
      category: 'Definition',
      chapter_title: 'Introduction to Polymers',
      timestamp_sec: 45.0,
      timestamp_formatted: '00:45',
      confidence: 'very_confident',
      is_bookmarked: true,
      review_count: 3,
      order_index: 0,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_02',
      deck_id: 'deck_polymers_core',
      question: 'What distinguishes natural polymers from synthetic polymers?',
      answer: 'Natural polymers (DNA, cellulose, proteins) are synthesized biologically by living organisms, whereas synthetic polymers (polyethylene, nylon, Teflon) are manufactured industrially via petrochemistry.',
      category: 'Concept',
      chapter_title: 'Introduction to Polymers',
      timestamp_sec: 120.0,
      timestamp_formatted: '02:00',
      confidence: 'somewhat_confident',
      is_bookmarked: false,
      review_count: 2,
      order_index: 1,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_03',
      deck_id: 'deck_polymers_core',
      question: 'How does Degree of Polymerization (DP) relate monomer mass to total polymer mass?',
      answer: 'DP represents the number of repeating monomer units: M_polymer = DP × M_monomer. Higher DP significantly increases tensile strength, viscosity, and melting point.',
      category: 'Formula',
      chapter_title: 'Introduction to Polymers',
      timestamp_sec: 195.0,
      timestamp_formatted: '03:15',
      confidence: 'unreviewed',
      is_bookmarked: false,
      review_count: 0,
      order_index: 2,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_04',
      deck_id: 'deck_polymers_core',
      question: 'What structural property makes macromolecules exhibit viscoelasticity?',
      answer: 'Macromolecules have long, entangled molecular chains. Under sudden stress they behave like elastic solids, but under sustained load the chains slide past each other, exhibiting viscous flow.',
      category: 'Important Fact',
      chapter_title: 'Introduction to Polymers',
      timestamp_sec: 270.0,
      timestamp_formatted: '04:30',
      confidence: 'not_confident',
      is_bookmarked: true,
      review_count: 1,
      order_index: 3,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_05',
      deck_id: 'deck_polymers_core',
      question: 'What is the key mechanistic difference between addition and condensation polymerization?',
      answer: 'Addition (chain-growth) polymerization involves opening double bonds without forming any by-products. Condensation (step-growth) links bifunctional monomers with the elimination of small molecules like H2O or HCl.',
      category: 'Concept',
      chapter_title: 'Addition vs Condensation Polymerization',
      timestamp_sec: 340.0,
      timestamp_formatted: '05:40',
      confidence: 'very_confident',
      is_bookmarked: false,
      review_count: 4,
      order_index: 4,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_06',
      deck_id: 'deck_polymers_core',
      question: 'What are the three core kinetic stages of free-radical addition polymerization?',
      answer: '1. Initiation (homolytic cleavage of initiator to form free radicals)\n2. Propagation (rapid radical addition to monomer double bonds)\n3. Termination (combination or disproportionation of radical chains)',
      category: 'Concept',
      chapter_title: 'Addition vs Condensation Polymerization',
      timestamp_sec: 420.0,
      timestamp_formatted: '07:00',
      confidence: 'somewhat_confident',
      is_bookmarked: true,
      review_count: 2,
      order_index: 5,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_07',
      deck_id: 'deck_polymers_core',
      question: 'What role does Benzoyl Peroxide play in free-radical polymerization?',
      answer: 'Benzoyl peroxide acts as a thermal initiator: upon heating to ~80°C, the weak O-O peroxy bond breaks homolytically to generate benzoyloxy and phenyl radicals that attack alkene monomers.',
      category: 'Important Fact',
      chapter_title: 'Addition vs Condensation Polymerization',
      timestamp_sec: 510.0,
      timestamp_formatted: '08:30',
      confidence: 'very_confident',
      is_bookmarked: false,
      review_count: 3,
      order_index: 6,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_08',
      deck_id: 'deck_polymers_core',
      question: 'What condition is strictly required for monomers to undergo condensation polymerization?',
      answer: 'Monomers must possess at least two reactive functional groups (bifunctional or polyfunctional), such as dicarboxylic acids and diamines/diols (e.g., adipic acid + hexamethylenediamine -> Nylon 6,6).',
      category: 'Definition',
      chapter_title: 'Addition vs Condensation Polymerization',
      timestamp_sec: 590.0,
      timestamp_formatted: '09:50',
      confidence: 'unreviewed',
      is_bookmarked: false,
      review_count: 0,
      order_index: 7,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_09',
      deck_id: 'deck_polymers_core',
      question: 'Why do condensation polymers generally have lower molecular weights than addition polymers?',
      answer: 'Condensation follows step-growth kinetics where high molecular weight is achieved only at extremely high conversion rates (>99%), whereas addition forms high-MW chains immediately in early stages.',
      category: 'Important Fact',
      chapter_title: 'Addition vs Condensation Polymerization',
      timestamp_sec: 670.0,
      timestamp_formatted: '11:10',
      confidence: 'not_confident',
      is_bookmarked: false,
      review_count: 1,
      order_index: 8,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_10',
      deck_id: 'deck_polymers_core',
      question: 'What is the mathematical difference between Number-Average (Mn) and Weight-Average (Mw) molecular weights?',
      answer: 'Mn = Σ(Ni·Mi) / Σ(Ni) based on mole fraction.\nMw = Σ(Ni·Mi²) / Σ(Ni·Mi) weighted toward larger molecules. Mw is always ≥ Mn in polydisperse systems.',
      category: 'Formula',
      chapter_title: 'Molecular Weight & Structural Architecture',
      timestamp_sec: 750.0,
      timestamp_formatted: '12:30',
      confidence: 'unreviewed',
      is_bookmarked: true,
      review_count: 0,
      order_index: 9,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_11',
      deck_id: 'deck_polymers_core',
      question: 'What is Polydispersity Index (PDI) and what does PDI = 1.0 signify?',
      answer: 'PDI = Mw / Mn. A PDI equal to 1.0 indicates a perfectly monodisperse polymer where all individual chains have identical lengths (common in natural proteins, rare in synthetic polymers).',
      category: 'Definition',
      chapter_title: 'Molecular Weight & Structural Architecture',
      timestamp_sec: 830.0,
      timestamp_formatted: '13:50',
      confidence: 'somewhat_confident',
      is_bookmarked: false,
      review_count: 2,
      order_index: 10,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_12',
      deck_id: 'deck_polymers_core',
      question: 'How does polymer branching affect polymer density and crystallinity?',
      answer: 'High branching (e.g., LDPE) prevents chains from packing closely, reducing crystallinity and density. Linear polymers (e.g., HDPE) pack tightly into ordered crystal lattices, increasing rigidity and melting point.',
      category: 'Concept',
      chapter_title: 'Molecular Weight & Structural Architecture',
      timestamp_sec: 915.0,
      timestamp_formatted: '15:15',
      confidence: 'unreviewed',
      is_bookmarked: false,
      review_count: 0,
      order_index: 11,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_13',
      deck_id: 'deck_polymers_core',
      question: 'What is cross-linking and how does it transform a thermoplastic into a thermoset?',
      answer: 'Cross-linking creates covalent bonds between adjacent polymer chains, forming a continuous 3D network. This permanently locks the chains in place, preventing melting upon reheating (thermosetting).',
      category: 'Concept',
      chapter_title: 'Molecular Weight & Structural Architecture',
      timestamp_sec: 995.0,
      timestamp_formatted: '16:35',
      confidence: 'somewhat_confident',
      is_bookmarked: false,
      review_count: 1,
      order_index: 12,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_14',
      deck_id: 'deck_polymers_core',
      question: 'What chemical process occurs during the vulcanization of natural rubber?',
      answer: 'Sulfur is heated with polyisoprene at ~140°C in the presence of zinc oxide accelerators. Sulfur forms disulfide (-S-S-) cross-links across allylic positions, transforming sticky latex into durable, elastic rubber.',
      category: 'Concept',
      chapter_title: 'Industrial Applications & Vulcanization',
      timestamp_sec: 1060.0,
      timestamp_formatted: '17:40',
      confidence: 'very_confident',
      is_bookmarked: true,
      review_count: 5,
      order_index: 13,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_15',
      deck_id: 'deck_polymers_core',
      question: 'What is the Glass Transition Temperature (Tg) and why is it critical for polymer engineering?',
      answer: 'Tg is the temperature range where an amorphous polymer transitions from a hard, brittle "glassy" state to a flexible, compliant "rubbery" state. Rubber must operate above its Tg, while polystyrene operates below its Tg.',
      category: 'Definition',
      chapter_title: 'Industrial Applications & Vulcanization',
      timestamp_sec: 1130.0,
      timestamp_formatted: '18:50',
      confidence: 'not_confident',
      is_bookmarked: false,
      review_count: 2,
      order_index: 14,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_16',
      deck_id: 'deck_polymers_core',
      question: 'What is the chemical repeating unit of Polyethylene Terephthalate (PET)?',
      answer: '[-CO-C6H4-CO-O-CH2-CH2-O-]n, produced by esterification of terephthalic acid with ethylene glycol, widely used in recyclable beverage containers and polyester synthetic fibers.',
      category: 'Formula',
      chapter_title: 'Industrial Applications & Vulcanization',
      timestamp_sec: 1190.0,
      timestamp_formatted: '19:50',
      confidence: 'unreviewed',
      is_bookmarked: false,
      review_count: 0,
      order_index: 15,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_17',
      deck_id: 'deck_polymers_core',
      question: 'What environmental degradation mechanism challenges non-biodegradable synthetic polymers?',
      answer: 'Most synthetic polymers possess non-polar carbon-carbon backbones resistant to microbial enzymatic breakdown and moisture, requiring high-energy UV photodegradation that leads to persistent microplastics.',
      category: 'Important Fact',
      chapter_title: 'Industrial Applications & Vulcanization',
      timestamp_sec: 1260.0,
      timestamp_formatted: '21:00',
      confidence: 'unreviewed',
      is_bookmarked: false,
      review_count: 0,
      order_index: 16,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
    {
      id: 'c_poly_18',
      deck_id: 'deck_polymers_core',
      question: 'What makes conductive polymers like Polyacetylene capable of carrying electrical current?',
      answer: 'Polyacetylene has an alternating single and double bond conjugated pi-electron system along its backbone. When chemically doped with iodine or arsenic pentafluoride, mobile polarons and solitons conduct electricity.',
      category: 'Important Fact',
      chapter_title: 'Industrial Applications & Vulcanization',
      timestamp_sec: 1320.0,
      timestamp_formatted: '22:00',
      confidence: 'somewhat_confident',
      is_bookmarked: false,
      review_count: 1,
      order_index: 17,
      created_at: Date.now() - 3 * 86400 * 1000,
    },
  ],
};

class FlashcardService {
  private apiBase: string;

  constructor() {
    this.apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.ensureLocalCache();
  }

  private getAuthHeaders(): Record<string, string> {
    const token = typeof localStorage !== 'undefined'
      ? localStorage.getItem('lurnix_auth_token') || 'lurnix_demo_token_simona'
      : 'lurnix_demo_token_simona';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private ensureLocalCache(): FlashcardDeck[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}

    const initial = [SEED_POLYMERS_DECK];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {}
    return initial;
  }

  private saveLocalDecks(decks: FlashcardDeck[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    } catch (e) {}
  }

  /**
   * Retrieves all flashcard decks.
   */
  async getDecks(): Promise<FlashcardDeck[]> {
    try {
      const res = await fetch(`${this.apiBase}/api/flashcards/decks`, {
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.saveLocalDecks(data);
          return data;
        }
      }
    } catch (e) {
      console.warn('Backend flashcards offline, using cached decks');
    }
    return this.ensureLocalCache();
  }

  /**
   * Retrieves single deck with cards.
   */
  async getDeckById(deckId: string): Promise<FlashcardDeck | null> {
    try {
      const res = await fetch(`${this.apiBase}/api/flashcards/decks/${deckId}`, {
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        const deck = await res.json();
        // Update local cache
        const local = this.ensureLocalCache();
        const updated = local.map((d) => (d.id === deck.id ? deck : d));
        this.saveLocalDecks(updated);
        return deck;
      }
    } catch (e) {}

    const local = this.ensureLocalCache();
    return local.find((d) => d.id === deckId) || null;
  }

  /**
   * Fetches or automatically generates a deck for the given video.
   */
  async getOrCreateDeckForVideo(videoId: string, sessionId?: string): Promise<FlashcardDeck> {
    try {
      const res = await fetch(`${this.apiBase}/api/flashcards/video/${encodeURIComponent(videoId)}${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''}`, {
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        const deck = await res.json();
        return deck;
      }
    } catch (e) {}

    // Fallback: check local cache or generate
    const local = this.ensureLocalCache();
    const existing = local.find((d) => d.video_id === videoId);
    if (existing) return existing;

    // Generate local deck
    const newDeck: FlashcardDeck = {
      ...SEED_POLYMERS_DECK,
      id: `deck_${videoId}_${Date.now()}`,
      video_id: videoId,
      session_id: sessionId,
      title: `Study Deck: ${videoId}`,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    local.push(newDeck);
    this.saveLocalDecks(local);
    return newDeck;
  }

  /**
   * Generates a fresh deck for a video.
   */
  async generateDeck(videoId: string, title?: string, targetCount: number = 18): Promise<FlashcardDeck> {
    try {
      const res = await fetch(`${this.apiBase}/api/flashcards/generate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          video_id: videoId,
          title,
          target_count: targetCount,
        }),
      });
      if (res.ok) {
        const deck = await res.json();
        const local = this.ensureLocalCache();
        local.unshift(deck);
        this.saveLocalDecks(local);
        return deck;
      }
    } catch (e) {}

    // Local fallback
    return this.getOrCreateDeckForVideo(videoId);
  }

  /**
   * Submits confidence review for a card ('not_confident', 'somewhat_confident', 'very_confident').
   */
  async reviewCard(cardId: string, confidence: FlashcardConfidence): Promise<FlashcardItem | null> {
    try {
      const res = await fetch(`${this.apiBase}/api/flashcards/cards/${cardId}/review`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ confidence }),
      });
      if (res.ok) {
        const updated = await res.json();
        this.updateCardInLocalCache(updated);
        return updated;
      }
    } catch (e) {}

    // Local fallback
    const local = this.ensureLocalCache();
    for (const d of local) {
      const card = d.cards.find((c) => c.id === cardId);
      if (card) {
        card.confidence = confidence;
        card.review_count += 1;
        card.last_reviewed_at = Date.now();
        d.mastered_count = d.cards.filter((c) => c.confidence === 'very_confident').length;
        this.saveLocalDecks(local);
        return card;
      }
    }
    return null;
  }

  /**
   * Toggles card bookmark status.
   */
  async toggleBookmark(cardId: string): Promise<FlashcardItem | null> {
    try {
      const res = await fetch(`${this.apiBase}/api/flashcards/cards/${cardId}/bookmark`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        const updated = await res.json();
        this.updateCardInLocalCache(updated);
        return updated;
      }
    } catch (e) {}

    // Local fallback
    const local = this.ensureLocalCache();
    for (const d of local) {
      const card = d.cards.find((c) => c.id === cardId);
      if (card) {
        card.is_bookmarked = !card.is_bookmarked;
        this.saveLocalDecks(local);
        return card;
      }
    }
    return null;
  }

  /**
   * Updates an existing card (question, answer, category).
   */
  async updateCard(cardId: string, input: UpdateCardInput): Promise<FlashcardItem | null> {
    try {
      const res = await fetch(`${this.apiBase}/api/flashcards/cards/${cardId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const updated = await res.json();
        this.updateCardInLocalCache(updated);
        return updated;
      }
    } catch (e) {}

    // Local fallback
    const local = this.ensureLocalCache();
    for (const d of local) {
      const card = d.cards.find((c) => c.id === cardId);
      if (card) {
        if (input.question !== undefined) card.question = input.question;
        if (input.answer !== undefined) card.answer = input.answer;
        if (input.category !== undefined) card.category = input.category;
        if (input.is_bookmarked !== undefined) card.is_bookmarked = input.is_bookmarked;
        this.saveLocalDecks(local);
        return card;
      }
    }
    return null;
  }

  /**
   * Adds a new card to a deck.
   */
  async addCard(deckId: string, input: CreateCardInput): Promise<FlashcardItem | null> {
    try {
      const res = await fetch(`${this.apiBase}/api/flashcards/decks/${deckId}/cards`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const newCard = await res.json();
        // Insert into local cache
        const local = this.ensureLocalCache();
        const deck = local.find((d) => d.id === deckId);
        if (deck) {
          deck.cards.push(newCard);
          deck.card_count = deck.cards.length;
          this.saveLocalDecks(local);
        }
        return newCard;
      }
    } catch (e) {}

    // Local fallback
    const local = this.ensureLocalCache();
    const deck = local.find((d) => d.id === deckId);
    if (deck) {
      const newCard: FlashcardItem = {
        id: `c_${Date.now()}`,
        deck_id: deckId,
        question: input.question,
        answer: input.answer,
        category: input.category,
        chapter_title: input.chapter_title || 'Custom Addition',
        timestamp_sec: input.timestamp_sec,
        timestamp_formatted: formatVideoTime(input.timestamp_sec),
        confidence: 'unreviewed',
        is_bookmarked: false,
        review_count: 0,
        order_index: deck.cards.length,
        created_at: Date.now(),
      };
      deck.cards.push(newCard);
      deck.card_count = deck.cards.length;
      this.saveLocalDecks(local);
      return newCard;
    }
    return null;
  }

  /**
   * Deletes a card from a deck.
   */
  async deleteCard(cardId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBase}/api/flashcards/cards/${cardId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        this.removeCardFromLocalCache(cardId);
        return true;
      }
    } catch (e) {}

    this.removeCardFromLocalCache(cardId);
    return true;
  }

  /**
   * Restarts confidence review for all cards in a deck.
   */
  async restartDeck(deckId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBase}/api/flashcards/decks/${deckId}/restart`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      if (res.ok) {
        // update local cache
        const local = this.ensureLocalCache();
        const deck = local.find((d) => d.id === deckId);
        if (deck) {
          deck.cards.forEach((c) => (c.confidence = 'unreviewed'));
          deck.mastered_count = 0;
          this.saveLocalDecks(local);
        }
        return true;
      }
    } catch (e) {}

    const local = this.ensureLocalCache();
    const deck = local.find((d) => d.id === deckId);
    if (deck) {
      deck.cards.forEach((c) => (c.confidence = 'unreviewed'));
      deck.mastered_count = 0;
      this.saveLocalDecks(local);
    }
    return true;
  }

  /**
   * AI Tutoring: explain, simplify, analogy, or generate more.
   */
  async aiAssist(input: AiAssistInput): Promise<AiAssistResult> {
    try {
      const res = await fetch(`${this.apiBase}/api/flashcards/ai-assist`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(input),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    // Local fallback heuristic response
    if (input.action === 'simplify') {
      return {
        reply: `**Simplified Concept:**\n\nIn plain words: ${input.current_question || 'this concept'} explains that foundational sub-units bond in a repeating sequence to build durable structural networks.\n\nTakeaway: Small identical parts unite to form strong, functional wholes.`,
        suggested_question: input.current_question,
        suggested_answer: input.current_answer,
        suggested_category: 'Concept',
      };
    } else if (input.action === 'analogy') {
      return {
        reply: `💡 **Everyday Analogy:**\n\nThink of ${input.current_question || 'this concept'} like linking individual paperclips into a chain: individually they are tiny and loose, but hooked together they create a long, flexible ribbon. Adding cross-links is like securing them with zip ties so they can't slip apart!`,
        suggested_question: `Analogy for ${input.current_question || 'concept'}`,
        suggested_answer: 'Individual clips hooked into chains, locked with cross-links into an elastic structure.',
        suggested_category: 'Concept',
      };
    } else if (input.action === 'generate_more') {
      return {
        reply: 'Generated 2 additional exam-focused study cards grounded in this lecture segment!',
        generated_cards: [
          {
            question: `What is the key experimental verification for ${input.current_question?.slice(0, 40) || 'this topic'}?`,
            answer: 'Differential Scanning Calorimetry (DSC) and Gel Permeation Chromatography (GPC) to verify thermal transitions and molar mass.',
            category: 'Important Fact',
            timestamp_sec: 450.0,
          },
          {
            question: `What governing kinetic parameter dictates the yield of ${input.current_question?.slice(0, 40) || 'this process'}?`,
            answer: 'The ratio of propagation rate to termination rate (kp / kt), heavily influenced by reaction temperature and initiator purity.',
            category: 'Formula',
            timestamp_sec: 720.0,
          },
        ],
      };
    } else {
      return {
        reply: `Regarding **"${input.current_question || 'this card'}"**:\n\n${input.current_answer || 'This principle connects fundamental chemical structure to macroscopic material properties.'}\n\nKey exam tip: Pay attention to the distinction between kinetic control and thermodynamic stability!`,
      };
    }
  }

  private updateCardInLocalCache(card: FlashcardItem): void {
    const local = this.ensureLocalCache();
    for (const d of local) {
      const idx = d.cards.findIndex((c) => c.id === card.id);
      if (idx !== -1) {
        d.cards[idx] = card;
        d.mastered_count = d.cards.filter((c) => c.confidence === 'very_confident').length;
        this.saveLocalDecks(local);
        break;
      }
    }
  }

  private removeCardFromLocalCache(cardId: string): void {
    const local = this.ensureLocalCache();
    for (const d of local) {
      const idx = d.cards.findIndex((c) => c.id === cardId);
      if (idx !== -1) {
        d.cards.splice(idx, 1);
        d.card_count = d.cards.length;
        d.mastered_count = d.cards.filter((c) => c.confidence === 'very_confident').length;
        this.saveLocalDecks(local);
        break;
      }
    }
  }
}

export const flashcardService = new FlashcardService();
