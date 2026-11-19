"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Tag,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import RichText from "@/components/RichText";
import CardHoverPlate from "@/components/ui/CardHoverPlate";
import api from "@/lib/axios";

const MISTAKE_REASONS = [
  "Careless",
  "Concept gap",
  "Misread question",
  "Time pressure",
  "Guessed",
  "Unclassified",
];

const REASON_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Careless: { bg: "bg-[#fbe1d3]", text: "text-[#8c4015]", border: "border-[#f5be9e]" },
  "Concept gap": { bg: "bg-[#dbe8fb]", text: "text-[#1d4ed8]", border: "border-[#bfdbfe]" },
  "Misread question": { bg: "bg-[#ece4f8]", text: "text-[#6b21a8]", border: "border-[#ddd6fe]" },
  "Time pressure": { bg: "bg-[#fbf1cd]", text: "text-[#854d0e]", border: "border-[#fef08a]" },
  Guessed: { bg: "bg-[#d3eef1]", text: "text-[#0e7490]", border: "border-[#a5f3fc]" },
  Unclassified: { bg: "bg-paper-bg", text: "text-ink-muted", border: "border-border" },
};

export function ErrorLogStatusPill({ status }: { status: "open" | "resolved" }) {
  const isResolved = status === "resolved";
  return (
    <span
      className={`inline-flex h-5 items-center rounded-[var(--ui-radius-sm)] px-2 text-[11px] font-bold uppercase tracking-wider ${
        isResolved
          ? "bg-[#e8f7f0] text-success border border-[#b2e5ce]"
          : "bg-[#fdede8] text-danger border border-[#f8c4b4]"
      }`}
    >
      {isResolved ? "Resolved" : "Open"}
    </span>
  );
}

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
  const [filterSection, setFilterSection] = useState<string>("all");
  const [filterReason, setFilterReason] = useState<string>("all");
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
      if (filterSection && filterSection !== "all") params.append("section", filterSection);
      if (filterReason && filterReason !== "all") params.append("reason", filterReason);
      if (filterStatus && filterStatus !== "all") params.append("status", filterStatus);

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
            ? "Correct! Mistake marked resolved automatically."
            : "Incorrect answer. Check KaTeX explanation or try once more.",
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

      {/* Filter Pill Rows */}
      <div className="workbook-panel p-4 space-y-3 bg-surface-white">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted w-20 shrink-0">
            Status:
          </span>
          <PillToggleGroup
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: "open", label: "Open (Needs Review)" },
              { value: "resolved", label: "Resolved" },
              { value: "all", label: "All Items" },
            ]}
          />
        </div>

        {/* Section Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted w-20 shrink-0">
            Section:
          </span>
          <PillToggleGroup
            value={filterSection}
            onChange={(val) => setFilterSection(val)}
            options={[
              { value: "all", label: "All Sections" },
              { value: "Reading and Writing", label: "Reading & Writing" },
              { value: "Math", label: "Math" },
            ]}
          />
        </div>

        {/* Reason Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted w-20 shrink-0">
            Reason:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilterReason("all")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-[var(--ui-radius-sm)] border transition ${
                filterReason === "all"
                  ? "border-brand bg-brand-tint text-ink-fg"
                  : "border-border bg-surface-white text-ink-muted hover:text-ink-fg hover:bg-paper-bg"
              }`}
            >
              All Reasons
            </button>
            {MISTAKE_REASONS.map((r) => {
              const active = filterReason === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFilterReason(r)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-[var(--ui-radius-sm)] border transition ${
                    active
                      ? "border-brand bg-brand-tint text-ink-fg"
                      : "border-border bg-surface-white text-ink-muted hover:text-ink-fg hover:bg-paper-bg"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-[var(--ui-radius)] bg-[#fdede8] border border-[#f8c4b4] text-[#ab3d19] text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={fetchEntries}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={4} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8 text-success" />}
          title="No mistake entries found"
          description={
            filterStatus === "open"
              ? "All caught up! You have resolved all recorded errors in this view."
              : "No questions match your current filter selection."
          }
        />
      ) : (
        <div className="space-y-5">
          {entries.map((entry) => {
            const q = entry.question;
            const isResolved = entry.status === "resolved";
            const retryRes = retryResults[entry._id];
            const reasonStyle = REASON_COLORS[entry.reason] || REASON_COLORS.Unclassified;

            return (
              <div
                key={entry._id}
                className="group relative workbook-panel p-5 sm:p-6 transition-all duration-150 hover:border-border-strong space-y-4"
              >
                <CardHoverPlate />

                {/* Entry Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex flex-wrap items-center gap-2">
                    <ErrorLogStatusPill status={entry.status} />

                    <Badge variant="muted" size="sm">
                      Missed {entry.timesMissed}x
                    </Badge>

                    <Badge variant="brand" size="sm">
                      {q.section}
                    </Badge>

                    {q.domain && (
                      <span className="text-[11px] font-semibold text-ink-muted hidden sm:inline">
                        · {q.domain}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Reason Selector Dropdown */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <Tag className="w-3.5 h-3.5 text-ink-muted" />
                      <select
                        value={entry.reason}
                        onChange={(e) => handleUpdateReason(entry._id, e.target.value)}
                        className={`text-xs font-bold rounded-[var(--ui-radius-sm)] border px-2 py-1 outline-none ${reasonStyle.bg} ${reasonStyle.text} ${reasonStyle.border}`}
                      >
                        {MISTAKE_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Toggle Status Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(entry._id, entry.status)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-[var(--ui-radius-sm)] border transition workbook-press ${
                        isResolved
                          ? "border-border bg-paper-bg text-ink-muted hover:text-ink-fg"
                          : "border-[#b2e5ce] bg-[#e8f7f0] text-success hover:bg-success hover:text-white"
                      }`}
                    >
                      {isResolved ? "Reopen" : "Mark Resolved"}
                    </button>
                  </div>
                </div>

                {/* Question Content */}
                <div className="space-y-3">
                  {q.passage && (
                    <div className="p-3.5 rounded-[var(--ui-radius-sm)] border border-border bg-paper-bg max-h-48 overflow-y-auto text-xs rich-text leading-relaxed">
                      <RichText content={q.passage} />
                    </div>
                  )}

                  <div className="rich-text font-medium text-sm text-ink-fg leading-relaxed">
                    <RichText content={q.questionText} />
                  </div>
                </div>

                {/* Inline Retry Mechanism */}
                <div className="pt-3 border-t border-border">
                  <div className="p-3.5 rounded-[var(--ui-radius-sm)] border border-border bg-paper-bg space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-ink-fg">
                      <span className="flex items-center gap-1.5 text-brand-strong">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Inline Retry Practice</span>
                      </span>
                      {q.questionType === "spr" && (
                        <span className="text-ink-muted font-normal text-[11px]">
                          Student-Produced Response (Number / Fraction)
                        </span>
                      )}
                    </div>

                    {q.choices && q.choices.length > 0 ? (
                      /* Multiple Choice Options */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.choices.map((choice, cIdx) => {
                          const letter = String.fromCharCode(65 + cIdx);
                          const isSelected = retryAnswers[entry._id] === letter;
                          return (
                            <button
                              key={letter}
                              type="button"
                              onClick={() =>
                                setRetryAnswers((prev) => ({ ...prev, [entry._id]: letter }))
                              }
                              className={`flex items-start gap-2.5 p-2.5 rounded-[var(--ui-radius-sm)] border text-left text-xs transition workbook-press ${
                                isSelected
                                  ? "border-brand bg-brand-tint text-ink-fg font-semibold shadow-[var(--ui-shadow-xs)]"
                                  : "border-border bg-surface-white text-ink-fg hover:bg-paper-bg"
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                  isSelected
                                    ? "border-brand bg-brand text-ink-fg"
                                    : "border-border-strong text-ink-muted"
                                }`}
                              >
                                {letter}
                              </span>
                              <div className="flex-1 rich-text">
                                <RichText content={choice} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* SPR Input Field */
                      <div className="flex items-center gap-2 max-w-sm">
                        <input
                          type="text"
                          placeholder="Type your answer (e.g. 28, 0.5, 1/2)"
                          value={retryAnswers[entry._id] || ""}
                          onChange={(e) =>
                            setRetryAnswers((prev) => ({ ...prev, [entry._id]: e.target.value }))
                          }
                          className="workbook-input h-9 text-xs font-mono"
                        />
                      </div>
                    )}

                    {/* Retry Action & Message */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={retryingId === entry._id || !retryAnswers[entry._id]}
                        onClick={() => handleRetrySubmit(entry._id)}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        <span>{retryingId === entry._id ? "Verifying..." : "Check Answer"}</span>
                      </Button>

                      {retryRes && (
                        <span
                          className={`text-xs font-bold flex items-center gap-1 ${
                            retryRes.isCorrect ? "text-success" : "text-danger"
                          }`}
                        >
                          {retryRes.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          )}
                          <span>{retryRes.message}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Student Personal Note */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add personal study note (e.g. remember to isolate x first, check sign)..."
                    value={notes[entry._id] ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [entry._id]: e.target.value }))
                    }
                    className="workbook-input h-8 text-xs flex-1"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs shrink-0"
                    disabled={savingNoteId === entry._id}
                    onClick={() => handleSaveNote(entry._id)}
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    <span>{savingNoteId === entry._id ? "Saving..." : "Save Note"}</span>
                  </Button>
                </div>

                {/* Explanation Accordion */}
                {q.explanation && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenExplanations((prev) => ({
                          ...prev,
                          [entry._id]: !prev[entry._id],
                        }))
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-strong hover:underline cursor-pointer"
                    >
                      {openExplanations[entry._id] ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Hide Solution &amp; Explanation</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Show Official Solution &amp; Explanation</span>
                        </>
                      )}
                    </button>

                    {openExplanations[entry._id] && (
                      <div className="mt-2 p-4 rounded-[var(--ui-radius-sm)] border border-[#ecd49d] bg-brand-tint/50 text-xs leading-relaxed rich-text">
                        <RichText content={q.explanation} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
