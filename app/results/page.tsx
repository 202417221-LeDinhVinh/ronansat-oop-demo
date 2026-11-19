"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter,
  Search,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { SearchControl } from "@/components/ui/SearchControl";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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
  sectionalSubject?: string;
  sectionalModule?: number;
  date?: string;
  createdAt?: string;
  answersCount?: number;
  sectionBreakdown?: {
    readingAndWriting?: number;
    math?: number;
  };
}

type FilterMode = "all" | "full_length" | "sectional";

function formatDateTime(dateString?: string) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ResultsListPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const filtered = useMemo(() => {
    return results.filter((r) => {
      const isSec = r.isSectional || r.mode === "sectional";
      if (filterMode === "sectional" && !isSec) return false;
      if (filterMode === "full_length" && isSec) return false;

      if (searchQuery.trim()) {
        const title = typeof r.testId === "object" ? r.testId?.title || "" : "";
        const query = searchQuery.toLowerCase();
        if (
          !title.toLowerCase().includes(query) &&
          !(r.sectionalSubject && r.sectionalSubject.toLowerCase().includes(query))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [results, filterMode, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <PageHeader
        title="Test Results & Score Reports"
        description="Comprehensive history of your full-length practice tests and targeted sectional drills."
        badge={<Badge variant="brand">{results.length} Completed</Badge>}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <PillToggleGroup<FilterMode>
          value={filterMode}
          onChange={(next) => setFilterMode(next)}
          ariaLabel="Filter results by mode"
          options={[
            { value: "all", label: `All (${results.length})` },
            {
              value: "full_length",
              label: `Full-Length (${
                results.filter((r) => !r.isSectional && r.mode !== "sectional").length
              })`,
            },
            {
              value: "sectional",
              label: `Sectional (${
                results.filter((r) => r.isSectional || r.mode === "sectional").length
              })`,
            },
          ]}
        />

        <SearchControl
          query={searchQuery}
          onQueryChange={setSearchQuery}
          placeholder="Filter by test title..."
        />
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-8 h-8" />}
          title={searchQuery ? "No matching score reports" : "No results yet"}
          description={
            searchQuery
              ? `No tests found matching "${searchQuery}".`
              : "Complete a full-length practice test or sectional drill to view your scores here."
          }
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Practice Test</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Date Taken</TableHead>
                <TableHead>Section Breakdown</TableHead>
                <TableHead className="text-right">Scaled Score</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((result) => {
                const isSec = result.isSectional || result.mode === "sectional";
                const title =
                  typeof result.testId === "object"
                    ? result.testId?.title
                    : isSec
                    ? `${result.sectionalSubject || "Sectional"} (Module ${result.sectionalModule || 1})`
                    : "Digital SAT Practice Test";

                const dateStr = formatDateTime(result.createdAt || result.date);

                return (
                  <TableRow key={result._id} className="group">
                    <TableCell>
                      <Link
                        href={`/results/${result._id}`}
                        className="font-bold text-ink-fg hover:text-brand-strong transition flex items-center gap-1.5"
                      >
                        <span className="truncate max-w-xs">{title}</span>
                      </Link>
                    </TableCell>

                    <TableCell>
                      <Badge variant={isSec ? "info" : "brand"} size="sm">
                        {isSec ? "Sectional" : "Full-Length"}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-ink-muted tabular-nums">
                      {dateStr}
                    </TableCell>

                    <TableCell>
                      {result.sectionBreakdown ? (
                        <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-ink-muted">
                          {result.sectionBreakdown.readingAndWriting !== undefined && (
                            <span className="px-1.5 py-0.5 rounded bg-paper-bg border border-border">
                              R&amp;W {result.sectionBreakdown.readingAndWriting}
                            </span>
                          )}
                          {result.sectionBreakdown.math !== undefined && (
                            <span className="px-1.5 py-0.5 rounded bg-paper-bg border border-border">
                              Math {result.sectionBreakdown.math}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-muted font-mono">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="inline-flex items-baseline gap-1 rounded-[var(--ui-radius-sm)] border border-border bg-paper-bg px-2.5 py-1">
                        <span className="font-display text-base font-black text-ink-fg tabular-nums leading-none">
                          {result.score || 0}
                        </span>
                        <span className="text-[10px] font-bold text-ink-muted">
                          {isSec ? "/ 800" : "/ 1600"}
                        </span>
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Link href={`/results/${result._id}`}>
                        <Button variant="secondary" size="sm" className="h-8 text-xs">
                          <span>Report</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
