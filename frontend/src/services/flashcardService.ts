/**
 * Lurnix Flashcard Service Layer.
 * 
 * Interacts with FastAPI backend `/api/flashcards` endpoints with resilient
 * offline caching and instant local responsiveness for spaced retention study.
 */

import { FlashcardDeck, FlashcardItem, FlashcardConfidence, FlashcardCategory } from '../types';
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

const STORAGE_KEY = 'lurnix_flashcard_decks_v3';

class FlashcardService {
  private apiBase: string;

  constructor() {
    this.apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.ensureLocalCache();
  }

  private getAuthHeaders(): Record<string, string> {
    const token = typeof localStorage !== 'undefined'
      ? localStorage.getItem('lurnix_auth_token') || 'lurnix_auth_token_default'
      : 'lurnix_auth_token_default';
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

    const initial: FlashcardDeck[] = [];
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
        if (Array.isArray(data)) {
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

    // Generate clean local deck
    const newDeck: FlashcardDeck = {
      id: `deck_${videoId}_${Date.now()}`,
      user_id: 'usr_default',
      video_id: videoId,
      session_id: sessionId,
      title: `Study Deck: ${videoId}`,
      description: 'Interactive flashcards for this lecture.',
      card_count: 0,
      mastered_count: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      cards: [],
    };
    local.push(newDeck);
    this.saveLocalDecks(local);
    return newDeck;
  }

  /**
   * Generates a fresh deck for a video.
   */
  async generateDeck(videoId: string, title?: string, targetCount: number = 10): Promise<FlashcardDeck> {
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

    const local = this.ensureLocalCache();
    const deck = local.find((d) => d.id === deckId);
    if (deck) {
      const newCard: FlashcardItem = {
        id: `c_${Date.now()}`,
        deck_id: deckId,
        question: input.question,
        answer: input.answer,
        category: input.category,
        chapter_title: input.chapter_title || 'General',
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

    // Clean neutral fallback responses
    if (input.action === 'simplify') {
      return {
        reply: `**Simplified Concept:**\n\n${input.current_answer || 'This concept explains key principles from the lecture in straightforward terms.'}`,
        suggested_question: input.current_question,
        suggested_answer: input.current_answer,
        suggested_category: 'Concept',
      };
    } else if (input.action === 'analogy') {
      return {
        reply: `💡 **Everyday Analogy:**\n\nThink of ${input.current_question || 'this concept'} like foundational building blocks: each individual piece provides structure, and when connected in sequence, they form a robust system.`,
        suggested_question: `Analogy for: ${input.current_question || 'Topic'}`,
        suggested_answer: 'Modular components working together in an interconnected sequence.',
        suggested_category: 'Concept',
      };
    } else if (input.action === 'generate_more') {
      return {
        reply: 'Generated an additional study card grounded in this topic.',
        generated_cards: [
          {
            question: `What is the core principle behind ${input.current_question || 'this topic'}?`,
            answer: input.current_answer || 'Key foundational concept from this lecture.',
            category: 'Important Fact',
            timestamp_sec: 0,
          },
        ],
      };
    } else {
      return {
        reply: `Regarding **"${input.current_question || 'this card'}"**:\n\n${input.current_answer || 'Review this key takeaway from your lecture.'}`,
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
