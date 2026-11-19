"use client";

import React, { useState } from "react";
import { Flag, X, FileText, HelpCircle as QuestionIcon } from "lucide-react";
import RichText from "@/components/RichText";
import { Badge } from "@/components/ui/Badge";

export interface QuestionViewerProps {
  question: any;
  userAnswer?: string;
  onAnswerSelect: (questionId: string, answer: string) => void;
  isFlagged: boolean;
  onToggleFlag: (questionId: string) => void;
  index: number;
}

export default function QuestionViewer({
  question,
  userAnswer = "",
  onAnswerSelect,
  isFlagged,
  onToggleFlag,
  index,
}: QuestionViewerProps) {
  const optionLabels = ["A", "B", "C", "D"];
  const [crossedOut, setCrossedOut] = useState<string[]>([]);
  const [mobileTab, setMobileTab] = useState<"passage" | "question">("question");

  const isSpr =
    question.questionType === "spr" ||
    !question.choices ||
    question.choices.length === 0;

  const toggleCrossOut = (e: React.MouseEvent, choice: string) => {
    e.stopPropagation();
    if (crossedOut.includes(choice)) {
      setCrossedOut(crossedOut.filter((c) => c !== choice));
    } else {
      setCrossedOut([...crossedOut, choice]);
    }
  };

  const hasPassage = !!question.passage && question.passage.trim().length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] mt-16 mb-16 overflow-hidden bg-canvas">
      {/* Mobile Tab Switcher if question has passage */}
      {hasPassage && (
        <div className="lg:hidden flex items-center border-b border-border bg-surface-white px-4 py-2 shrink-0">
          <div className="flex items-center gap-1 w-full bg-canvas p-1 rounded-[var(--ui-radius-sm)] border border-border">
            <button
              type="button"
              onClick={() => setMobileTab("passage")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-[var(--ui-radius-sm)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === "passage"
                  ? "bg-surface-white text-ink-fg shadow-xs"
                  : "text-ink-muted"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Passage</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("question")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-[var(--ui-radius-sm)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === "question"
                  ? "bg-surface-white text-ink-fg shadow-xs"
                  : "text-ink-muted"
              }`}
            >
              <QuestionIcon className="w-3.5 h-3.5" />
              <span>Question {index + 1}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Pane Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Passage (for Reading & Writing) */}
        {hasPassage && (
          <div
            className={`w-full lg:w-1/2 border-r border-border h-full overflow-y-auto p-6 sm:p-8 lg:p-10 bg-surface-white ${
              mobileTab === "passage" ? "block" : "hidden lg:block"
            }`}
          >
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Reading &amp; Writing Passage
                </span>
                {question.domain && (
                  <Badge variant="muted" size="sm">
                    {question.domain}
                  </Badge>
                )}
              </div>

              {/* Optional Figure / Image */}
              {question.imageUrl && (
                <div className="flex justify-center p-4 rounded-[var(--ui-radius)] border border-border bg-canvas">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={question.imageUrl}
                    alt="Question Graphic"
                    className="max-h-[300px] object-contain rounded"
                  />
                </div>
              )}

              {/* Passage Body */}
              <div className="text-base sm:text-lg leading-relaxed text-ink-fg">
                <RichText content={question.passage} />
              </div>
            </div>
          </div>
        )}

        {/* Right Pane: Question Prompt & Choices / SPR */}
        <div
          className={`flex-1 h-full overflow-y-auto p-6 sm:p-8 lg:p-10 bg-surface-white ${
            hasPassage ? (mobileTab === "question" ? "block" : "hidden lg:block") : "w-full"
          }`}
        >
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Question Top Meta Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[var(--ui-radius-sm)] bg-ink-fg text-white font-bold flex items-center justify-center text-sm shadow-xs font-mono">
                  {index + 1}
                </div>
                <div>
                  <span className="text-xs font-semibold text-ink-muted">
                    Question {index + 1}
                  </span>
                  {question.skill && (
                    <span className="hidden sm:inline-block ml-2 text-xs text-ink-muted">
                      · {question.skill}
                    </span>
                  )}
                </div>
              </div>

              {/* Mark for Review Flag Button */}
              <button
                type="button"
                onClick={() => onToggleFlag(question._id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--ui-radius-sm)] text-xs font-semibold border transition-all cursor-pointer ${
                  isFlagged
                    ? "bg-brand-tint border-[#ecd49d] text-brand-strong"
                    : "bg-surface-white border-border text-ink-muted hover:text-ink-fg hover:border-border-strong"
                }`}
              >
                <Flag
                  className={`w-3.5 h-3.5 ${
                    isFlagged ? "fill-brand text-brand-strong" : ""
                  }`}
                />
                <span>{isFlagged ? "Marked for Review" : "Mark for Review"}</span>
              </button>
            </div>

            {/* If no passage on left but has an image (e.g. Math linear graphs) */}
            {!hasPassage && question.imageUrl && (
              <div className="flex justify-center p-4 rounded-[var(--ui-radius)] border border-border bg-canvas">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={question.imageUrl}
                  alt="Question Graph or Diagram"
                  className="max-h-[300px] object-contain rounded"
                />
              </div>
            )}

            {/* Question Text / Prompt */}
            <div className="text-base sm:text-lg font-medium text-ink-fg leading-relaxed">
              <RichText content={question.questionText} />
            </div>

            {/* =============================================================
                CHOICES: MULTIPLE CHOICE OR STUDENT PRODUCED RESPONSE (SPR)
            ============================================================== */}
            {isSpr ? (
              /* Student Produced Response (SPR) Free-form Input */
              <div className="p-6 rounded-[var(--ui-radius)] border border-border-strong bg-canvas space-y-4 brutal-shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="brand" size="sm">
                      Student-Produced Response
                    </Badge>
                    <span className="text-xs font-semibold text-ink-muted">
                      Numeric or Fraction
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={`spr-input-${question._id}`}
                    className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2"
                  >
                    Your Answer
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id={`spr-input-${question._id}`}
                      type="text"
                      maxLength={7}
                      value={userAnswer || ""}
                      onChange={(e) => onAnswerSelect(question._id, e.target.value.trim())}
                      placeholder="e.g. 28, 0.5, or 1/2"
                      className="workbook-input max-w-xs text-lg font-mono font-bold tracking-wider bg-surface-white"
                    />
                    {userAnswer && (
                      <span className="text-xs font-mono font-semibold px-2.5 py-1.5 rounded-[var(--ui-radius-sm)] bg-surface-white border border-border text-ink-fg">
                        Entered: <strong>{userAnswer}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-ink-muted space-y-1 pt-2 border-t border-border">
                  <p>
                    • Acceptable formats: integers (e.g. <code className="font-mono font-bold text-ink-fg">28</code>),
                    decimals (e.g. <code className="font-mono font-bold text-ink-fg">0.5</code> or <code className="font-mono font-bold text-ink-fg">.5</code>),
                    fractions (e.g. <code className="font-mono font-bold text-ink-fg">1/2</code>).
                  </p>
                  <p>• Negative values (e.g. <code className="font-mono font-bold text-ink-fg">-3/4</code>) are supported if required.</p>
                </div>
              </div>
            ) : (
              /* Multiple Choice 4 Options */
              <div className="space-y-3 pt-2">
                {question.choices.map((choice: string, i: number) => {
                  const isSelected = userAnswer === choice;
                  const isCrossed = crossedOut.includes(choice);
                  const label = optionLabels[i] || "";

                  return (
                    <div
                      key={i}
                      className="relative flex items-center group cursor-pointer"
                      onClick={() => !isCrossed && onAnswerSelect(question._id, choice)}
                    >
                      {/* Cross out button on hover */}
                      <button
                        type="button"
                        onClick={(e) => toggleCrossOut(e, choice)}
                        className="hidden sm:flex absolute -left-9 p-1 rounded text-ink-muted hover:text-[var(--state-danger)] hover:bg-[#fdede8] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title={isCrossed ? "Restore choice" : "Cross out choice"}
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Choice Card */}
                      <div
                        className={`flex-1 flex items-start gap-4 p-4 rounded-[var(--ui-radius)] border transition-all duration-150 ${
                          isSelected
                            ? "bg-brand-tint/60 border-brand-strong brutal-shadow-xs"
                            : "bg-surface-white border-border-strong hover:border-brand"
                        } ${isCrossed ? "opacity-35 line-through pointer-events-none" : ""}`}
                      >
                        {/* Radio Letter Bubble */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isSelected
                              ? "bg-brand text-ink-fg shadow-xs"
                              : "border border-border-strong text-ink-muted bg-canvas"
                          }`}
                        >
                          {label}
                        </div>

                        {/* Choice Text with KaTeX */}
                        <div className="flex-1 pt-0.5 text-sm sm:text-base text-ink-fg font-medium leading-relaxed">
                          <RichText content={choice} as="span" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
