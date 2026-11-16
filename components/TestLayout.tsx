"use client";

import React, { useState } from "react";
import {
  EyeOff,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Check,
  Flag,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

interface TestHeaderProps {
  sectionName: string;
  timeRemaining: number;
  onTimeUp: () => void;
  isTimerHidden: boolean;
  setIsTimerHidden: (hide: boolean) => void;
  onToggleCalculator?: () => void;
  showCalculator?: boolean;
  buttonText?: string;
  confirmTitle?: string;
  confirmDescription?: string;
}

export function TestHeader({
  sectionName,
  timeRemaining,
  onTimeUp,
  isTimerHidden,
  setIsTimerHidden,
  onToggleCalculator,
  showCalculator = false,
  buttonText = "Next Module",
  confirmTitle = "Submit Module?",
  confirmDescription = "Are you ready to submit this section? You cannot return to these questions after proceeding.",
}: TestHeaderProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isLowTime = timeRemaining > 0 && timeRemaining < 300;

  return (
    <>
      <header className="fixed top-0 inset-x-0 h-16 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-4 sm:px-6 flex items-center justify-between z-40 shadow-[var(--ui-shadow-xs)]">
        {/* Left Section Title */}
        <div className="flex-1 flex items-center min-w-0 pr-2">
          <h1 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate font-display">
            {sectionName}
          </h1>
        </div>

        {/* Center Countdown Timer */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] shadow-xs">
            {!isTimerHidden ? (
              <span
                className={`font-mono font-bold text-sm sm:text-base tracking-wider ${
                  isLowTime ? "text-[var(--state-danger)] animate-pulse" : "text-[var(--text-primary)]"
                }`}
              >
                {formatTime(timeRemaining)}
              </span>
            ) : (
              <span className="font-mono text-sm sm:text-base text-[var(--text-muted)] tracking-wider">
                --:--
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsTimerHidden(!isTimerHidden)}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              title={isTimerHidden ? "Show timer" : "Hide timer"}
            >
              {isTimerHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Right Tools & Submit Action */}
        <div className="flex-1 flex justify-end items-center gap-2 sm:gap-3 pl-2">
          {showCalculator && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onToggleCalculator}
              icon={<Calculator className="w-4 h-4" />}
              className="hidden sm:inline-flex"
            >
              <span>Calculator</span>
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="font-bold"
          >
            {buttonText}
          </Button>
        </div>
      </header>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={confirmTitle}
        description={confirmDescription}
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-[var(--ui-radius-sm)] bg-[#faf1de] border border-[#ecd49d] text-xs text-[#8c6b1f] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#c99b3f] mt-0.5" />
            <p className="leading-relaxed">
              Once you proceed, your recorded answers for this module will be permanently submitted.
              Review any flagged questions before continuing.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setConfirmOpen(false);
                onTimeUp();
              }}
            >
              Confirm &amp; Proceed
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

interface TestFooterProps {
  currentIndex: number;
  totalQuestions: number;
  onNext: () => void;
  onPrev: () => void;
  onJump: (index: number) => void;
  answers: Record<string, string>;
  flagged: Record<string, boolean>;
  questions: any[];
}

export function TestFooter({
  currentIndex,
  totalQuestions,
  onNext,
  onPrev,
  onJump,
  answers,
  flagged,
  questions,
}: TestFooterProps) {
  const [navigatorOpen, setNavigatorOpen] = useState(false);

  return (
    <>
      <footer className="fixed bottom-0 inset-x-0 h-16 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] px-4 sm:px-6 flex items-center justify-between z-40 shadow-[0_-1px_3px_rgba(28,25,23,0.04)]">
        {/* Left: Indicator of active test */}
        <div className="flex-1 min-w-0 pr-2 pl-8 sm:pl-0">
          <span className="text-xs font-semibold text-[var(--text-muted)] truncate block">
            RonanSAT Official Exam Engine
          </span>
        </div>

        {/* Center: Question Navigator Toggle */}
        <div className="flex justify-center items-center">
          <button
            type="button"
            onClick={() => setNavigatorOpen(!navigatorOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-canvas)] hover:border-[var(--accent-brand)] text-xs sm:text-sm font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
          >
            <span>Question {currentIndex + 1} of {totalQuestions}</span>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                navigatorOpen ? "-rotate-90" : "rotate-90"
              }`}
            />
          </button>
        </div>

        {/* Right: Prev / Next buttons */}
        <div className="flex-1 flex justify-end items-center gap-2 sm:gap-3 pl-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onPrev}
            disabled={currentIndex === 0}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Back</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onNext}
            disabled={currentIndex === totalQuestions - 1}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
      </footer>

      {/* -----------------------------------------------------------------
          QUESTION NAVIGATOR POPUP
      ------------------------------------------------------------------ */}
      {navigatorOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#1c1917]/20 backdrop-blur-2xs"
            onClick={() => setNavigatorOpen(false)}
          />

          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[92vw] sm:w-[460px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--ui-radius-lg)] p-5 shadow-[var(--ui-shadow-lg)] transition-all animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Question Navigator
              </h3>
              <button
                type="button"
                onClick={() => setNavigatorOpen(false)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-[11px] font-medium text-[var(--text-muted)]">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-xs bg-[var(--text-primary)] text-white text-[9px] font-bold flex items-center justify-center">
                  •
                </div>
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-xs bg-[var(--accent-brand-tint)] border border-[var(--accent-brand)] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-[#8c6b1f]" />
                </div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-xs bg-[var(--bg-canvas)] border border-[var(--border-subtle)]" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 fill-[var(--accent-brand)] text-[var(--accent-brand-strong)]" />
                <span>Review</span>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 max-h-[40vh] overflow-y-auto pr-1">
              {questions.map((q, i) => {
                const isAnswered = !!answers[q._id] && answers[q._id].trim().length > 0;
                const isItemFlagged = !!flagged[q._id];
                const isCurrent = i === currentIndex;

                return (
                  <button
                    key={q._id}
                    type="button"
                    onClick={() => {
                      onJump(i);
                      setNavigatorOpen(false);
                    }}
                    className={`relative w-full aspect-square flex items-center justify-center rounded-[var(--ui-radius-sm)] text-xs font-bold transition-all cursor-pointer border ${
                      isCurrent
                        ? "bg-[var(--text-primary)] border-[var(--text-primary)] text-white shadow-xs"
                        : isAnswered
                        ? "bg-[var(--accent-brand-tint)] border-[var(--accent-brand)] text-[#8c6b1f] hover:bg-[var(--accent-brand-tint)]/80"
                        : "bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <span>{i + 1}</span>
                    {isItemFlagged && (
                      <div className="absolute -top-1 -right-1 bg-[var(--bg-surface)] rounded-full p-0.5 shadow-xs">
                        <Flag className="w-2.5 h-2.5 fill-[var(--accent-brand)] text-[var(--accent-brand-strong)]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
