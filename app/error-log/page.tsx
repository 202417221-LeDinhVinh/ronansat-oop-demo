"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Tag,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import RichText from "@/components/RichText";
import api from "@/lib/axios";

const MISTAKE_REASONS = [
  "Careless",
  "Concept gap",
  "Misread question",
  "Time pressure",
  "Guessed",
  "Unclassified",
];

interface ErrorLogEntry {
  _id: string;
  timesMissed: number;
  reason: string;
  note?: string;
  status: "open" | "resolved";
  lastAttemptedAt?: string;
  resolvedAt?: string | null;
  testTitle?: string;
  question: {
    _id: string;
    section: string;
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
  };
}

export default function ErrorLogPage() {
  const [entries, setEntries] = useState<ErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterSection, setFilterSection] = useState<string>("");
  const [filterReason, setFilterReason] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("open");

  // Inline Retry States per entry
  const [retryAnswers, setRetryAnswers] = useState<Record<string, string>>({});
  const [retryResults, setRetryResults] = useState<Record<string, { isCorrect: boolean; message: string }>>({});
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Notes state
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  // Explanation accordion state
  const [openExplanations, setOpenExplanations] = useState<Record<string, boolean>>({});

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterSection) params.append("section", filterSection);
      if (filterReason) params.append("reason", filterReason);
      if (filterStatus) params.append("status", filterStatus);

      const res = await api.get(`/api/error-log?${params.toString()}`);
      const data = res.data?.entries || [];
      setEntries(data);

      // Pre-fill notes state
      const noteMap: Record<string, string> = {};
      data.forEach((e: ErrorLogEntry) => {
        noteMap[e._id] = e.note || "";
      });
      setNotes(noteMap);
    } catch (err: any) {
      console.error("Failed to load error log:", err);
      setError("Failed to load error log entries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [filterSection, filterReason, filterStatus]);

  // Update Mistake Reason
  const handleUpdateReason = async (entryId: string, newReason: string) => {
    try {
      await api.patch(`/api/error-log/${entryId}`, { reason: newReason });
      setEntries((prev) =>
        prev.map((e) => (e._id === entryId ? { ...e, reason: newReason } : e))
      );
    } catch (err) {
      console.error("Failed to update mistake reason:", err);
    }
  };

  // Toggle Status (open <-> resolved)
  const handleToggleStatus = async (entryId: string, currentStatus: "open" | "resolved") => {
    const nextStatus = currentStatus === "open" ? "resolved" : "open";
    try {
      await api.patch(`/api/error-log/${entryId}`, { status: nextStatus });
      setEntries((prev) =>
        prev.map((e) => (e._id === entryId ? { ...e, status: nextStatus } : e))
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  // Save Note
  const handleSaveNote = async (entryId: string) => {
    try {
      setSavingNoteId(entryId);
      const noteText = notes[entryId] || "";
      await api.patch(`/api/error-log/${entryId}`, { note: noteText });
      setEntries((prev) =>
        prev.map((e) => (e._id === entryId ? { ...e, note: noteText } : e))
      );
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSavingNoteId(null);
    }
  };

  // Submit Inline Retry
  const handleRetrySubmit = async (entryId: string) => {
    const ans = retryAnswers[entryId];
    if (!ans) return;

    try {
      setRetryingId(entryId);
      const res = await api.post(`/api/error-log/${entryId}/retry`, {
        answer: ans.trim(),
      });

      const isCorrect = res.data?.isCorrect;
      setRetryResults((prev) => ({
        ...prev,
        [entryId]: {
          isCorrect,
          message: isCorrect
            ? "Correct! Mistake resolved automatically."
            : "Incorrect answer. Try again or review the explanation.",
        },
      }));

      if (isCorrect) {
        setEntries((prev) =>
          prev.map((e) => (e._id === entryId ? { ...e, status: "resolved" } : e))
        );
      }
    } catch (err: any) {
      console.error("Retry failed:", err);
      setRetryResults((prev) => ({
        ...prev,
        [entryId]: {
          isCorrect: false,
          message: err.response?.data?.error || "Retry submission failed.",
        },
      }));
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <PageHeader
        title="Error Log & Mistake Notebook"
        description="Every missed or omitted question across your test attempts, deduplicated with root-cause tagging and inline retries."
        badge={<Badge variant="danger">{entries.length} Entries</Badge>}
      />

      {/* Filter Bar */}
      <Card className="p-4 bg-[var(--bg-surface)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="workbook-input"
            >
              <option value="">All Sections</option>
              <option value="Reading and Writing">Reading and Writing</option>
              <option value="Math">Math</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Mistake Reason
            </label>
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="workbook-input"
            >
              <option value="">All Reasons</option>
              {MISTAKE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="workbook-input"
            >
              <option value="">All Statuses</option>
              <option value="open">Open (Needs Review)</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Entries List */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8" />}
          title={
            filterStatus === "open"
              ? "All caught up! Zero open mistakes."
              : "No mistakes match the active filters."
          }
          description="Great job! Take more practice tests or sectional modules to challenge your skills."
          action={
            <Link href="/practice">
              <Button variant="primary" size="sm">
                Start Practice Drill
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => {
            const q = entry.question;
            const isResolved = entry.status === "resolved";
            const isSpr =
              q.questionType === "spr" || !q.choices || q.choices.length === 0;
            const retryRes = retryResults[entry._id];
            const explanationOpen = openExplanations[entry._id];

            return (
              <Card
                key={entry._id}
                className={`transition-all duration-150 ${
                  isResolved ? "opacity-85 bg-[var(--bg-canvas)]/40" : ""
                }`}
              >
                {/* Entry Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={q.section === "Math" ? "brand" : "info"} size="sm">
                      {q.section}
                    </Badge>
                    {q.skill && (
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {q.skill}
                      </span>
                    )}
                    {q.domain && (
                      <span className="text-xs text-[var(--text-muted)]">
                        ({q.domain})
                      </span>
                    )}
                    <Badge variant={entry.timesMissed > 1 ? "danger" : "muted"} size="sm">
                      Missed {entry.timesMissed}x
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(entry._id, entry.status)}
                      className={`px-3 py-1 text-xs font-bold rounded-[var(--ui-radius-sm)] border transition-all cursor-pointer ${
                        isResolved
                          ? "bg-[#e8f7f0] text-[#166e4b] border-[#b2e5ce] hover:bg-[#d4f2e3]"
                          : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-strong)] hover:border-[var(--accent-brand)]"
                      }`}
                    >
                      {isResolved ? "✓ Resolved" : "Mark Resolved"}
                    </button>
                  </div>
                </div>

                {/* Passage if R&W */}
                {q.passage && (
                  <div className="mt-4 p-4 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs sm:text-sm text-[var(--text-primary)] max-h-48 overflow-y-auto leading-relaxed">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                      Passage Context
                    </span>
                    <RichText content={q.passage} />
                  </div>
                )}

                {/* Graphic image if present */}
                {q.imageUrl && (
                  <div className="mt-4 flex justify-center p-3 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={q.imageUrl}
                      alt="Question Graphic"
                      className="max-h-40 object-contain rounded"
                    />
                  </div>
                )}

                {/* Question Prompt */}
                <div className="mt-4 text-sm sm:text-base font-semibold text-[var(--text-primary)] leading-relaxed">
                  <RichText content={q.questionText} />
                </div>

                {/* -------------------------------------------------------------
                    INLINE RETRY DRAWER
                -------------------------------------------------------------- */}
                <div className="mt-5 p-4 rounded-[var(--ui-radius)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-[var(--accent-brand-strong)]" />
                      Inline Question Retry
                    </span>
                    {isSpr && (
                      <Badge variant="muted" size="sm">
                        SPR Numeric Input
                      </Badge>
                    )}
                  </div>

                  {isSpr ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 28, 0.5, 1/2"
                        value={retryAnswers[entry._id] || ""}
                        onChange={(e) =>
                          setRetryAnswers((prev) => ({
                            ...prev,
                            [entry._id]: e.target.value,
                          }))
                        }
                        className="workbook-input max-w-xs font-mono font-bold"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        loading={retryingId === entry._id}
                        onClick={() => handleRetrySubmit(entry._id)}
                      >
                        Submit Retry
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.choices?.map((choice: string, idx: number) => {
                          const optionLabel = ["A", "B", "C", "D"][idx] || "";
                          const isSelected = retryAnswers[entry._id] === choice;

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                setRetryAnswers((prev) => ({
                                  ...prev,
                                  [entry._id]: choice,
                                }))
                              }
                              className={`p-2.5 text-left rounded-[var(--ui-radius-sm)] border text-xs font-medium transition-all flex items-start gap-2.5 cursor-pointer ${
                                isSelected
                                  ? "bg-[var(--accent-brand-tint)] border-[var(--accent-brand)] text-[var(--text-primary)] font-bold shadow-xs"
                                  : "bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[var(--accent-brand)]"
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                  isSelected
                                    ? "bg-[var(--accent-brand)] text-[var(--text-on-brand)]"
                                    : "bg-[var(--bg-canvas)] border border-[var(--border-strong)] text-[var(--text-muted)]"
                                }`}
                              >
                                {optionLabel}
                              </span>
                              <div className="flex-1 leading-normal">
                                <RichText content={choice} as="span" />
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Button
                          variant="primary"
                          size="sm"
                          loading={retryingId === entry._id}
                          disabled={!retryAnswers[entry._id]}
                          onClick={() => handleRetrySubmit(entry._id)}
                        >
                          Check Answer
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Retry Feedback Banner */}
                  {retryRes && (
                    <div
                      className={`p-3 rounded-[var(--ui-radius-sm)] text-xs font-semibold flex items-center gap-2 ${
                        retryRes.isCorrect
                          ? "bg-[#e8f7f0] border border-[#b2e5ce] text-[#166e4b]"
                          : "bg-[#fdede8] border border-[#f8c4b4] text-[#ab3d19]"
                      }`}
                    >
                      {retryRes.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{retryRes.message}</span>
                    </div>
                  )}
                </div>

                {/* -------------------------------------------------------------
                    REASON TAGGING & STUDENT NOTES
                -------------------------------------------------------------- */}
                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Tag Mistake Reason
                    </label>
                    <select
                      value={entry.reason || "Unclassified"}
                      onChange={(e) => handleUpdateReason(entry._id, e.target.value)}
                      className="workbook-input text-xs"
                    >
                      {MISTAKE_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Personal Learning Note</span>
                      <button
                        type="button"
                        onClick={() => handleSaveNote(entry._id)}
                        disabled={savingNoteId === entry._id}
                        className="text-[var(--accent-brand-strong)] hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                      >
                        <Save className="w-3 h-3" />
                        <span>{savingNoteId === entry._id ? "Saving..." : "Save Note"}</span>
                      </button>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Remember to check negative signs..."
                      value={notes[entry._id] || ""}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [entry._id]: e.target.value }))
                      }
                      className="workbook-input text-xs"
                    />
                  </div>
                </div>

                {/* Explanation Accordion Toggle */}
                {q.explanation && (
                  <div className="mt-4 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenExplanations((prev) => ({
                          ...prev,
                          [entry._id]: !prev[entry._id],
                        }))
                      }
                      className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{explanationOpen ? "Hide Explanation" : "View Explanation & Rationale"}</span>
                      {explanationOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {explanationOpen && (
                      <div className="mt-3 p-4 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
                        <RichText content={q.explanation} />
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
