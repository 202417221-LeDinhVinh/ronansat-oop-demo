"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ModalDialog } from "@/components/ui/ModalDialog";
import RichText from "@/components/RichText";
import Loading from "@/components/Loading";
import api from "@/lib/axios";

interface QuestionData {
  _id: string;
  section?: string;
  module?: number;
  questionText: string;
  passage?: string;
  choices?: string[];
  questionType?: string;
  correctAnswer?: string;
  acceptedAnswers?: string[];
  explanation?: string;
  domain?: string;
  skill?: string;
  imageUrl?: string;
}

interface AnswerRecord {
  questionId: QuestionData;
  userAnswer?: string;
  isCorrect?: boolean;
}

interface ResultDetail {
  _id: string;
  testId?: {
    _id?: string;
    title?: string;
  };
  score?: number;
  sectionBreakdown?: {
    readingAndWriting?: number;
    math?: number;
  };
  rawCorrectCounts?: {
    readingAndWriting?: number;
    math?: number;
    total?: number;
  };
  answers?: AnswerRecord[];
  mode?: string;
  isSectional?: boolean;
  sectionalSubject?: string;
  sectionalModule?: number;
  date?: string;
  createdAt?: string;
}

export default function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const resultId = resolvedParams.id;

  const [result, setResult] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Dialog state
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchResult() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/api/results/${resultId}`);
        setResult(res.data?.result || null);
      } catch (err: any) {
        console.error("Failed to load result detail:", err);
        setError("Could not load score report. Please check if this attempt exists.");
      } finally {
        setLoading(false);
      }
    }

    if (resultId) {
      fetchResult();
    }
  }, [resultId]);

  if (loading) {
    return <Loading message="Loading comprehensive score report..." />;
  }

  if (error || !result) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-danger mx-auto" />
        <h2 className="text-xl font-black font-display text-ink-fg">Score Report Not Found</h2>
        <p className="text-sm text-ink-muted">{error || "The requested attempt could not be located."}</p>
        <Link href="/results">
          <Button variant="primary" size="sm">
            Back to Results List
          </Button>
        </Link>
      </div>
    );
  }

  const answers = result.answers || [];
  const isSectional = result.isSectional || result.mode === "sectional";
  const title =
    typeof result.testId === "object"
      ? result.testId?.title
      : isSectional
      ? `${result.sectionalSubject || "Sectional"} (Module ${result.sectionalModule || 1})`
      : "Digital SAT Official Practice Test";

  const totalQuestions = answers.length;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const incorrectCount = answers.filter((a) => a.userAnswer && !a.isCorrect).length;
  const omittedCount = answers.filter((a) => !a.userAnswer).length;
  const accuracyPct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const selectedAnswer =
    selectedAnswerIndex !== null && answers[selectedAnswerIndex]
      ? answers[selectedAnswerIndex]
      : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between pb-2">
        <Link
          href="/results"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink-fg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Results</span>
        </Link>
        <Badge variant={isSectional ? "info" : "brand"}>
          {isSectional ? "Sectional Report" : "Full-Length Report"}
        </Badge>
      </div>

      {/* Main Score Hero Card */}
      <div className="workbook-panel p-6 sm:p-8 bg-gradient-to-br from-surface-white via-surface-white to-brand-tint/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Official SAT Score Report
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-ink-fg font-display tracking-tight">
              {title}
            </h1>
            <p className="text-xs text-ink-muted flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Completed on{" "}
                {new Date(result.createdAt || result.date || Date.now()).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </p>
          </div>

          {/* Large Scaled Score Stamp */}
          <div className="flex items-center gap-4 p-4 rounded-[var(--ui-radius)] border border-border bg-surface-white shadow-[var(--ui-shadow)]">
            <div className="w-12 h-12 rounded-full border border-border bg-brand-tint text-brand-strong flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted block">
                Total Scaled Score
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-4xl sm:text-5xl font-black tracking-tight text-ink-fg tabular-nums leading-none">
                  {result.score || 0}
                </span>
                <span className="text-xs font-bold text-ink-muted">
                  {isSectional ? "/ 800" : "/ 1600"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Score Bars (for full-length) */}
        {result.sectionBreakdown && !isSectional && (
          <div className="mt-8 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-[var(--ui-radius-sm)] border border-border bg-surface-white">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-ink-fg font-bold">Reading and Writing</span>
                <span className="font-display font-black text-base text-ink-fg tabular-nums">
                  {result.sectionBreakdown.readingAndWriting || 0} / 800
                </span>
              </div>
              <div className="w-full bg-paper-bg h-2 rounded-full overflow-hidden border border-border">
                <div
                  className="bg-brand h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(10, (((result.sectionBreakdown.readingAndWriting || 200) - 200) / 600) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-[var(--ui-radius-sm)] border border-border bg-surface-white">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-ink-fg font-bold">Math (with Desmos)</span>
                <span className="font-display font-black text-base text-ink-fg tabular-nums">
                  {result.sectionBreakdown.math || 0} / 800
                </span>
              </div>
              <div className="w-full bg-paper-bg h-2 rounded-full overflow-hidden border border-border">
                <div
                  className="bg-brand h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(10, (((result.sectionBreakdown.math || 200) - 200) / 600) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Answer Performance Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="workbook-panel p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">
            Total Answered
          </p>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-black text-ink-fg tabular-nums">
            {correctCount + incorrectCount} / {totalQuestions}
          </p>
        </div>
        <div className="workbook-panel p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-success">
            Correct Answers
          </p>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-black text-success tabular-nums">
            {correctCount}
          </p>
        </div>
        <div className="workbook-panel p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-danger">
            Incorrect Misses
          </p>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-black text-danger tabular-nums">
            {incorrectCount}
          </p>
        </div>
        <div className="workbook-panel p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">
            Overall Accuracy
          </p>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-black text-brand-strong tabular-nums">
            {accuracyPct}%
          </p>
        </div>
      </div>

      {/* Question Review Grid */}
      <section className="workbook-panel overflow-hidden">
        <div className="border-b border-border-strong bg-paper-bg px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-black tracking-tight text-ink-fg">
              Question Navigator &amp; Review
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Select any question number to review your answer, the official solution, and KaTeX explanation.
            </p>
          </div>

          {/* Grid Legend */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#e8f7f0] border border-success" />
              <span className="text-success">Correct</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#fdede8] border border-danger" />
              <span className="text-danger">Incorrect</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-paper-bg border border-border" />
              <span className="text-ink-muted">Omitted</span>
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {answers.length === 0 ? (
            <p className="text-xs text-ink-muted text-center py-6">
              No individual question answers recorded for this attempt.
            </p>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2.5">
              {answers.map((answer, index) => {
                const isCorrect = answer.isCorrect;
                const isOmitted = !answer.userAnswer;

                const buttonStyle = isCorrect
                  ? "border-[#b2e5ce] bg-[#e8f7f0] text-[#166e4b] hover:bg-[#1f9d6b] hover:text-white"
                  : isOmitted
                  ? "border-border bg-paper-bg text-ink-muted hover:border-border-strong hover:text-ink-fg"
                  : "border-[#f8c4b4] bg-[#fdede8] text-[#ab3d19] hover:bg-[#e0592f] hover:text-white";

                return (
                  <button
                    key={answer.questionId?._id || index}
                    type="button"
                    onClick={() => {
                      setSelectedAnswerIndex(index);
                      setReviewDialogOpen(true);
                    }}
                    className={`h-10 rounded-[var(--ui-radius-sm)] border font-display font-bold text-xs flex flex-col items-center justify-center transition-all duration-150 workbook-press ${buttonStyle}`}
                    aria-label={`Question ${index + 1}: ${
                      isCorrect ? "Correct" : isOmitted ? "Omitted" : "Incorrect"
                    }`}
                  >
                    <span>{index + 1}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Question Detail Review Modal */}
      <ModalDialog
        open={reviewDialogOpen && selectedAnswer !== null}
        onClose={() => setReviewDialogOpen(false)}
        title={
          selectedAnswerIndex !== null
            ? `Question ${selectedAnswerIndex + 1} of ${totalQuestions}`
            : "Question Review"
        }
        maxWidthClassName="max-w-3xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={selectedAnswerIndex === null || selectedAnswerIndex === 0}
                onClick={() =>
                  selectedAnswerIndex !== null && setSelectedAnswerIndex(selectedAnswerIndex - 1)
                }
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                <span>Previous</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={selectedAnswerIndex === null || selectedAnswerIndex === totalQuestions - 1}
                onClick={() =>
                  selectedAnswerIndex !== null && setSelectedAnswerIndex(selectedAnswerIndex + 1)
                }
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            <Button variant="primary" size="sm" onClick={() => setReviewDialogOpen(false)}>
              Close Review
            </Button>
          </div>
        }
      >
        {selectedAnswer && (
          <div className="space-y-5">
            {/* Question Metadata Chips */}
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-border">
              <Badge variant={selectedAnswer.isCorrect ? "success" : "danger"}>
                {selectedAnswer.isCorrect
                  ? "Correct"
                  : selectedAnswer.userAnswer
                  ? "Incorrect"
                  : "Omitted"}
              </Badge>
              {selectedAnswer.questionId?.domain && (
                <Badge variant="muted">{selectedAnswer.questionId.domain}</Badge>
              )}
              {selectedAnswer.questionId?.skill && (
                <Badge variant="muted">{selectedAnswer.questionId.skill}</Badge>
              )}
            </div>

            {/* Reading Passage (if present) */}
            {selectedAnswer.questionId?.passage && (
              <div className="p-4 rounded-[var(--ui-radius-sm)] border border-border bg-paper-bg max-h-56 overflow-y-auto rich-text text-xs leading-relaxed">
                <RichText content={selectedAnswer.questionId.passage} />
              </div>
            )}

            {/* Question Text */}
            <div className="rich-text font-medium text-sm text-ink-fg leading-relaxed">
              <RichText content={selectedAnswer.questionId?.questionText || ""} />
            </div>

            {/* Choices or SPR Answer Comparison */}
            {selectedAnswer.questionId?.choices && selectedAnswer.questionId.choices.length > 0 ? (
              <div className="space-y-2 pt-2">
                {selectedAnswer.questionId.choices.map((choice, cIdx) => {
                  const letter = String.fromCharCode(65 + cIdx);
                  const isUserPick = selectedAnswer.userAnswer === letter;
                  const isCorrectAnswer = selectedAnswer.questionId.correctAnswer === letter;

                  let borderStyle = "border-border bg-surface-white";
                  if (isCorrectAnswer) {
                    borderStyle = "border-success bg-[#e8f7f0] text-success";
                  } else if (isUserPick && !selectedAnswer.isCorrect) {
                    borderStyle = "border-danger bg-[#fdede8] text-danger";
                  }

                  return (
                    <div
                      key={letter}
                      className={`flex items-start gap-3 p-3 rounded-[var(--ui-radius-sm)] border text-xs leading-normal ${borderStyle}`}
                    >
                      <span className="w-5 h-5 rounded-full border border-current font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {letter}
                      </span>
                      <div className="flex-1 rich-text">
                        <RichText content={choice} />
                      </div>
                      {isCorrectAnswer && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-success shrink-0">
                          Correct Answer
                        </span>
                      )}
                      {isUserPick && !isCorrectAnswer && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-danger shrink-0">
                          Your Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Student Produced Response (SPR) comparison */
              <div className="p-4 rounded-[var(--ui-radius-sm)] border border-border bg-paper-bg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink-muted">Your Answer:</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      selectedAnswer.isCorrect ? "text-success" : "text-danger"
                    }`}
                  >
                    {selectedAnswer.userAnswer || "Omitted"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="font-bold text-ink-muted">Accepted Answer(s):</span>
                  <span className="font-mono font-bold text-sm text-success">
                    {selectedAnswer.questionId?.acceptedAnswers?.join(", ") ||
                      selectedAnswer.questionId?.correctAnswer ||
                      "—"}
                  </span>
                </div>
              </div>
            )}

            {/* Official Solution & Explanation */}
            {selectedAnswer.questionId?.explanation && (
              <div className="mt-4 p-4 rounded-[var(--ui-radius-sm)] border border-[#ecd49d] bg-brand-tint/50 text-xs">
                <span className="font-bold text-brand-strong uppercase tracking-wider block mb-1.5 text-[10px]">
                  Official Solution &amp; Explanation
                </span>
                <div className="rich-text leading-relaxed text-ink-fg">
                  <RichText content={selectedAnswer.questionId.explanation} />
                </div>
              </div>
            )}
          </div>
        )}
      </ModalDialog>
    </div>
  );
}
