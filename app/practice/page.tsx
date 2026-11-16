"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  HelpCircle,
  Play,
  Target,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
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

export default function PracticeLibraryPage() {
  const router = useRouter();
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="SAT Practice Library"
        description="Official Digital SAT practice tests with full-length modular timing or targeted sectional drills."
        badge={<Badge variant="brand">{tests.length} Official Tests</Badge>}
      />

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
      ) : tests.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="No practice tests available"
          description="The test database currently has no practice tests. Please seed the database or check back later."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map((test) => {
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
              <Card
                key={test._id}
                className="flex flex-col justify-between hover:border-[var(--accent-brand)] transition-all duration-150"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="brand" size="sm">
                      Official SAT
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{totalMinutes} mins total</span>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-[var(--text-primary)] font-display">
                    {test.title}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Standard 4-module test containing {test.questionsCount || 98} questions. Includes
                    KaTeX math rendering, passage readers, and SPR questions.
                  </p>

                  {/* Section Breakdown Pills */}
                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                      Module Schedule
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                        <p className="font-semibold text-[var(--text-primary)]">Reading &amp; Writing</p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          2 Modules · 54 Questions · 64m
                        </p>
                      </div>
                      <div className="p-2 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                        <p className="font-semibold text-[var(--text-primary)]">Math (Desmos)</p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          2 Modules · 44 Questions · 70m
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center gap-2.5">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full sm:flex-1"
                    loading={startingAttempt}
                    onClick={() => handleStartFullLength(test)}
                  >
                    <Play className="w-4 h-4 mr-1 fill-current" />
                    <span>Full-Length Test</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full sm:flex-1"
                    onClick={() => {
                      setSelectedTest(test);
                      setIsSectionalOpen(true);
                    }}
                  >
                    <Target className="w-4 h-4 mr-1" />
                    <span>Sectional Drill</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* -------------------------------------------------------------------
          SECTIONAL SELECTION MODAL
      -------------------------------------------------------------------- */}
      <Dialog
        open={isSectionalOpen}
        onClose={() => setIsSectionalOpen(false)}
        title={selectedTest?.title || "Choose Sectional Module"}
        description="Select a single SAT section and module to practice with focused timing."
        maxWidth="lg"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Reading and Writing
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={startingAttempt}
                onClick={() => handleStartSectional("Reading and Writing", 1)}
                className="p-3 text-left rounded-[var(--ui-radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--accent-brand)] hover:bg-[var(--accent-brand-tint)]/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--text-primary)]">Module 1</span>
                  <Badge variant="muted" size="sm">27 Qs</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">32 minutes · Standard difficulty</p>
              </button>

              <button
                type="button"
                disabled={startingAttempt}
                onClick={() => handleStartSectional("Reading and Writing", 2)}
                className="p-3 text-left rounded-[var(--ui-radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--accent-brand)] hover:bg-[var(--accent-brand-tint)]/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--text-primary)]">Module 2</span>
                  <Badge variant="muted" size="sm">27 Qs</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">32 minutes · Adaptive module</p>
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Math (Desmos Allowed)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={startingAttempt}
                onClick={() => handleStartSectional("Math", 1)}
                className="p-3 text-left rounded-[var(--ui-radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--accent-brand)] hover:bg-[var(--accent-brand-tint)]/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--text-primary)]">Module 1</span>
                  <Badge variant="muted" size="sm">22 Qs</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">35 minutes · MCQ &amp; SPR</p>
              </button>

              <button
                type="button"
                disabled={startingAttempt}
                onClick={() => handleStartSectional("Math", 2)}
                className="p-3 text-left rounded-[var(--ui-radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--accent-brand)] hover:bg-[var(--accent-brand-tint)]/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--text-primary)]">Module 2</span>
                  <Badge variant="muted" size="sm">22 Qs</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">35 minutes · MCQ &amp; SPR</p>
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
