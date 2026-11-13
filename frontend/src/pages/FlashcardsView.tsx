import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  RotateCcw,
  Shuffle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Play,
  Check,
  BookOpen,
  Plus,
  Clock,
  Edit3,
  Trash2,
  Send,
  Lightbulb,
  Layers,
  Flame,
  CheckCircle2,
  X,
  Volume2,
  Video,
  CornerDownLeft,
  Filter,
} from 'lucide-react';
import { useLearning } from '../contexts/LearningContext';
import {
  flashcardService,
  CreateCardInput,
  AiAssistResult,
} from '../services/flashcardService';
import {
  FlashcardDeck,
  FlashcardItem,
  FlashcardCategory,
  FlashcardConfidence,
} from '../types';

export const FlashcardsView: React.FC = () => {
  const {
    activeSession,
    seekTo,
    setActiveNavView,
    sessions,
  } = useLearning();

  // Decks & active card state
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState<boolean>(false);

  // AI Chat & Sidebar state
  const [aiInput, setAiInput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiMessages, setAiMessages] = useState<
    Array<{
      id: string;
      sender: 'user' | 'ai';
      text: string;
      actionProposal?: {
        type: 'edit' | 'new_cards';
        card?: CreateCardInput;
        cards?: CreateCardInput[];
      };
    }>
  >([
    {
      id: 'msg-init',
      sender: 'ai',
      text: `Hello! I'm your AI Study Companion for **${activeSession.title}**. Ask me to simplify any card, give an analogy, or generate more questions grounded in this lecture.`,
    },
  ]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [generateCount, setGenerateCount] = useState<number>(18);
  const [isGeneratingMore, setIsGeneratingMore] = useState<boolean>(false);

  // Form states for adding/editing cards
  const [cardFormQuestion, setCardFormQuestion] = useState<string>('');
  const [cardFormAnswer, setCardFormAnswer] = useState<string>('');
  const [cardFormCategory, setCardFormCategory] = useState<FlashcardCategory>('Concept');
  const [cardFormChapter, setCardFormChapter] = useState<string>('');
  const [cardFormTimestamp, setCardFormTimestamp] = useState<number>(0);

  // Text to speech
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load decks on mount or session change
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const videoId = (activeSession as any).videoId || activeSession.videoUrl || activeSession.id || '';

    flashcardService
      .getOrCreateDeckForVideo(videoId, activeSession.id)
      .then((deck) => {
        if (!mounted) return;
        setActiveDeck(deck);
        return flashcardService.getDecks();
      })
      .then((allDecks) => {
        if (!mounted || !allDecks) return;
        setDecks(allDecks);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load flashcard deck:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeSession.id]);

  // Scroll AI chat to bottom when messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, aiLoading]);

  // Filtered cards list
  const filteredCards = useMemo(() => {
    if (!activeDeck || !activeDeck.cards) return [];
    return activeDeck.cards.filter((card) => {
      if (categoryFilter !== 'all' && card.category !== categoryFilter) return false;
      if (confidenceFilter !== 'all') {
        if (confidenceFilter === 'needs_review' && card.confidence === 'very_confident') return false;
        if (confidenceFilter === 'mastered' && card.confidence !== 'very_confident') return false;
        if (confidenceFilter === 'unreviewed' && card.confidence !== 'unreviewed') return false;
      }
      if (bookmarkedOnly && !card.is_bookmarked) return false;
      return true;
    });
  }, [activeDeck, categoryFilter, confidenceFilter, bookmarkedOnly]);

  // Current active card
  const currentCard = useMemo(() => {
    if (filteredCards.length === 0) return null;
    const safeIdx = Math.min(currentCardIndex, filteredCards.length - 1);
    return filteredCards[safeIdx] || null;
  }, [filteredCards, currentCardIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextCard();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key === '1') {
        handleConfidenceSelect('not_confident');
      } else if (e.key === '2') {
        handleConfidenceSelect('somewhat_confident');
      } else if (e.key === '3') {
        handleConfidenceSelect('very_confident');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCards.length, currentCardIndex, isFlipped, currentCard]);

  // Navigation handlers
  const handleNextCard = () => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrevCard = () => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleShuffleCards = () => {
    if (!activeDeck) return;
    const shuffled = [...activeDeck.cards].sort(() => Math.random() - 0.5);
    setActiveDeck({
      ...activeDeck,
      cards: shuffled,
    });
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleRestartDeck = async () => {
    if (!activeDeck) return;
    await flashcardService.restartDeck(activeDeck.id);
    const refreshed = await flashcardService.getDeckById(activeDeck.id);
    if (refreshed) {
      setActiveDeck(refreshed);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!currentCard) return;
    const updated = await flashcardService.toggleBookmark(currentCard.id);
    if (updated && activeDeck) {
      const newCards = activeDeck.cards.map((c) => (c.id === updated.id ? updated : c));
      setActiveDeck({ ...activeDeck, cards: newCards });
    }
  };

  // Confidence Rating submission
  const handleConfidenceSelect = async (confidence: FlashcardConfidence) => {
    if (!currentCard || !activeDeck) return;
    const updated = await flashcardService.reviewCard(currentCard.id, confidence);
    if (updated) {
      const newCards = activeDeck.cards.map((c) => (c.id === updated.id ? updated : c));
      const mastered = newCards.filter((c) => c.confidence === 'very_confident').length;
      setActiveDeck({
        ...activeDeck,
        cards: newCards,
        mastered_count: mastered,
      });

      // Smoothly advance to next card after selecting confidence
      setTimeout(() => {
        handleNextCard();
      }, 200);
    }
  };

  // Timestamp Seeking: seeks YouTube video and switches view to lecture
  const handleTimestampClick = (sec: number) => {
    seekTo(sec);
    setActiveNavView('practice');
  };

  // Text to speech for card pronunciation
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (isSpeaking) {
        setIsSpeaking(false);
        return;
      }
      setIsSpeaking(true);
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
    }
  };

  // AI Tutoring & Contextual Chat
  const handleAiAction = async (action: 'explain' | 'simplify' | 'analogy' | 'generate_more') => {
    if (!currentCard) return;
    setAiLoading(true);

    const actionLabels = {
      explain: 'Explain this in depth',
      simplify: 'Simplify wording',
      analogy: 'Give me an analogy',
      generate_more: 'Generate more questions on this topic',
    };

    const userMsg = actionLabels[action];
    setAiMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text: userMsg },
    ]);

    try {
      const res: AiAssistResult = await flashcardService.aiAssist({
        video_id: (activeSession as any).videoId || activeSession.videoUrl || activeSession.id || '',
        deck_id: activeDeck?.id,
        card_id: currentCard.id,
        action,
        current_question: currentCard.question,
        current_answer: currentCard.answer,
      });

      let proposal = undefined;
      if (action === 'simplify' && res.suggested_answer) {
        proposal = {
          type: 'edit' as const,
          card: {
            question: res.suggested_question || currentCard.question,
            answer: res.suggested_answer,
            category: currentCard.category,
            timestamp_sec: currentCard.timestamp_sec,
          },
        };
      } else if (action === 'generate_more' && res.generated_cards && res.generated_cards.length > 0) {
        proposal = {
          type: 'new_cards' as const,
          cards: res.generated_cards,
        };
      }

      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.reply,
          actionProposal: proposal,
        },
      ]);
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'I encountered an error preparing that explanation. Please try again.',
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCustomAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const msg = aiInput.trim();
    setAiInput('');
    setAiLoading(true);

    setAiMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text: msg },
    ]);

    try {
      const res = await flashcardService.aiAssist({
        video_id: (activeSession as any).videoId || activeSession.videoUrl || activeSession.id || '',
        deck_id: activeDeck?.id,
        card_id: currentCard?.id,
        action: 'custom_chat',
        user_message: msg,
        current_question: currentCard?.question,
        current_answer: currentCard?.answer,
      });

      setAiMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, sender: 'ai', text: res.reply },
      ]);
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, sender: 'ai', text: 'Error connecting to AI study tutor.' },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Add AI-suggested cards to deck
  const handleApplyAiCards = async (cards: CreateCardInput[]) => {
    if (!activeDeck) return;
    for (const c of cards) {
      await flashcardService.addCard(activeDeck.id, c);
    }
    const refreshed = await flashcardService.getDeckById(activeDeck.id);
    if (refreshed) {
      setActiveDeck(refreshed);
      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `✓ Added ${cards.length} new cards to "${activeDeck.title}"!`,
        },
      ]);
    }
  };

  // Apply AI-suggested edit to current card
  const handleApplyAiEdit = async (cardData: CreateCardInput) => {
    if (!currentCard || !activeDeck) return;
    const updated = await flashcardService.updateCard(currentCard.id, {
      question: cardData.question,
      answer: cardData.answer,
    });
    if (updated) {
      const newCards = activeDeck.cards.map((c) => (c.id === updated.id ? updated : c));
      setActiveDeck({ ...activeDeck, cards: newCards });
      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `✓ Card successfully updated with simplified explanation!`,
        },
      ]);
    }
  };

  // Custom Card Add Handler
  const handleCreateCustomCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeck || !cardFormQuestion.trim() || !cardFormAnswer.trim()) return;

    const newCard = await flashcardService.addCard(activeDeck.id, {
      question: cardFormQuestion.trim(),
      answer: cardFormAnswer.trim(),
      category: cardFormCategory,
      chapter_title: cardFormChapter.trim() || activeSession.topic || 'General Concepts',
      timestamp_sec: cardFormTimestamp || 0,
    });

    if (newCard) {
      const refreshed = await flashcardService.getDeckById(activeDeck.id);
      if (refreshed) {
        setActiveDeck(refreshed);
        setCurrentCardIndex(refreshed.cards.length - 1);
      }
      setIsAddModalOpen(false);
      setCardFormQuestion('');
      setCardFormAnswer('');
      setCardFormTimestamp(0);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = () => {
    if (!currentCard) return;
    setCardFormQuestion(currentCard.question);
    setCardFormAnswer(currentCard.answer);
    setCardFormCategory(currentCard.category);
    setCardFormChapter(currentCard.chapter_title || '');
    setCardFormTimestamp(currentCard.timestamp_sec);
    setIsEditModalOpen(true);
  };

  // Save Card Edit
  const handleSaveCardEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard || !activeDeck) return;

    const updated = await flashcardService.updateCard(currentCard.id, {
      question: cardFormQuestion.trim(),
      answer: cardFormAnswer.trim(),
      category: cardFormCategory,
    });

    if (updated) {
      const newCards = activeDeck.cards.map((c) => (c.id === updated.id ? updated : c));
      setActiveDeck({ ...activeDeck, cards: newCards });
      setIsEditModalOpen(false);
    }
  };

  // Delete Current Card
  const handleDeleteCurrentCard = async () => {
    if (!currentCard || !activeDeck) return;
    if (!confirm('Are you sure you want to delete this flashcard?')) return;

    await flashcardService.deleteCard(currentCard.id);
    const refreshed = await flashcardService.getDeckById(activeDeck.id);
    if (refreshed) {
      setActiveDeck(refreshed);
      setCurrentCardIndex((prev) => Math.max(0, Math.min(prev, refreshed.cards.length - 1)));
      setIsFlipped(false);
    }
  };

  // Generate Fresh / More Deck
  const handleGenerateFreshDeck = async () => {
    setIsGeneratingMore(true);
    const videoId = (activeSession as any).videoId || activeSession.videoUrl || activeSession.id || '';
    try {
      const newDeck = await flashcardService.generateDeck(videoId, activeSession.title, generateCount);
      setActiveDeck(newDeck);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setIsGenerateModalOpen(false);
      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `✨ Generated fresh study deck with ${newDeck.cards.length} cards grounded in **${activeSession.title}**!`,
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingMore(false);
    }
  };

  // Category Badge Colors
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Definition':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Concept':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Formula':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Important Fact':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Progress metrics
  const totalDeckCards = activeDeck?.cards?.length || 0;
  const masteredCards = activeDeck?.mastered_count || 0;
  const progressPercent = totalDeckCards > 0 ? Math.round((masteredCards / totalDeckCards) * 100) : 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50/60 p-8">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading AI Flashcard Deck...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50/50">
      {/* =========================================================================
          LEFT / CENTER: Main Flashcard Study Area
         ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 md:px-8 py-5 border-r border-slate-200/60">
        {/* Top Header: Deck Title, Course Badge, Video Context */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center space-x-1">
                <Layers className="w-3 h-3" />
                <span>AI Study Deck</span>
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">{activeSession.code}</span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>{activeDeck?.title || activeSession.title}</span>
            </h1>
          </div>

          {/* Top Actions: Return to Video, Restart, Shuffle, New Card */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setActiveNavView('practice')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Return to Video Lecture"
            >
              <Video className="w-3.5 h-3.5 text-indigo-600" />
              <span>Back to Video</span>
            </button>

            <button
              onClick={handleRestartDeck}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Reset confidence and restart deck"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restart</span>
            </button>

            <button
              onClick={handleShuffleCards}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Shuffle cards order"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shuffle</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Card</span>
            </button>

            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Regenerate Deck</span>
            </button>
          </div>
        </div>

        {/* Filter Bar: Category, Confidence, Bookmarked */}
        <div className="flex items-center justify-between py-3 flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-slate-400 flex items-center space-x-1 mr-1">
              <Filter className="w-3 h-3" />
              <span className="text-[10px] uppercase font-bold">Category:</span>
            </span>
            {['all', 'Definition', 'Concept', 'Formula', 'Important Fact'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  setCurrentCardIndex(0);
                  setIsFlipped(false);
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Types' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setBookmarkedOnly((prev) => !prev);
                setCurrentCardIndex(0);
                setIsFlipped(false);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center space-x-1 border transition-colors cursor-pointer ${
                bookmarkedOnly
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3 h-3 ${bookmarkedOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>Starred</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            CARD STAGE: Centered Large Interactive Flashcard
           ===================================================================== */}
        <div className="flex-1 flex flex-col items-center justify-center my-4 max-w-3xl w-full mx-auto">
          {filteredCards.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md w-full space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No Flashcards Match Filter</h3>
              <p className="text-xs text-slate-500">
                Try selecting "All Types" or reset your bookmark and confidence filters.
              </p>
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setConfidenceFilter('all');
                  setBookmarkedOnly(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:bg-indigo-700 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : currentCard ? (
            <div className="w-full flex flex-col space-y-4">
              {/* Header Above Card: Progress Bar & Counter */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">
                    {currentCardIndex + 1} / {filteredCards.length}
                  </span>
                  <div className="w-28 md:w-44 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300"
                      style={{
                        width: `${Math.round(((currentCardIndex + 1) / filteredCards.length) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1 text-emerald-600 font-semibold" title="Mastered Cards">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{masteredCards} Mastered ({progressPercent}%)</span>
                  </div>

                  <button
                    onClick={handleToggleBookmark}
                    className="p-1 rounded hover:bg-slate-200/50 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                    title={currentCard.is_bookmarked ? 'Unstar flashcard' : 'Star flashcard'}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        currentCard.is_bookmarked ? 'fill-amber-500 text-amber-500' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* The 3D Flippable Flashcard */}
              <div
                onClick={() => setIsFlipped((prev) => !prev)}
                className="relative w-full min-h-[340px] md:min-h-[400px] rounded-3xl bg-white border border-slate-200/90 shadow-md hover:shadow-lg transition-all duration-300 p-6 md:p-8 flex flex-col justify-between cursor-pointer select-none group"
                style={{ perspective: '1000px' }}
              >
                {/* Top Metabar of the card */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                        currentCard.category
                      )}`}
                    >
                      {currentCard.category}
                    </span>

                    {currentCard.chapter_title && (
                      <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                        • {currentCard.chapter_title}
                      </span>
                    )}
                  </div>

                  {/* Clickable Lecture Timestamp Badge */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTimestampClick(currentCard.timestamp_sec);
                      }}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                      title={`Jump to video at ${currentCard.timestamp_formatted}`}
                    >
                      <Clock className="w-3 h-3 text-indigo-600" />
                      <span>{currentCard.timestamp_formatted}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(isFlipped ? currentCard.answer : currentCard.question);
                      }}
                      className={`p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer ${
                        isSpeaking ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'
                      }`}
                      title="Read aloud with text-to-speech"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal();
                      }}
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit this card"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCurrentCard();
                      }}
                      className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Center Content (Front: Question | Back: Answer) */}
                <div className="my-auto py-6">
                  {!isFlipped ? (
                    <div className="space-y-4 animate-fade-in text-center max-w-xl mx-auto">
                      <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest block">
                        Question
                      </span>
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
                        {currentCard.question}
                      </h2>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fade-in text-left max-w-xl mx-auto">
                      <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Lecture Answer & Explanation</span>
                      </span>
                      <p className="text-base md:text-lg text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                        {currentCard.answer}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Bottom Hint */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100">
                  <span className="italic">
                    {!isFlipped ? 'Click card or press [Space] to reveal answer' : 'Click card or press [Space] to flip back'}
                  </span>
                  <span className="hidden sm:inline font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                    Space / Enter
                  </span>
                </div>
              </div>

              {/* =============================================================
                  CONFIDENCE BUTTONS (Shown when card is flipped or always active)
                 ============================================================= */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-xs font-semibold text-slate-700 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>How confident are you?</span>
                </div>

                {/* 3 Reference Screenshot Buttons: Orange, Purple, Green */}
                <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
                  {/* Option 1: Not Very Confident - Orange */}
                  <button
                    onClick={() => handleConfidenceSelect('not_confident')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs ${
                      currentCard.confidence === 'not_confident'
                        ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 hover:border-amber-300'
                    }`}
                    title="Not confident: Mark for spaced revision [Key: 1]"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>Not Confident</span>
                    <span className="text-[10px] opacity-60 hidden lg:inline">[1]</span>
                  </button>

                  {/* Option 2: Somewhat Confident - Purple */}
                  <button
                    onClick={() => handleConfidenceSelect('somewhat_confident')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs ${
                      currentCard.confidence === 'somewhat_confident'
                        ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                        : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 hover:border-purple-300'
                    }`}
                    title="Somewhat confident [Key: 2]"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                    <span>Somewhat</span>
                    <span className="text-[10px] opacity-60 hidden lg:inline">[2]</span>
                  </button>

                  {/* Option 3: Very Confident - Green */}
                  <button
                    onClick={() => handleConfidenceSelect('very_confident')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs ${
                      currentCard.confidence === 'very_confident'
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 hover:border-emerald-300'
                    }`}
                    title="Very confident: Mark as mastered [Key: 3]"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span>Very Confident</span>
                    <span className="text-[10px] opacity-60 hidden lg:inline">[3]</span>
                  </button>
                </div>
              </div>

              {/* Bottom Nav Controls: Previous, Flip, Next */}
              <div className="flex items-center justify-between px-2 pt-1">
                <button
                  onClick={handlePrevCard}
                  className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                  title="Previous Card (← Arrow)"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setIsFlipped((prev) => !prev)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  {isFlipped ? 'Show Question' : 'Reveal Answer'}
                </button>

                <button
                  onClick={handleNextCard}
                  className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                  title="Next Card (→ Arrow)"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* =========================================================================
          RIGHT SIDEBAR: Contextual AI Study Chat Companion
         ========================================================================= */}
      <div className="w-full lg:w-[380px] xl:w-[420px] h-full flex flex-col bg-white border-l border-slate-200 shrink-0">
        {/* AI Sidebar Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">AI Flashcard Tutor</h3>
              <p className="text-[11px] text-slate-500">Contextual to this card & lecture</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
            Active
          </span>
        </div>

        {/* Quick Action Suggestion Pills */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/70 shrink-0 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Ask AI About Current Card:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleAiAction('simplify')}
              disabled={aiLoading || !currentCard}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              📝 Simplify wording
            </button>
            <button
              onClick={() => handleAiAction('analogy')}
              disabled={aiLoading || !currentCard}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              💡 Give analogy
            </button>
            <button
              onClick={() => handleAiAction('explain')}
              disabled={aiLoading || !currentCard}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              📖 Explain in depth
            </button>
            <button
              onClick={() => handleAiAction('generate_more')}
              disabled={aiLoading || !currentCard}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              ➕ Add related cards
            </button>
          </div>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {aiMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-br-xs'
                    : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Action Proposal Button (e.g. 1-click apply edit or add new cards) */}
                {msg.actionProposal && msg.actionProposal.type === 'edit' && msg.actionProposal.card && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200">
                    <button
                      onClick={() => handleApplyAiEdit(msg.actionProposal!.card!)}
                      className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Simplified Text to Card</span>
                    </button>
                  </div>
                )}

                {msg.actionProposal && msg.actionProposal.type === 'new_cards' && msg.actionProposal.cards && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200">
                    <button
                      onClick={() => handleApplyAiCards(msg.actionProposal!.cards!)}
                      className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add {msg.actionProposal.cards.length} Cards to Deck</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {aiLoading && (
            <div className="flex items-center space-x-2 text-xs text-indigo-600 bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 max-w-[80%]">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>AI is thinking & grounding with lecture...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* AI Input Form */}
        <div className="p-3 border-t border-slate-200 bg-white shrink-0">
          <form onSubmit={handleCustomAiSubmit} className="relative flex items-center">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask AI about this card or lecture..."
              className="w-full text-xs p-3 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-slate-50 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!aiInput.trim() || aiLoading}
              className="absolute right-2 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors cursor-pointer"
              title="Send to AI Tutor"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* =========================================================================
          MODALS: Add Card, Edit Card, Regenerate Deck
         ========================================================================= */}

      {/* Add Custom Card Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Create Flashcard</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomCard} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Card Category
                </label>
                <select
                  value={cardFormCategory}
                  onChange={(e) => setCardFormCategory(e.target.value as FlashcardCategory)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                >
                  <option value="Concept">Concept</option>
                  <option value="Definition">Definition</option>
                  <option value="Formula">Formula</option>
                  <option value="Important Fact">Important Fact</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question / Concept Prompt
                </label>
                <textarea
                  value={cardFormQuestion}
                  onChange={(e) => setCardFormQuestion(e.target.value)}
                  placeholder="e.g. What distinguishes addition from condensation polymerization?"
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Answer / Explanation
                </label>
                <textarea
                  value={cardFormAnswer}
                  onChange={(e) => setCardFormAnswer(e.target.value)}
                  placeholder="e.g. Addition opens double bonds without by-products..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lecture Timestamp (Seconds)
                </label>
                <input
                  type="number"
                  value={cardFormTimestamp}
                  onChange={(e) => setCardFormTimestamp(Number(e.target.value))}
                  placeholder="e.g. 420 for 07:00"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Save Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Card Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span>Edit Flashcard</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCardEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={cardFormCategory}
                  onChange={(e) => setCardFormCategory(e.target.value as FlashcardCategory)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                >
                  <option value="Concept">Concept</option>
                  <option value="Definition">Definition</option>
                  <option value="Formula">Formula</option>
                  <option value="Important Fact">Important Fact</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question
                </label>
                <textarea
                  value={cardFormQuestion}
                  onChange={(e) => setCardFormQuestion(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Answer
                </label>
                <textarea
                  value={cardFormAnswer}
                  onChange={(e) => setCardFormAnswer(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regenerate Deck Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>AI Deck Generation</span>
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Generate a completely new set of flashcards directly extracted from the current video's transcript and chapters.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Number of Cards to Generate (15–25):
              </label>
              <input
                type="number"
                min={10}
                max={30}
                value={generateCount}
                onChange={(e) => setGenerateCount(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateFreshDeck}
                disabled={isGeneratingMore}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingMore ? (
                  <span>Generating...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
