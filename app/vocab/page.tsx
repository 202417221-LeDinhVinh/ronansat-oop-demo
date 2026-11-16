"use client";

import React, { useEffect, useState } from "react";
import {
  Languages,
  Sparkles,
  BookOpen,
  Plus,
  Play,
  CheckCircle2,
  RotateCw,
  Trash2,
  Edit2,
  ArrowRight,
  Clock,
  Layers,
  HelpCircle,
  X,
  Volume2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import api from "@/lib/axios";

interface VocabCard {
  _id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence?: string;
  box: number;
  isDue?: boolean;
  deckId?: string;
}

interface VocabDeck {
  _id: string;
  title: string;
  description?: string;
  isSystem: boolean;
  totalCards: number;
  dueCount: number;
}

export default function VocabPage() {
  const [decks, setDecks] = useState<VocabDeck[]>([]);
  const [totalDueToday, setTotalDueToday] = useState(0);
  const [loading, setLoading] = useState(true);

  // Selected Deck & Cards view
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<VocabDeck | null>(null);
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);

  // Study Session State
  const [isStudying, setIsStudying] = useState(false);
  const [studyCards, setStudyCards] = useState<VocabCard[]>([]);
  const [currentStudyIndex, setCurrentStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studySessionComplete, setStudySessionComplete] = useState(false);

  // Deck Modal State
  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");

  // Card Modal State
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardWord, setCardWord] = useState("");
  const [cardPos, setCardPos] = useState("adjective");
  const [cardDef, setCardDef] = useState("");
  const [cardEx, setCardEx] = useState("");

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/vocab/decks");
      const deckList = res.data?.decks || [];
      setDecks(deckList);
      setTotalDueToday(res.data?.totalDueToday || 0);

      // Auto-select first deck if none selected
      if (!selectedDeckId && deckList.length > 0) {
        setSelectedDeckId(deckList[0]._id);
      }
    } catch (err) {
      console.error("Failed to load vocab decks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchCardsForDeck = async (deckId: string) => {
    try {
      setLoadingCards(true);
      const res = await api.get(`/api/vocab/decks/${deckId}`);
      setSelectedDeck(res.data?.deck || null);
      setCards(res.data?.cards || []);
    } catch (err) {
      console.error("Failed to load cards for deck:", err);
    } finally {
      setLoadingCards(false);
    }
  };

  useEffect(() => {
    if (selectedDeckId) {
      fetchCardsForDeck(selectedDeckId);
    }
  }, [selectedDeckId]);

  // -------------------------------------------------------------------------
  // STUDY SESSION LOGIC
  // -------------------------------------------------------------------------
  const startDueStudy = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/vocab/due");
      const dueCards = res.data?.dueCards || [];
      if (dueCards.length === 0) {
        alert("No cards are due for review right now! You can study all cards from any deck.");
        setLoading(false);
        return;
      }
      setStudyCards(dueCards);
      setCurrentStudyIndex(0);
      setIsFlipped(false);
      setStudySessionComplete(false);
      setIsStudying(true);
    } catch (err) {
      console.error("Could not start study session:", err);
    } finally {
      setLoading(false);
    }
  };

  const startDeckStudy = (deckCards: VocabCard[]) => {
    if (deckCards.length === 0) return;
    setStudyCards(deckCards);
    setCurrentStudyIndex(0);
    setIsFlipped(false);
    setStudySessionComplete(false);
    setIsStudying(true);
  };

  const handleReviewGrade = async (grade: "again" | "hard" | "good" | "easy") => {
    const currentCard = studyCards[currentStudyIndex];
    if (!currentCard) return;

    try {
      await api.post(`/api/vocab/cards/${currentCard._id}/review`, { grade });
    } catch (err) {
      console.error("Failed to record Leitner review:", err);
    }

    if (currentStudyIndex < studyCards.length - 1) {
      setCurrentStudyIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setStudySessionComplete(true);
      fetchDecks();
      if (selectedDeckId) fetchCardsForDeck(selectedDeckId);
    }
  };

  // Keyboard navigation during study session
  useEffect(() => {
    if (!isStudying || studySessionComplete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === "1") handleReviewGrade("again");
        if (e.key === "2") handleReviewGrade("hard");
        if (e.key === "3") handleReviewGrade("good");
        if (e.key === "4") handleReviewGrade("easy");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isStudying, isFlipped, studySessionComplete, currentStudyIndex, studyCards]);

  // -------------------------------------------------------------------------
  // DECK & CARD CRUD HANDLERS
  // -------------------------------------------------------------------------
  const handleSaveDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;

    try {
      const res = await api.post("/api/vocab/decks", {
        title: newDeckTitle.trim(),
        description: newDeckDescription.trim(),
      });
      setDeckModalOpen(false);
      setNewDeckTitle("");
      setNewDeckDescription("");
      fetchDecks();
      if (res.data?.deck?._id) {
        setSelectedDeckId(res.data.deck._id);
      }
    } catch (err) {
      console.error("Failed to create custom deck:", err);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm("Are you sure you want to delete this custom deck?")) return;
    try {
      await api.delete(`/api/vocab/decks/${deckId}`);
      setSelectedDeckId(null);
      fetchDecks();
    } catch (err) {
      console.error("Failed to delete deck:", err);
    }
  };

  const handleOpenCardModal = (card?: VocabCard) => {
    if (card) {
      setEditingCardId(card._id);
      setCardWord(card.word);
      setCardPos(card.partOfSpeech || "noun");
      setCardDef(card.definition);
      setCardEx(card.exampleSentence || "");
    } else {
      setEditingCardId(null);
      setCardWord("");
      setCardPos("noun");
      setCardDef("");
      setCardEx("");
    }
    setCardModalOpen(true);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeckId || !cardWord.trim() || !cardDef.trim()) return;

    try {
      if (editingCardId) {
        await api.put(`/api/vocab/cards/${editingCardId}`, {
          word: cardWord.trim(),
          partOfSpeech: cardPos,
          definition: cardDef.trim(),
          exampleSentence: cardEx.trim(),
        });
      } else {
        await api.post(`/api/vocab/decks/${selectedDeckId}/cards`, {
          word: cardWord.trim(),
          partOfSpeech: cardPos,
          definition: cardDef.trim(),
          exampleSentence: cardEx.trim(),
        });
      }
      setCardModalOpen(false);
      fetchCardsForDeck(selectedDeckId);
      fetchDecks();
    } catch (err) {
      console.error("Failed to save card:", err);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Delete this flashcard?")) return;
    try {
      await api.delete(`/api/vocab/cards/${cardId}`);
      if (selectedDeckId) fetchCardsForDeck(selectedDeckId);
      fetchDecks();
    } catch (err) {
      console.error("Failed to delete card:", err);
    }
  };

  // -------------------------------------------------------------------------
  // STUDY SESSION VIEW
  // -------------------------------------------------------------------------
  if (isStudying) {
    if (studySessionComplete) {
      return (
        <div className="py-12 flex flex-col items-center text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#e8f7f0] text-[var(--state-success)] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] font-display">
            Study Session Complete!
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            You reviewed {studyCards.length} SAT flashcards with Leitner spaced repetition.
            Cards have been rescheduled according to your ratings.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsStudying(false)}
            className="mt-4"
          >
            Return to Deck Library
          </Button>
        </div>
      );
    }

    const currentCard = studyCards[currentStudyIndex];

    return (
      <div className="max-w-xl mx-auto py-6 space-y-6">
        {/* Study Session Top Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsStudying(false)}
            className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            ✕ Exit Study Session
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="brand" size="sm">
              Box {currentCard?.box || 1}
            </Badge>
            <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
              {currentStudyIndex + 1} / {studyCards.length}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent-brand)] transition-all duration-200"
            style={{ width: `${((currentStudyIndex + 1) / studyCards.length) * 100}%` }}
          />
        </div>

        {/* Interactive Flashcard */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`min-h-[320px] p-8 rounded-[var(--ui-radius-lg)] border transition-all duration-200 flex flex-col justify-between cursor-pointer shadow-[var(--ui-shadow)] select-none ${
            isFlipped
              ? "bg-[var(--bg-surface)] border-[var(--accent-brand)] shadow-[var(--ui-shadow-md)]"
              : "bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-canvas)] border-[var(--border-strong)] hover:border-[var(--accent-brand)]"
          }`}
        >
          {/* Top metadata on card */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {isFlipped ? "Definition & Context" : "SAT Flashcard"}
            </span>
            <Badge variant="muted" size="sm">
              {currentCard?.partOfSpeech || "word"}
            </Badge>
          </div>

          {/* Card Body */}
          <div className="py-6 text-center space-y-3">
            {!isFlipped ? (
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] font-display tracking-tight">
                  {currentCard?.word}
                </h1>
                <p className="mt-4 text-xs text-[var(--text-muted)]">
                  Click card or press <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono text-[10px]">Space</kbd> to flip
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-left max-w-md mx-auto">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] font-display">
                    {currentCard?.word}
                  </h2>
                  <p className="text-base text-[var(--text-primary)] font-medium mt-2 leading-relaxed">
                    {currentCard?.definition}
                  </p>
                </div>

                {currentCard?.exampleSentence && (
                  <div className="p-3 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] italic leading-relaxed">
                    &ldquo;{currentCard.exampleSentence}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Flip Indicator */}
          <div className="text-center text-[11px] text-[var(--text-muted)] font-medium pt-3 border-t border-[var(--border-subtle)]">
            {isFlipped ? "Rate your recall below to advance" : "Tap anywhere to reveal definition"}
          </div>
        </div>

        {/* ---------------------------------------------------------------
            LEITNER 4-GRADE RATING BUTTONS (Appears when flipped)
        ---------------------------------------------------------------- */}
        {isFlipped ? (
          <div className="space-y-2 pt-2 animate-in fade-in duration-150">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block text-center">
              How well did you know this word?
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleReviewGrade("again")}
                className="p-3 rounded-[var(--ui-radius-sm)] border border-[#f8c4b4] bg-[#fdede8] hover:bg-[#fadad1] text-[#ab3d19] font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Again</span>
                <span className="text-[10px] font-normal opacity-80">(1) 1 day</span>
              </button>

              <button
                type="button"
                onClick={() => handleReviewGrade("hard")}
                className="p-3 rounded-[var(--ui-radius-sm)] border border-[#ecd49d] bg-[#faf1de] hover:bg-[#f6e5be] text-[#8c6b1f] font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Hard</span>
                <span className="text-[10px] font-normal opacity-80">(2) 3 days</span>
              </button>

              <button
                type="button"
                onClick={() => handleReviewGrade("good")}
                className="p-3 rounded-[var(--ui-radius-sm)] border border-[#b2e5ce] bg-[#e8f7f0] hover:bg-[#d6f2e4] text-[#166e4b] font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Good</span>
                <span className="text-[10px] font-normal opacity-80">(3) 7 days</span>
              </button>

              <button
                type="button"
                onClick={() => handleReviewGrade("easy")}
                className="p-3 rounded-[var(--ui-radius-sm)] border border-[#a7f3d0] bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#065f46] font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Easy</span>
                <span className="text-[10px] font-normal opacity-80">(4) 14 days</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsFlipped(true)}
              className="w-full sm:w-auto px-8"
            >
              Reveal Definition
            </Button>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MAIN DECKS & CARDS LIBRARY VIEW
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="SAT Vocabulary & Leitner Flashcards"
        description="Master essential high-frequency SAT vocabulary using spaced-repetition Leitner boxes."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDeckModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              <span>New Deck</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={totalDueToday === 0}
              onClick={startDueStudy}
              icon={<Sparkles className="w-4 h-4" />}
            >
              <span>Study Due Cards ({totalDueToday})</span>
            </Button>
          </div>
        }
      />

      {/* Decks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((deck) => {
          const isSelected = selectedDeckId === deck._id;
          return (
            <Card
              key={deck._id}
              onClick={() => setSelectedDeckId(deck._id)}
              className={`flex flex-col justify-between cursor-pointer transition-all duration-150 ${
                isSelected
                  ? "border-[var(--accent-brand)] ring-2 ring-[var(--accent-brand)]/20 shadow-[var(--ui-shadow-md)]"
                  : "hover:border-[var(--border-strong)]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={deck.isSystem ? "brand" : "info"} size="sm">
                    {deck.isSystem ? "System Deck" : "Custom Deck"}
                  </Badge>
                  {deck.dueCount > 0 && (
                    <Badge variant="danger" size="sm">
                      {deck.dueCount} Due Today
                    </Badge>
                  )}
                </div>

                <h3 className="font-bold text-base text-[var(--text-primary)] font-display">
                  {deck.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                  {deck.description || "Collection of SAT vocabulary words."}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {deck.totalCards} cards
                </span>
                {!deck.isSystem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDeck(deck._id);
                    }}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--state-danger)]"
                    title="Delete custom deck"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Deck Detail & Cards Table */}
      {selectedDeck && (
        <Card className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)] font-display">
                  {selectedDeck.title}
                </h2>
                <Badge variant="muted">{cards.length} Cards</Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {selectedDeck.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenCardModal()}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Card
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={cards.length === 0}
                onClick={() => startDeckStudy(cards)}
                icon={<Play className="w-3.5 h-3.5 fill-current" />}
              >
                Study Deck
              </Button>
            </div>
          </div>

          {loadingCards ? (
            <TableSkeleton rows={4} />
          ) : cards.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-6 h-6" />}
              title="No cards in this deck yet"
              description="Add your first flashcard to begin studying this deck."
              action={
                <Button variant="primary" size="sm" onClick={() => handleOpenCardModal()}>
                  Add Flashcard
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Word</th>
                    <th className="py-2.5 px-3">Part of Speech</th>
                    <th className="py-2.5 px-3">Definition</th>
                    <th className="py-2.5 px-3">Box</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {cards.map((card) => (
                    <tr key={card._id} className="hover:bg-[var(--bg-canvas)]/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-[var(--text-primary)] text-sm">
                        {card.word}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="muted" size="sm">
                          {card.partOfSpeech}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-primary)] max-w-sm">
                        <p className="font-medium">{card.definition}</p>
                        {card.exampleSentence && (
                          <p className="text-[11px] text-[var(--text-muted)] italic mt-0.5">
                            &ldquo;{card.exampleSentence}&rdquo;
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-[#8c6b1f] bg-[var(--accent-brand-tint)] px-2 py-0.5 rounded-[var(--ui-radius-sm)] border border-[#ecd49d]">
                          Box {card.box}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenCardModal(card)}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
                            title="Edit card"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(card._id)}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--state-danger)] hover:bg-[#fdede8]"
                            title="Delete card"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* -------------------------------------------------------------------
          CREATE DECK MODAL
      -------------------------------------------------------------------- */}
      <Dialog
        open={deckModalOpen}
        onClose={() => setDeckModalOpen(false)}
        title="Create Custom Vocab Deck"
        description="Organize your personal list of difficult SAT words."
        maxWidth="md"
      >
        <form onSubmit={handleSaveDeck} className="space-y-4 pt-2">
          <Input
            label="Deck Title"
            id="deck-title"
            required
            value={newDeckTitle}
            onChange={(e) => setNewDeckTitle(e.target.value)}
            placeholder="e.g. My Difficult Passage Words"
          />
          <Textarea
            label="Description (Optional)"
            id="deck-desc"
            value={newDeckDescription}
            onChange={(e) => setNewDeckDescription(e.target.value)}
            placeholder="Brief note about the focus of this deck..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setDeckModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Create Deck
            </Button>
          </div>
        </form>
      </Dialog>

      {/* -------------------------------------------------------------------
          ADD / EDIT CARD MODAL
      -------------------------------------------------------------------- */}
      <Dialog
        open={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        title={editingCardId ? "Edit Vocab Card" : "Add New Flashcard"}
        description="Enter the word, part of speech, definition, and illustrative sentence."
        maxWidth="md"
      >
        <form onSubmit={handleSaveCard} className="space-y-4 pt-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Word"
                id="card-word"
                required
                value={cardWord}
                onChange={(e) => setCardWord(e.target.value)}
                placeholder="e.g. Ephemeral"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Part of Speech
              </label>
              <select
                value={cardPos}
                onChange={(e) => setCardPos(e.target.value)}
                className="workbook-input"
              >
                <option value="noun">noun</option>
                <option value="verb">verb</option>
                <option value="adjective">adjective</option>
                <option value="adverb">adverb</option>
              </select>
            </div>
          </div>

          <Textarea
            label="Definition"
            id="card-def"
            required
            value={cardDef}
            onChange={(e) => setCardDef(e.target.value)}
            placeholder="Clear, accurate SAT-level definition..."
          />

          <Textarea
            label="Example Sentence"
            id="card-ex"
            value={cardEx}
            onChange={(e) => setCardEx(e.target.value)}
            placeholder="Sentence using the word in proper context..."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setCardModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingCardId ? "Save Changes" : "Add Card"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
