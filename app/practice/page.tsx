"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  Play,
  ArrowRight,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { SearchControl } from "@/components/ui/SearchControl";
import { ModalDialog } from "@/components/ui/ModalDialog";
import CardHoverPlate from "@/components/ui/CardHoverPlate";
import api from "@/lib/axios";

interface SectionInfo {
  name: string;
  module: number;
  questionsCount: number;
  timeLimit: number;
}

interface TestItem {
  _id: string;
  title: string;
  timeLimit: number;
  difficulty: string;
  questionsCount: number;
  sections?: SectionInfo[];
  createdAt?: string;
}

type FilterScope = "all" | "full_length" | "reading_writing" | "math";

export default function PracticeLibraryPage() {
  const router = useRouter();
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScope, setFilterScope] = useState<FilterScope>("all");

  // Sectional Modal State
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [isSectionalOpen, setIsSectionalOpen] = useState(false);
  const [startingAttempt, setStartingAttempt] = useState(false);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/tests");
      setTests(res.data?.tests || []);
    } catch (err: any) {
      console.error("Error loading tests:", err);
      setError("Failed to load practice tests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleStartFullLength = async (test: TestItem) => {
    try {
      setStartingAttempt(true);
      const res = await api.post("/api/attempts/start", {
        testId: test._id,
        mode: "full_length",
      });

      const attemptId = res.data?.attemptId || res.data?.attempt?._id;
      router.push(`/test/${test._id}?attemptId=${attemptId}&mode=full_length`);
    } catch (err: any) {
      console.error("Failed to start full-length test:", err);
      alert(err.response?.data?.error || "Could not start test attempt. Please check your login session.");
    } finally {
      setStartingAttempt(false);
    }
  };

  const handleStartSectional = async (sectionName: string, moduleNum: number) => {
    if (!selectedTest) return;
    try {
      setStartingAttempt(true);
      const res = await api.post("/api/attempts/start", {
        testId: selectedTest._id,
        mode: "sectional",
        sectionalSubject: sectionName,
        sectionalModule: moduleNum,
      });

      const attemptId = res.data?.attemptId || res.data?.attempt?._id;
      setIsSectionalOpen(false);
      router.push(
        `/test/${selectedTest._id}?attemptId=${attemptId}&mode=sectional&section=${encodeURIComponent(
          sectionName
        )}&module=${moduleNum}`
      );
    } catch (err: any) {
      console.error("Failed to start sectional test:", err);
      alert(err.response?.data?.error || "Could not start sectional attempt.");
    } finally {
      setStartingAttempt(false);
    }
  };

  // Filtered test items
  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const matchesSearch =
        !searchQuery.trim() ||
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (test.difficulty && test.difficulty.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterScope === "all") return true;
      if (filterScope === "full_length") return true;
      if (filterScope === "reading_writing") {
        return (test.sections || []).some((s) => s.name.toLowerCase().includes("reading"));
      }
      if (filterScope === "math") {
        return (test.sections || []).some((s) => s.name.toLowerCase().includes("math"));
      }
      return true;
    });
  }, [tests, searchQuery, filterScope]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Platform-Style Library Header */}
      <div className="overflow-hidden rounded-[var(--ui-radius)] border border-border bg-surface-white shadow-[var(--ui-shadow)]">
        <div className="border-b border-border-strong bg-paper-bg px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-2xl md:text-3xl font-black tracking-tight text-ink-fg">
                  SAT Practice Library
                </h1>
                <Badge variant="brand">{tests.length} Official Exams</Badge>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-ink-muted max-w-3xl leading-relaxed">
                Official Digital SAT practice tests with full-length modular timing or targeted
                sectional drills with KaTeX and Desmos calculator support.
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar: Search + Filter Pills */}
        <div className="px-5 py-3.5 bg-surface-white flex flex-wrap items-center justify-between gap-3 border-t border-border">
          <PillToggleGroup<FilterScope>
            value={filterScope}
            onChange={(next) => setFilterScope(next)}
            ariaLabel="Test type filters"
            options={[
              { value: "all", label: "All Tests" },
              { value: "full_length", label: "Full-Length" },
              { value: "reading_writing", label: "Reading & Writing" },
              { value: "math", label: "Math" },
            ]}
          />

          <SearchControl
            query={searchQuery}
            onQueryChange={setSearchQuery}
            placeholder="Search tests..."
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-[var(--ui-radius)] bg-[#fdede8] border border-[#f8c4b4] text-[#ab3d19] text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={fetchTests}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredTests.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="No matching practice tests"
          description={
            searchQuery
              ? `No tests found matching "${searchQuery}". Try clearing your search.`
              : "The test database currently has no practice tests in this category."
          }
          action={
            searchQuery ? (
              <Button variant="secondary" size="sm" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTests.map((test) => {
            const sections = test.sections || [
              { name: "Reading and Writing", module: 1, questionsCount: 27, timeLimit: 32 },
              { name: "Reading and Writing", module: 2, questionsCount: 27, timeLimit: 32 },
              { name: "Math", module: 1, questionsCount: 22, timeLimit: 35 },
              { name: "Math", module: 2, questionsCount: 22, timeLimit: 35 },
            ];

            const totalMinutes =
              sections.reduce((acc: number, s: any) => acc + (s.timeLimit || 0), 0) ||
              test.timeLimit ||
              134;

            return (
              <div
                key={test._id}
                className="group relative workbook-panel overflow-hidden flex flex-col justify-between hover:border-brand transition-all duration-200"
              >
                <CardHoverPlate />

                <div>
                  {/* Cover-style card header */}
                  <div className="border-b border-border-strong bg-gradient-to-r from-brand-tint/50 via-paper-bg to-brand-tint/30 px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="brand" size="sm">
                          Official SAT
                        </Badge>
                        <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                          {test.questionsCount || 98} questions
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-ink-muted font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{totalMinutes}m</span>
                      </div>
                    </div>

                    <h2 className="text-xl font-black text-ink-fg font-display tracking-tight">
                      {test.title}
                    </h2>
                  </div>

                  <div className="p-5 space-y-4">
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Complete 4-module test with adaptive difficulty, KaTeX equation rendering,
                      Bluebook-standard navigation, and Desmos calculator for Math.
                    </p>

                    {/* Module Schedule Chips */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted block">
                        Module Configuration
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-[var(--ui-radius-sm)] bg-paper-bg border border-border">
                          <p className="font-bold text-ink-fg">Reading &amp; Writing</p>
                          <p className="text-[11px] text-ink-muted mt-0.5">
                            2 Modules · 54 Questions · 64m
                          </p>
                        </div>
                        <div className="p-2.5 rounded-[var(--ui-radius-sm)] bg-paper-bg border border-border">
                          <p className="font-bold text-ink-fg">Math (Desmos)</p>
                          <p className="text-[11px] text-ink-muted mt-0.5">
                            2 Modules · 44 Questions · 70m
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-5 pt-0 flex flex-wrap items-center gap-2.5">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    disabled={startingAttempt}
                    onClick={() => handleStartFullLength(test)}
                  >
                    <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                    <span>Start Full-Length</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    disabled={startingAttempt}
                    onClick={() => {
                      setSelectedTest(test);
                      setIsSectionalOpen(true);
                    }}
                  >
                    <Sliders className="w-3.5 h-3.5 mr-1" />
                    <span>Sectional Drill</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sectional Drill Selector ModalDialog */}
      <ModalDialog
        open={isSectionalOpen}
        onClose={() => setIsSectionalOpen(false)}
        title={selectedTest ? `Sectional Practice: ${selectedTest.title}` : "Sectional Practice"}
        maxWidthClassName="max-w-xl"
        closeDisabled={startingAttempt}
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-muted leading-relaxed">
            Select an individual section and module to drill with focused timing. Your score will be
            reported on the 200–800 section scale.
          </p>

          <div className="space-y-2">
            {[
              {
                section: "Reading and Writing",
                module: 1,
                desc: "Module 1 · 27 Questions · 32 Minutes",
                badge: "Verbal",
              },
              {
                section: "Reading and Writing",
                module: 2,
                desc: "Module 2 · 27 Questions · 32 Minutes",
                badge: "Verbal",
              },
              {
                section: "Math",
                module: 1,
                desc: "Module 1 · 22 Questions · 35 Minutes (Desmos)",
                badge: "Math",
              },
              {
                section: "Math",
                module: 2,
                desc: "Module 2 · 22 Questions · 35 Minutes (Desmos)",
                badge: "Math",
              },
            ].map((opt) => (
              <button
                key={`${opt.section}-${opt.module}`}
                type="button"
                disabled={startingAttempt}
                onClick={() => handleStartSectional(opt.section, opt.module)}
                className="w-full flex items-center justify-between p-3.5 rounded-[var(--ui-radius-sm)] border border-border bg-surface-white hover:border-brand hover:bg-brand-tint/30 transition text-left cursor-pointer workbook-press"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={opt.badge === "Math" ? "brand" : "info"} size="sm">
                      {opt.badge}
                    </Badge>
                    <span className="font-bold text-sm text-ink-fg">
                      {opt.section} — Module {opt.module}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">{opt.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-brand-strong shrink-0 ml-3" />
              </button>
            ))}
          </div>
        </div>
      </ModalDialog>
    </div>
  );
}
