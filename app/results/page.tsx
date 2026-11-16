"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import api from "@/lib/axios";

interface ResultItem {
  _id: string;
  testId?: {
    _id?: string;
    title?: string;
  } | string;
  score?: number;
  mode?: string;
  isSectional?: boolean;
  date?: string;
  createdAt?: string;
  answersCount?: number;
  sectionBreakdown?: {
    readingAndWriting?: number;
    math?: number;
  };
}

export default function ResultsListPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"all" | "full_length" | "sectional">("all");

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/results");
      setResults(res.data?.results || []);
    } catch (err) {
      console.error("Failed to load results:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const filtered = results.filter((r) => {
    if (filterMode === "all") return true;
    if (filterMode === "sectional") return r.isSectional || r.mode === "sectional";
    return !r.isSectional && r.mode !== "sectional";
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <PageHeader
        title="Test Results & Score Reports"
        description="Comprehensive history of your full-length practice tests and sectional drills."
        badge={<Badge variant="brand">{results.length} Attempts</Badge>}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        <button
          type="button"
          onClick={() => setFilterMode("all")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--ui-radius-sm)] transition-colors cursor-pointer ${
            filterMode === "all"
              ? "bg-[var(--accent-brand-tint)] text-[#8c6b1f] border border-[#ecd49d]"
              : "text-[var(--text-muted)] hover:bg-[var(--bg-canvas)]"
          }`}
        >
          All Attempts ({results.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode("full_length")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--ui-radius-sm)] transition-colors cursor-pointer ${
            filterMode === "full_length"
              ? "bg-[var(--accent-brand-tint)] text-[#8c6b1f] border border-[#ecd49d]"
              : "text-[var(--text-muted)] hover:bg-[var(--bg-canvas)]"
          }`}
        >
          Full-Length
        </button>
        <button
          type="button"
          onClick={() => setFilterMode("sectional")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--ui-radius-sm)] transition-colors cursor-pointer ${
            filterMode === "sectional"
              ? "bg-[var(--accent-brand-tint)] text-[#8c6b1f] border border-[#ecd49d]"
              : "text-[var(--text-muted)] hover:bg-[var(--bg-canvas)]"
          }`}
        >
          Sectional
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-8 h-8" />}
          title="No results match your criteria"
          description="Take a practice test or sectional drill to see your score report here."
          action={
            <Link href="/practice">
              <Button variant="primary" size="sm">
                Go to Practice Library
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item: any) => {
            const testTitle =
              (typeof item.testId === "object" ? item.testId?.title : null) ||
              item.testTitle ||
              "Official SAT Practice Test";
            const isSectional = item.isSectional || item.mode === "sectional";
            const scoreVal = isSectional
              ? Math.max(200, item.score ?? 200)
              : Math.max(400, item.score ?? 400);
            const dateStr = item.date || item.createdAt || "";
            const formattedDate = dateStr
              ? new Date(dateStr).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recent";

            return (
              <Card
                key={item._id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 hover:border-[var(--accent-brand)] transition-all duration-150"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant={isSectional ? "info" : "brand"} size="sm">
                      {isSectional ? "Sectional" : "Full-Length"}
                    </Badge>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formattedDate}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                    {testTitle}
                  </h3>

                  {isSectional && item.sectionalSubject && (
                    <p className="text-xs text-[var(--text-muted)]">
                      {item.sectionalSubject} · Module {item.sectionalModule || 1}
                    </p>
                  )}

                  {item.sectionBreakdown && !isSectional && (
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                      <span>
                        Reading &amp; Writing:{" "}
                        <strong className="text-[var(--text-primary)]">
                          {item.sectionBreakdown.readingAndWriting || 0}
                        </strong>
                      </span>
                      <span>
                        Math:{" "}
                        <strong className="text-[var(--text-primary)]">
                          {item.sectionBreakdown.math || 0}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)]">
                  <div className="text-right">
                    <span className="text-2xl font-black text-[var(--text-primary)]">
                      {scoreVal}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] block">
                      {isSectional ? "/ 800" : "/ 1600"}
                    </span>
                  </div>

                  <Link href={`/results/${item._id}`}>
                    <Button variant="secondary" size="md">
                      <span>Review Details</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
