"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  BookOpen,
  Plus,
  Play,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Volume2,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CardHoverPlate } from "@/components/ui/CardHoverPlate";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  // Confirm delete states
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

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

  const handleReviewGrade = useCallback(
    async (grade: "again" | "hard" | "good" | "easy") => {
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
    },
    [currentStudyIndex, selectedDeckId, studyCards]
  );

  // Keyboard navigation during study session
  useEffect(() => {
    if (!isStudying) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isStudying]);

  useEffect(() => {
    if (!isStudying || studySessionComplete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setIsStudying(false);
        return;
      }

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
        return;
      }

      if (isFlipped) {
        if (e.key === "1") {
          e.preventDefault();
          handleReviewGrade("again");
        } else if (e.key === "2") {
          e.preventDefault();
          handleReviewGrade("hard");
        } else if (e.key === "3") {
          e.preventDefault();
          handleReviewGrade("good");
        } else if (e.key === "4") {
          e.preventDefault();
          handleReviewGrade("easy");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isStudying, isFlipped, studySessionComplete, handleReviewGrade]);

  // Audio pronunciation helper
  const playWordAudio = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.9;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

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

  const confirmDeleteDeck = async () => {
    if (!deckToDelete) return;
    try {
      await api.delete(`/api/vocab/decks/${deckToDelete}`);
      if (selectedDeckId === deckToDelete) {
        setSelectedDeckId(null);
      }
      setDeckToDelete(null);
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

  const confirmDeleteCard = async () => {
    if (!cardToDelete) return;
    try {
      await api.delete(`/api/vocab/cards/${cardToDelete}`);
      if (selectedDeckId) fetchCardsForDeck(selectedDeckId);
      setCardToDelete(null);
      fetchDecks();
    } catch (err) {
      console.error("Failed to delete card:", err);
    }
  };

  // -------------------------------------------------------------------------
  // STUDY SESSION VIEW (Matching RonanSAT Platform FlashCardOverlay)
  // -------------------------------------------------------------------------
  if (isStudying) {
    if (typeof document === "undefined") return null;

    if (studySessionComplete) {
      return createPortal(
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-canvas px-4 py-8 sm:px-6 lg:px-10 flex items-center justify-center">
          <div className="relative w-full max-w-lg workbook-panel p-8 sm:p-10 text-center space-y-6 brutal-shadow-lg">
            <div className="w-16 h-16 rounded-full bg-[#e8f7f0] border border-[#b2e5ce] text-[var(--state-success)] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Session Complete
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-ink-fg font-display tracking-tight">
                Review Finished!
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                You reviewed <span className="font-bold text-ink-fg">{studyCards.length}</span> SAT flashcards with Leitner spaced repetition.
                Your next review intervals have been updated.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsStudying(false)}
                className="w-full sm:w-auto px-8"
              >
                Return to Deck Library
              </Button>
            </div>
          </div>
        </div>,
        document.body
      );
    }

    const currentCard = studyCards[currentStudyIndex];

    return createPortal(
      <div className="fixed inset-0 z-[200] overflow-y-auto bg-canvas px-4 py-5 sm:px-6 lg:px-10">
        <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-4xl flex-col justify-between pb-8">
          {/* Top bar */}
          <div className="flex w-full items-center justify-between gap-4 rounded-[var(--ui-radius)] border border-border bg-surface-white px-5 py-4 brutal-shadow-sm">
            <div>
              <div className="text-[12px] font-semibold text-ink-muted">
                {selectedDeck?.title || "SAT Vocabulary Flashcard Review"}
              </div>
              <div className="mt-0.5 text-[20px] font-black tracking-[-0.03em] text-ink-fg font-display">
                Card {currentStudyIndex + 1} of {studyCards.length}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-[var(--ui-radius-sm)] bg-brand-tint border border-[#ecd49d] text-brand-strong">
                Box {currentCard?.box || 1}
              </span>
              <button
                type="button"
                onClick={() => setIsStudying(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-white text-ink-fg brutal-shadow-sm outline-none transition workbook-press hover:bg-canvas"
                aria-label="Close flash card session"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden my-4">
            <div
              className="h-full bg-brand transition-all duration-300 ease-out"
              style={{ width: `${((currentStudyIndex + 1) / studyCards.length) * 100}%` }}
            />
          </div>

          {/* Interactive CSS 3D Flashcard */}
          <div className="my-auto py-4 flex flex-col items-center">
            <div className="w-full max-w-2xl [perspective:1200px]">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsFlipped(!isFlipped);
                  }
                }}
                className="block w-full min-h-[380px] sm:min-h-[420px] text-center outline-none cursor-pointer focus:outline-none focus-visible:outline-none select-none"
              >
                <div
                  className="relative w-full min-h-[380px] sm:min-h-[420px] rounded-[var(--ui-radius-lg)] transition-transform duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d]"
                  style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                >
                  {/* FRONT FACE */}
                  <div className="absolute inset-0 flex flex-col justify-between rounded-[var(--ui-radius-lg)] border border-border bg-surface-white p-8 sm:p-10 brutal-shadow-lg [backface-visibility:hidden]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase tracking-wider text-ink-muted">
                        SAT Flashcard
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full border border-border text-[11px] font-semibold text-ink-muted bg-canvas">
                        {currentCard?.partOfSpeech || "vocabulary"}
                      </span>
                    </div>

                    <div className="py-8 text-center space-y-3">
                      <h1 className="text-4xl sm:text-5xl font-black text-ink-fg font-display tracking-tight break-words">
                        {currentCard?.word}
                      </h1>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentCard?.word) playWordAudio(currentCard.word);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-canvas text-xs font-semibold text-ink-fg hover:border-brand transition-colors"
                          title="Listen to pronunciation"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-brand" />
                          <span>Pronounce</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-center text-xs font-medium text-ink-muted flex items-center justify-center gap-1.5 pt-3 border-t border-border">
                      <span>Click card or press</span>
                      <kbd className="px-2 py-0.5 rounded bg-canvas border border-border font-mono text-[11px] text-ink-fg">
                        Space
                      </kbd>
                      <span>to flip</span>
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div className="absolute inset-0 flex flex-col justify-between rounded-[var(--ui-radius-lg)] border border-border bg-surface-white p-8 sm:p-10 brutal-shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase tracking-wider text-ink-muted">
                        Definition &amp; Context
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full border border-[#ecd49d] text-[11px] font-bold text-brand-strong bg-brand-tint">
                        Box {currentCard?.box || 1}
                      </span>
                    </div>

                    <div className="py-4 text-left space-y-4 max-w-lg mx-auto w-full">
                      <div className="border-b border-border pb-3">
                        <h2 className="text-2xl font-black text-ink-fg font-display">
                          {currentCard?.word}
                        </h2>
                        <span className="text-xs italic text-ink-muted">
                          {currentCard?.partOfSpeech}
                        </span>
                      </div>

                      <p className="text-base sm:text-lg text-ink-fg font-medium leading-relaxed">
                        {currentCard?.definition}
                      </p>

                      {currentCard?.exampleSentence && (
                        <div className="p-3.5 rounded-[var(--ui-radius-sm)] bg-canvas border border-border text-xs sm:text-sm text-ink-muted italic leading-relaxed">
                          &ldquo;{currentCard.exampleSentence}&rdquo;
                        </div>
                      )}
                    </div>

                    <div className="text-center text-xs font-medium text-ink-muted pt-3 border-t border-border">
                      Rate your recall below to advance
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leitner 4-Grade Rating Buttons */}
            <div className="w-full max-w-2xl mt-6">
              {isFlipped ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block text-center">
                    How well did you know this word? (1 - 4)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleReviewGrade("again")}
                      className="p-3.5 rounded-[var(--ui-radius)] border border-[#f8c4b4] bg-[#fdede8] hover:bg-[#fadad1] text-[#ab3d19] font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all workbook-press brutal-shadow-xs"
                    >
                      <span className="text-sm">Again</span>
                      <span className="text-[11px] font-mono font-medium opacity-80">(1) 1 day</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReviewGrade("hard")}
                      className="p-3.5 rounded-[var(--ui-radius)] border border-[#ecd49d] bg-[#faf1de] hover:bg-[#f6e5be] text-[#8c6b1f] font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all workbook-press brutal-shadow-xs"
                    >
                      <span className="text-sm">Hard</span>
                      <span className="text-[11px] font-mono font-medium opacity-80">(2) 3 days</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReviewGrade("good")}
                      className="p-3.5 rounded-[var(--ui-radius)] border border-[#b2e5ce] bg-[#e8f7f0] hover:bg-[#d6f2e4] text-[#166e4b] font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all workbook-press brutal-shadow-xs"
                    >
                      <span className="text-sm">Good</span>
                      <span className="text-[11px] font-mono font-medium opacity-80">(3) 7 days</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReviewGrade("easy")}
                      className="p-3.5 rounded-[var(--ui-radius)] border border-[#a7f3d0] bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#065f46] font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all workbook-press brutal-shadow-xs"
                    >
                      <span className="text-sm">Easy</span>
                      <span className="text-[11px] font-mono font-medium opacity-80">(4) 14 days</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsFlipped(true)}
                    className="w-full sm:w-auto px-10"
                  >
                    Reveal Definition
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom navigation helper */}
          <div className="flex items-center justify-between text-xs text-ink-muted pt-4 border-t border-border">
            <span>
              Keyboard: <kbd className="px-1.5 py-0.5 rounded bg-surface-white border border-border font-mono text-[10px]">Space</kbd> flip &bull; <kbd className="px-1.5 py-0.5 rounded bg-surface-white border border-border font-mono text-[10px]">1</kbd>-<kbd className="px-1.5 py-0.5 rounded bg-surface-white border border-border font-mono text-[10px]">4</kbd> rate &bull; <kbd className="px-1.5 py-0.5 rounded bg-surface-white border border-border font-mono text-[10px]">Esc</kbd> exit
            </span>
            <button
              type="button"
              onClick={() => setIsStudying(false)}
              className="font-semibold text-ink-fg hover:text-brand transition-colors cursor-pointer"
            >
              Exit Review
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // -------------------------------------------------------------------------
  // MAIN DECKS & CARDS LIBRARY VIEW
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Vocabulary & Leitner Flashcards"
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-ink-muted">
            Decks Library
          </span>
          <span className="text-xs text-ink-muted font-medium">
            {decks.length} {decks.length === 1 ? "deck" : "decks"} total
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => {
            const isSelected = selectedDeckId === deck._id;
            const progressPct =
              deck.totalCards > 0
                ? Math.round(((deck.totalCards - deck.dueCount) / deck.totalCards) * 100)
                : 0;

            return (
              <div
                key={deck._id}
                onClick={() => setSelectedDeckId(deck._id)}
                className={`relative group rounded-[var(--ui-radius)] border bg-surface-white p-5 brutal-shadow-sm cursor-pointer transition-all workbook-press flex flex-col justify-between ${
                  isSelected
                    ? "border-brand ring-2 ring-brand/20 shadow-md"
                    : "border-border hover:border-border-strong hover:shadow-sm"
                }`}
              >
                <CardHoverPlate />

                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-[var(--ui-radius-sm)] text-[11px] font-bold uppercase tracking-wider border ${
                        deck.isSystem
                          ? "bg-brand-tint text-brand-strong border-[#ecd49d]"
                          : "bg-surface-white text-ink-muted border-border"
                      }`}
                    >
                      {deck.isSystem ? "System Deck" : "Custom Deck"}
                    </span>

                    {deck.dueCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fdede8] text-[#ab3d19] border border-[#f8c4b4]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ab3d19]" />
                        {deck.dueCount} Due
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#e8f7f0] text-[#166e4b] border border-[#b2e5ce]">
                        All caught up
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-ink-fg font-display group-hover:text-brand transition-colors">
                      {deck.title}
                    </h3>
                    <p className="mt-1 text-xs text-ink-muted line-clamp-2 leading-relaxed">
                      {deck.description || "Collection of SAT vocabulary words."}
                    </p>
                  </div>
                </div>

                <div className="relative mt-5 pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted font-medium">
                      {deck.totalCards} cards
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-ink-muted">
                      {progressPct}% retained
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-semibold text-brand flex items-center gap-1">
                      <span>View cards</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>

                    {!deck.isSystem && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeckToDelete(deck._id);
                        }}
                        className="p-1 rounded text-ink-muted hover:text-[var(--state-danger)] hover:bg-[#fdede8] transition-colors"
                        title="Delete custom deck"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Deck Detail & Cards Table */}
      {selectedDeck && (
        <div className="workbook-panel p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-ink-fg font-display">
                  {selectedDeck.title}
                </h2>
                <Badge variant="muted">{cards.length} Cards</Badge>
                {selectedDeck.dueCount > 0 && (
                  <Badge variant="danger">{selectedDeck.dueCount} Due</Badge>
                )}
              </div>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                {selectedDeck.description || "Manage, edit, and review flashcards in this deck."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenCardModal()}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                <span>Add Card</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={cards.length === 0}
                onClick={() => startDeckStudy(cards)}
                icon={<Play className="w-3.5 h-3.5 fill-current" />}
              >
                <span>Study Deck ({cards.length})</span>
              </Button>
            </div>
          </div>

          {loadingCards ? (
            <TableSkeleton rows={4} />
          ) : cards.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-8 h-8 text-ink-muted" />}
              title="No cards in this deck yet"
              description="Add your first flashcard to begin studying this deck."
              action={
                <Button variant="primary" size="sm" onClick={() => handleOpenCardModal()}>
                  Add Flashcard
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Word</TableHead>
                  <TableHead className="w-28">Part of Speech</TableHead>
                  <TableHead>Definition &amp; Context</TableHead>
                  <TableHead className="w-24">Leitner Box</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card) => (
                  <TableRow key={card._id} className="hover:bg-canvas/50">
                    <TableCell className="font-bold text-ink-fg font-display text-sm">
                      <div className="flex items-center gap-1.5">
                        <span>{card.word}</span>
                        <button
                          type="button"
                          onClick={() => playWordAudio(card.word)}
                          className="p-1 rounded hover:bg-canvas text-ink-muted hover:text-brand transition-colors"
                          title="Listen"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="muted" size="sm">
                        {card.partOfSpeech}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-medium text-ink-fg leading-relaxed">
                        {card.definition}
                      </p>
                      {card.exampleSentence && (
                        <p className="text-[11px] text-ink-muted italic mt-1 leading-relaxed">
                          &ldquo;{card.exampleSentence}&rdquo;
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-brand-strong bg-brand-tint px-2.5 py-0.5 rounded-[var(--ui-radius-sm)] border border-[#ecd49d]">
                        Box {card.box}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenCardModal(card)}
                          className="p-1.5 rounded text-ink-muted hover:text-ink-fg hover:bg-canvas transition-colors"
                          title="Edit card"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCardToDelete(card._id)}
                          className="p-1.5 rounded text-ink-muted hover:text-[var(--state-danger)] hover:bg-[#fdede8] transition-colors"
                          title="Delete card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------
          CREATE DECK MODAL
      -------------------------------------------------------------------- */}
      <ModalDialog
        open={deckModalOpen}
        onClose={() => setDeckModalOpen(false)}
        title="Create Custom Vocab Deck"
        description="Organize your personal list of difficult SAT words."
        maxWidthClassName="max-w-md"
      >
        <form onSubmit={handleSaveDeck} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Deck Title
            </label>
            <input
              type="text"
              required
              value={newDeckTitle}
              onChange={(e) => setNewDeckTitle(e.target.value)}
              placeholder="e.g. Challenging Reading Passage Terms"
              className="workbook-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={newDeckDescription}
              onChange={(e) => setNewDeckDescription(e.target.value)}
              placeholder="Brief note about the focus or theme of this deck..."
              className="workbook-input w-full resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={() => setDeckModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Create Deck
            </Button>
          </div>
        </form>
      </ModalDialog>

      {/* -------------------------------------------------------------------
          ADD / EDIT CARD MODAL
      -------------------------------------------------------------------- */}
      <ModalDialog
        open={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        title={editingCardId ? "Edit Vocab Card" : "Add New Flashcard"}
        description="Enter the word, part of speech, definition, and illustrative sentence."
        maxWidthClassName="max-w-md"
      >
        <form onSubmit={handleSaveCard} className="space-y-4 pt-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Word
              </label>
              <input
                type="text"
                required
                value={cardWord}
                onChange={(e) => setCardWord(e.target.value)}
                placeholder="e.g. Ephemeral"
                className="workbook-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Part of Speech
              </label>
              <select
                value={cardPos}
                onChange={(e) => setCardPos(e.target.value)}
                className="workbook-input w-full bg-surface-white"
              >
                <option value="noun">noun</option>
                <option value="verb">verb</option>
                <option value="adjective">adjective</option>
                <option value="adverb">adverb</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Definition
            </label>
            <textarea
              rows={3}
              required
              value={cardDef}
              onChange={(e) => setCardDef(e.target.value)}
              placeholder="Clear, accurate SAT-level definition..."
              className="workbook-input w-full resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Example Sentence
            </label>
            <textarea
              rows={2}
              value={cardEx}
              onChange={(e) => setCardEx(e.target.value)}
              placeholder="Sentence using the word in proper SAT context..."
              className="workbook-input w-full resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={() => setCardModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingCardId ? "Save Changes" : "Add Card"}
            </Button>
          </div>
        </form>
      </ModalDialog>

      {/* Delete Deck Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deckToDelete)}
        onOpenChange={(open) => !open && setDeckToDelete(null)}
        title="Delete Custom Deck"
        description="Are you sure you want to delete this custom deck and all its flashcards? This action cannot be undone."
        confirmLabel="Delete Deck"
        onConfirm={confirmDeleteDeck}
      />

      {/* Delete Card Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(cardToDelete)}
        onOpenChange={(open) => !open && setCardToDelete(null)}
        title="Delete Flashcard"
        description="Are you sure you want to delete this flashcard? Spaced repetition progress for this card will be removed."
        confirmLabel="Delete Card"
        onConfirm={confirmDeleteCard}
      />
    </div>
  );
}
