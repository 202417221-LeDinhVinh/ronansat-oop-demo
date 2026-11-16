"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Trophy,
  Award,
  AlertCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import api from "@/lib/axios";

interface ScorePoint {
  date: string;
  score: number;
  testTitle?: string;
  mode?: string;
}

interface RecentResult {
  _id: string;
  score?: number;
  date?: string;
  createdAt?: string;
  mode?: string;
  isSectional?: boolean;
  sectionBreakdown?: {
    readingAndWriting?: number;
    math?: number;
  };
  testId?: {
    _id?: string;
    title?: string;
  } | string;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    latestScore: 0,
    highestScore: 0,
    testsTaken: 0,
    errorLogsToReview: 0,
    vocabDueCount: 0,
  });

  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [scoreTrend, setScoreTrend] = useState<ScorePoint[]>([]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch user stats and statistics snapshot
      const [userStatsRes, statsRes, vocabDueRes, resultsRes] = await Promise.all([
        api.get("/api/user/stats").catch(() => ({ data: {} })),
        api.get("/api/statistics").catch(() => ({ data: {} })),
        api.get("/api/vocab/due").catch(() => ({ data: {} })),
        api.get("/api/results").catch(() => ({ data: {} })),
      ]);

      const userStats = userStatsRes.data?.stats || userStatsRes.data || {};
      const statistics = statsRes.data?.statistics || {};
      const vocabData = vocabDueRes.data || {};
      const resultsData = resultsRes.data?.results || [];

      const fullLengthResults = resultsData.filter((r: any) => !r.isSectional && r.mode !== "sectional");
      const latestFullLength = fullLengthResults.length > 0 ? fullLengthResults[0] : null;

      const latestScore =
        statistics.latestScore ||
        latestFullLength?.score ||
        (resultsData.length > 0 ? resultsData[0]?.score : 0) ||
        0;

      const highestScore =
        statistics.highestScore ||
        userStats.highestScore ||
        (fullLengthResults.length > 0
          ? Math.max(...fullLengthResults.map((r: any) => r.score || 0))
          : (resultsData.length > 0 ? resultsData[0]?.score : 0)) ||
        0;

      setStats({
        latestScore,
        highestScore,
        testsTaken: statistics.totalTestsTaken || resultsData.length || 0,
        errorLogsToReview: userStats.errorLogsToReview || 0,
        vocabDueCount: vocabData.dueCount || 0,
      });

      setRecentResults(resultsData.slice(0, 3));

      // Build score trend (full-length only, 400-1600 scale)
      if (statistics.scoreTrend && statistics.scoreTrend.length > 0) {
        setScoreTrend(
          statistics.scoreTrend.map((pt: any) => ({
            date: pt.date ? pt.date.slice(5) : "",
            score: pt.score,
            testTitle: pt.testTitle,
            mode: pt.mode,
          }))
        );
      } else if (fullLengthResults.length > 0) {
        const trend = [...fullLengthResults]
          .reverse()
          .filter((r: any) => (r.score || 0) >= 400)
          .map((r: any) => ({
            date: r.date ? r.date.slice(5, 10) : "",
            score: r.score,
            testTitle:
              (typeof r.testId === "object" ? r.testId?.title : null) ||
              r.testTitle ||
              "SAT Practice",
            mode: r.mode,
          }));
        setScoreTrend(trend);
      }
    } catch (err: any) {
      console.error("Error loading home dashboard:", err);
      setError("Failed to load dashboard metrics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchHomeData();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  // -------------------------------------------------------------------------
  // Logged Out Landing View
  // -------------------------------------------------------------------------
  if (!session && status !== "loading") {
    return (
      <div className="py-8 sm:py-16 flex flex-col items-center text-center">
        <Badge variant="brand" className="mb-4">
          University OOP Laboratory Project · Digital SAT Suite
        </Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text-primary)] font-display max-w-3xl leading-tight">
          Master the Digital SAT with precision Object-Oriented software.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[var(--text-muted)] max-w-2xl leading-relaxed">
          RonanSAT provides authentic Bluebook-style practice with full-length modular timing,
          deduplicated error logs with inline retries, Leitner spaced-repetition vocabulary,
          and robust analytics.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link href="/auth">
            <Button variant="primary" size="lg" className="px-8 shadow-[var(--ui-shadow-md)]">
              <span>Sign In to Practice</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link href="/auth">
            <Button variant="secondary" size="lg" className="px-8">
              Explore Demo Accounts
            </Button>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl w-full text-left">
          <Card>
            <div className="w-10 h-10 rounded-[var(--ui-radius-sm)] bg-[var(--accent-brand-tint)] text-[var(--accent-brand-strong)] flex items-center justify-center font-bold mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Timed Modular Practice
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)] leading-normal">
              Full-length 4-module SAT tests and sectional drills with integrated KaTeX LaTeX,
              Desmos graphing calculator, and SPR answer equivalence.
            </p>
          </Card>

          <Card>
            <div className="w-10 h-10 rounded-[var(--ui-radius-sm)] bg-[#fdede8] text-[var(--state-danger)] flex items-center justify-center font-bold mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Deduplicated Error Log
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)] leading-normal">
              Every missed or omitted question is tracked with reason classification, student
              notes, and immediate inline retry validation.
            </p>
          </Card>

          <Card>
            <div className="w-10 h-10 rounded-[var(--ui-radius-sm)] bg-[#e8f7f0] text-[var(--state-success)] flex items-center justify-center font-bold mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Leitner Spaced Repetition
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)] leading-normal">
              5-box Leitner scheduling with standard rating grades (Again, Hard, Good, Easy)
              to retain essential SAT high-frequency words.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Logged In Student Dashboard
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] font-display">
            Welcome back, {session?.user?.name || "Student"}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Here is your SAT preparation overview and today&apos;s recommended tasks.
          </p>
        </div>

        <Link href="/practice">
          <Button variant="primary" size="md" className="shadow-[var(--ui-shadow-xs)]">
            <Play className="w-4 h-4 mr-1.5 fill-current" />
            <span>Continue Practice</span>
          </Button>
        </Link>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="p-4 rounded-[var(--ui-radius)] bg-[#fdede8] border border-[#f8c4b4] text-[#ab3d19] text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={fetchHomeData}>
            Retry
          </Button>
        </div>
      )}

      {/* 4 Stat Cards Row */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Latest Score"
            value={stats.latestScore > 0 ? stats.latestScore : "—"}
            sublabel={
              stats.latestScore >= 400
                ? "Full-Length · 400-1600"
                : stats.latestScore >= 200
                ? "Sectional · 200-800"
                : "No attempts yet"
            }
            icon={<Award className="w-4 h-4" />}
          />
          <StatCard
            label="Highest Score"
            value={stats.highestScore > 0 ? stats.highestScore : "—"}
            sublabel={
              stats.highestScore >= 400
                ? "Full-Length · 400-1600"
                : stats.testsTaken > 0
                ? `Across ${stats.testsTaken} tests taken`
                : "Take first test"
            }
            icon={<Trophy className="w-4 h-4" />}
          />
          <Link href="/error-log">
            <StatCard
              label="Mistakes to Review"
              value={stats.errorLogsToReview}
              sublabel="In your Error Log"
              icon={<AlertCircle className="w-4 h-4" />}
              className="hover:border-[var(--state-danger)]"
            />
          </Link>
          <Link href="/vocab">
            <StatCard
              label="Vocab Due Today"
              value={stats.vocabDueCount}
              sublabel="Cards in Leitner boxes"
              icon={<Sparkles className="w-4 h-4" />}
              className="hover:border-[var(--accent-brand)]"
            />
          </Link>
        </div>
      )}

      {/* CTA Practice Banner + Sparkline Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Practice Hero Card */}
        <Card className="lg:col-span-2 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[var(--bg-surface)] to-[var(--accent-brand-tint)]/25">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="brand">Active Session</Badge>
              <span className="text-xs text-[var(--text-muted)] font-medium">Digital SAT Prep</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-display">
              Ready for your next full-length exam?
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)] max-w-xl leading-relaxed">
              Experience the exact test day environment: 4 timed modules (2 Reading &amp; Writing,
              2 Math) with built-in Desmos calculator and automated scoring.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/practice">
              <Button variant="primary" size="md">
                <Play className="w-4 h-4 mr-1 fill-current" />
                <span>Start Full-Length Test</span>
              </Button>
            </Link>
            <Link href="/practice">
              <Button variant="secondary" size="md">
                Sectional Modules
              </Button>
            </Link>
            <Link href="/vocab">
              <Button variant="ghost" size="md">
                Review Vocab ({stats.vocabDueCount})
              </Button>
            </Link>
          </div>
        </Card>

        {/* Score Trend Sparkline Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Score Trajectory
              </span>
              <TrendingUp className="w-4 h-4 text-[var(--accent-brand-strong)]" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Score Progression</h3>
            <p className="text-xs text-[var(--text-muted)]">Past attempts over time</p>
          </div>

          <div className="h-36 w-full mt-4">
            {scoreTrend.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-brand)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--accent-brand)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e3dd" vertical={false} />
                  <XAxis dataKey="date" stroke="#78716c" fontSize={10} tickLine={false} />
                  <YAxis domain={["dataMin - 50", "dataMax + 50"]} stroke="#78716c" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-subtle)",
                      borderRadius: "var(--ui-radius-sm)",
                      fontSize: "12px",
                      boxShadow: "var(--ui-shadow)",
                    }}
                    formatter={(val: any) => [`${val} pts`, "Score"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="var(--accent-brand-strong)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scoreGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-3 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)]">
                <TrendingUp className="w-6 h-6 text-[var(--text-muted)] mb-1" />
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  Take at least 2 tests to render trend sparkline
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display">
              Recent Test Results
            </h2>
            <Badge variant="muted">{recentResults.length}</Badge>
          </div>
          <Link
            href="/results"
            className="text-xs font-semibold text-[var(--accent-brand-strong)] hover:underline flex items-center gap-1"
          >
            <span>View all past results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <TableSkeleton rows={3} />
        ) : recentResults.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-6 h-6" />}
            title="No past results yet"
            description="Take your first practice test to evaluate your performance across Reading, Writing, and Math."
            action={
              <Link href="/practice">
                <Button variant="primary" size="sm">
                  Start Practice Test
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentResults.map((result: any) => {
              const testTitle =
                (typeof result.testId === "object" ? result.testId?.title : null) ||
                result.testTitle ||
                "Official SAT Practice Test";
              const isSectional = result.isSectional || result.mode === "sectional";
              const scoreVal = isSectional
                ? Math.max(200, result.score ?? 200)
                : Math.max(400, result.score ?? 400);
              const dateStr = result.date || result.createdAt || "";
              const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString() : "Recent";

              return (
                <Card
                  key={result._id}
                  className="flex flex-col justify-between hover:border-[var(--accent-brand)] transition-colors duration-150"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={isSectional ? "info" : "brand"} size="sm">
                        {isSectional ? "Sectional" : "Full-Length"}
                      </Badge>
                      <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formattedDate}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[var(--text-primary)] line-clamp-1">
                      {testTitle}
                    </h3>

                    {isSectional && result.sectionalSubject && (
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {result.sectionalSubject} · Module {result.sectionalModule || 1}
                      </p>
                    )}

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-[var(--text-primary)]">
                        {scoreVal}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {isSectional ? "/ 800 section" : "/ 1600 total"}
                      </span>
                    </div>

                    {result.sectionBreakdown && !isSectional && (
                      <div className="mt-2.5 flex items-center gap-3 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                        <span>R&amp;W: <strong className="text-[var(--text-primary)]">{result.sectionBreakdown.readingAndWriting || 0}</strong></span>
                        <span>Math: <strong className="text-[var(--text-primary)]">{result.sectionBreakdown.math || 0}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                    <Link href={`/results/${result._id}`} className="block">
                      <Button variant="secondary" size="sm" className="w-full">
                        <span>Review Questions</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
