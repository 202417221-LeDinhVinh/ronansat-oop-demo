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
  BookOpen,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
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
  date?: string;
}

export default function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const resultId = resolvedParams.id;

  const [result, setResult] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Drawer state
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(0);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);

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
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loading message="Generating official SAT score report..." />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertCircle className="w-12 h-12 text-[var(--state-danger)] mx-auto" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Score Report Unavailable</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">{error}</p>
        <Link href="/results">
          <Button variant="secondary" size="md">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Return to Results</span>
          </Button>
        </Link>
      </div>
    );
  }

  const isSectional = result.isSectional || result.mode === "sectional";
  const displayScore = isSectional
    ? Math.max(200, result.score ?? 200)
    : Math.max(400, result.score ?? 400);
  const answers = result.answers || [];
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const incorrectCount = answers.filter((a) => !a.isCorrect && !!a.userAnswer && a.userAnswer !== "Omitted").length;
  const omittedCount = answers.length - correctCount - incorrectCount;
  const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  const activeRecord = selectedAnswerIndex !== null ? answers[selectedAnswerIndex] : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between pb-2">
        <Link
          href="/results"
          className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Results</span>
        </Link>

        <Link href="/error-log">
          <Button variant="secondary" size="sm">
            <AlertCircle className="w-4 h-4 mr-1.5 text-[var(--state-danger)]" />
            <span>Open Error Log</span>
          </Button>
        </Link>
      </div>

      {/* Main Score Hero Card */}
      <Card className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--accent-brand-tint)]/25">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={isSectional ? "info" : "brand"}>
                {isSectional ? "Sectional Test" : "Official Digital SAT"}
              </Badge>
              <span className="text-xs text-[var(--text-muted)] font-medium">
                Simplified linear scale (see README)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-display">
              {result.testId?.title || "Official SAT Practice Test"}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Completed attempt on {result.date ? new Date(result.date).toLocaleDateString() : "Today"}
            </p>
          </div>

          {/* Big Score Display */}
          <div className="flex items-baseline gap-4 p-5 rounded-[var(--ui-radius)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--ui-shadow-xs)] shrink-0">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Total Scaled Score
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-4xl sm:text-5xl font-black text-[var(--text-primary)]">
                  {displayScore}
                </span>
                <span className="text-sm font-semibold text-[var(--text-muted)]">
                  {isSectional ? "/ 800" : "/ 1600"}
                </span>
              </div>
            </div>

            <div className="pl-4 border-l border-[var(--border-subtle)] text-right">
              <span className="text-xs font-semibold text-[var(--text-muted)] block">Accuracy</span>
              <span className="text-2xl font-bold text-[var(--state-success)] block mt-1">
                {accuracy}%
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                {correctCount}/{answers.length} correct
              </span>
            </div>
          </div>
        </div>

        {/* Section Score Breakdown Bar */}
        {result.sectionBreakdown && !isSectional && (
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[var(--border-subtle)]">
            <div className="p-4 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Reading &amp; Writing
                </span>
                <span className="text-xl font-black text-[var(--text-primary)]">
                  {result.sectionBreakdown.readingAndWriting || 0}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Raw: {result.rawCorrectCounts?.readingAndWriting || 0} correct questions
              </p>
            </div>

            <div className="p-4 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Math Section
                </span>
                <span className="text-xl font-black text-[var(--text-primary)]">
                  {result.sectionBreakdown.math || 0}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Raw: {result.rawCorrectCounts?.math || 0} correct questions
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* ===================================================================
          QUESTION GRID SECTION
      ==================================================================== */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border-subtle)] mb-5">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] font-display">
              Question-by-Question Review Grid
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Click any question below to inspect your answer, the official explanation, and correct answer.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#1f9d6b]" />
              <span>Correct ({correctCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#e0592f]" />
              <span>Incorrect ({incorrectCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#cbd5e1]" />
              <span>Omitted ({omittedCount})</span>
            </div>
          </div>
        </div>

        {/* Question Palette Buttons */}
        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 gap-2">
          {answers.map((record, idx) => {
            const isCorrect = record.isCorrect;
            const isOmitted = !record.userAnswer || record.userAnswer === "Omitted";
            const isSelected = selectedAnswerIndex === idx && reviewDrawerOpen;

            let colorClasses =
              "bg-[#e8f7f0] text-[#166e4b] border-[#b2e5ce] hover:bg-[#d4f2e3]";
            if (!isCorrect) {
              if (isOmitted) {
                colorClasses =
                  "bg-[var(--bg-canvas)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:bg-[#f1f5f9]";
              } else {
                colorClasses =
                  "bg-[#fdede8] text-[#ab3d19] border-[#f8c4b4] hover:bg-[#fbdcd2]";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedAnswerIndex(idx);
                  setReviewDrawerOpen(true);
                }}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-[var(--ui-radius-sm)] border text-xs font-bold transition-all cursor-pointer ${colorClasses} ${
                  isSelected ? "ring-2 ring-[var(--text-primary)] ring-offset-1" : ""
                }`}
              >
                <span>{idx + 1}</span>
                {isCorrect ? (
                  <CheckCircle2 className="w-2.5 h-2.5 opacity-70 mt-0.5" />
                ) : isOmitted ? null : (
                  <XCircle className="w-2.5 h-2.5 opacity-70 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ===================================================================
          REVIEW PANEL MODAL / DRAWER
      ==================================================================== */}
      {reviewDrawerOpen && activeRecord && (
        <Dialog
          open={reviewDrawerOpen}
          onClose={() => setReviewDrawerOpen(false)}
          title={`Question ${selectedAnswerIndex! + 1} Review`}
          description={`${activeRecord.questionId?.section || "SAT"} · Module ${
            activeRecord.questionId?.module || 1
          } · ${activeRecord.questionId?.skill || "Skill Practice"}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 pt-2">
            {/* Passage if present */}
            {activeRecord.questionId?.passage && (
              <div className="p-4 rounded-[var(--ui-radius)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm leading-relaxed text-[var(--text-primary)] max-h-56 overflow-y-auto">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Reading Passage
                </span>
                <RichText content={activeRecord.questionId?.passage} />
              </div>
            )}

            {/* Graphic image if present */}
            {activeRecord.questionId?.imageUrl && (
              <div className="flex justify-center p-3 rounded-[var(--ui-radius)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeRecord.questionId.imageUrl}
                  alt="Figure Graphic"
                  className="max-h-48 object-contain rounded"
                />
              </div>
            )}

            {/* Question Text */}
            <div className="text-base font-semibold text-[var(--text-primary)] leading-relaxed">
              <RichText content={activeRecord.questionId?.questionText} />
            </div>

            {/* Answer Comparison Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div
                className={`p-3.5 rounded-[var(--ui-radius-sm)] border ${
                  activeRecord.isCorrect
                    ? "bg-[#e8f7f0] border-[#b2e5ce] text-[#166e4b]"
                    : "bg-[#fdede8] border-[#f8c4b4] text-[#ab3d19]"
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider block">
                  Your Submitted Answer
                </span>
                <span className="text-lg font-bold font-mono mt-1 block">
                  {activeRecord.userAnswer || "Omitted"}
                </span>
              </div>

              <div className="p-3.5 rounded-[var(--ui-radius-sm)] bg-[#e8f7f0] border border-[#b2e5ce] text-[#166e4b]">
                <span className="text-[11px] font-bold uppercase tracking-wider block">
                  Correct Answer
                </span>
                <span className="text-lg font-bold font-mono mt-1 block">
                  {activeRecord.questionId?.correctAnswer ||
                    activeRecord.questionId?.acceptedAnswers?.join(" or ") ||
                    "N/A"}
                </span>
              </div>
            </div>

            {/* Step-by-Step Official Explanation */}
            {activeRecord.questionId?.explanation && (
              <div className="p-4 rounded-[var(--ui-radius)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Official Explanation &amp; Rationale
                </span>
                <div className="text-sm leading-relaxed text-[var(--text-primary)]">
                  <RichText content={activeRecord.questionId.explanation} />
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={selectedAnswerIndex === 0}
                  onClick={() => setSelectedAnswerIndex((prev) => (prev !== null ? prev - 1 : 0))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={selectedAnswerIndex === answers.length - 1}
                  onClick={() => setSelectedAnswerIndex((prev) => (prev !== null ? prev + 1 : 0))}
                >
                  Next
                </Button>
              </div>

              {!activeRecord.isCorrect && (
                <Link href="/error-log">
                  <Button variant="ghost" size="sm" className="text-xs text-[var(--accent-brand-strong)]">
                    <span>View in Error Log</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
