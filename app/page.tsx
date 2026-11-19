"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Trophy,
  Target,
  AlertCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  Play,
  TrendingUp,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { StudyRingProgress } from "@/components/ui/UsageRing";
import CardHoverPlate from "@/components/ui/CardHoverPlate";
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
  sectionalSubject?: string;
  sectionalModule?: number;
  sectionBreakdown?: {
    readingAndWriting?: number;
    math?: number;
  };
  testId?: {
    _id?: string;
    title?: string;
  } | string;
}

function formatResultDate(dateString?: string) {
  if (!dateString) return "Recently";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
    vocabTotalCount: 80,
  });

  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [fullLengthTrend, setFullLengthTrend] = useState<ScorePoint[]>([]);
  const [allResults, setAllResults] = useState<RecentResult[]>([]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [userStatsRes, statsRes, vocabDueRes, resultsRes, vocabDecksRes] = await Promise.all([
        api.get("/api/user/stats").catch(() => ({ data: {} })),
        api.get("/api/statistics").catch(() => ({ data: {} })),
        api.get("/api/vocab/due").catch(() => ({ data: {} })),
        api.get("/api/results").catch(() => ({ data: {} })),
        api.get("/api/vocab/decks").catch(() => ({ data: {} })),
      ]);

      const userStats = userStatsRes.data?.stats || userStatsRes.data || {};
      const statistics = statsRes.data?.statistics || {};
      const vocabData = vocabDueRes.data || {};
      const resultsData: RecentResult[] = resultsRes.data?.results || [];
      const decks = vocabDecksRes.data?.decks || [];
      const totalCards = decks.reduce((sum: number, d: any) => sum + (d.totalCards || 0), 0);

      setAllResults(resultsData);

      // Filter full length results (totals only, 400-1600 scale)
      const fullLengthResults = resultsData.filter(
        (r) => !r.isSectional && r.mode !== "sectional" && (r.score || 0) >= 400
      );
      const latestFullLength = fullLengthResults.length > 0 ? fullLengthResults[0] : null;

      const latestScore =
        latestFullLength?.score ||
        statistics.latestScore ||
        (resultsData.length > 0 ? resultsData[0]?.score : 0) ||
        0;

      const highestScore =
        fullLengthResults.length > 0
          ? Math.max(...fullLengthResults.map((r) => r.score || 0))
          : statistics.highestScore || userStats.highestScore || 0;

      setStats({
        latestScore,
        highestScore,
        testsTaken: statistics.totalTestsTaken || resultsData.length || 0,
        errorLogsToReview: userStats.errorLogsToReview || 0,
        vocabDueCount: vocabData.dueCount || 0,
        vocabTotalCount: totalCards > 0 ? totalCards : 80,
      });

      setRecentResults(resultsData.slice(0, 4));

      // Build full-length trend points in chronological order
      if (fullLengthResults.length > 0) {
        const trend = [...fullLengthResults]
          .reverse()
          .map((r) => ({
            date: r.createdAt ? formatResultDate(r.createdAt).slice(0, 6) : r.date?.slice(5, 10) || "",
            score: r.score || 0,
            testTitle:
              typeof r.testId === "object" ? r.testId?.title : "SAT Full-Length",
            mode: "full_length",
          }));
        setFullLengthTrend(trend);
      } else if (statistics.scoreTrend && statistics.scoreTrend.length > 0) {
        setFullLengthTrend(
          statistics.scoreTrend.map((pt: any) => ({
            date: pt.date ? pt.date.slice(5) : "",
            score: pt.score,
            testTitle: pt.testTitle,
            mode: pt.mode,
          }))
        );
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

  // Compute Weekly Study Bars from recent attempts (last 7 days)
  const weeklyStudyBars = useMemo(() => {
    const toLocalDateKey = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const days: { label: string; dateKey: string; count: number; isToday: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateKey = toLocalDateKey(d);
      days.push({
        label: dayLabel,
        dateKey,
        count: 0,
        isToday: i === 0,
      });
    }

    allResults.forEach((res) => {
      const dStr = res.createdAt || res.date;
      if (!dStr) return;
      const resDate = new Date(dStr);
      const dKey = toLocalDateKey(resDate);
      const match = days.find((day) => day.dateKey === dKey);
      if (match) {
        match.count += 1;
      }
    });

    const totalCount = days.reduce((sum, d) => sum + d.count, 0);
    const maxCount = Math.max(...days.map((d) => d.count), 1);
    return { days, maxCount, totalCount };
  }, [allResults]);

  // Score change calculation
  const scoreChange = useMemo(() => {
    if (fullLengthTrend.length >= 2) {
      const first = fullLengthTrend[0].score;
      const last = fullLengthTrend[fullLengthTrend.length - 1].score;
      return last - first;
    }
    return 0;
  }, [fullLengthTrend]);

  // Current formatted date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // -------------------------------------------------------------------------
  // Logged Out Landing View
  // -------------------------------------------------------------------------
  if (!session && status !== "loading") {
    return (
      <div className="py-8 sm:py-16 flex flex-col items-center text-center">
        <Badge variant="brand" className="mb-4">
          University OOP Laboratory Project · Digital SAT Suite
        </Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-ink-fg font-display max-w-3xl leading-tight">
          Master the Digital SAT with precision Object-Oriented software.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-ink-muted max-w-2xl leading-relaxed">
          RonanSAT provides digital SAT practice with modular timing, KaTeX LaTeX math,
          deduplicated error logs with inline retries, and Leitner spaced-repetition vocabulary.
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
          <div className="workbook-panel p-6">
            <div className="w-10 h-10 rounded-[var(--ui-radius-sm)] bg-brand-tint text-brand-strong flex items-center justify-center font-bold mb-3 border border-[#ecd49d]">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-ink-fg font-display">
              Timed Modular Practice
            </h3>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              Full-length 4-module SAT tests and sectional drills with integrated KaTeX LaTeX,
              Desmos graphing calculator, and SPR answer equivalence.
            </p>
          </div>

          <div className="workbook-panel p-6">
            <div className="w-10 h-10 rounded-[var(--ui-radius-sm)] bg-[#fdede8] text-danger flex items-center justify-center font-bold mb-3 border border-[#f8c4b4]">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-ink-fg font-display">
              Deduplicated Error Log
            </h3>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              Every missed question is tracked with reason classification, student notes, and
              immediate inline retry validation.
            </p>
          </div>

          <div className="workbook-panel p-6">
            <div className="w-10 h-10 rounded-[var(--ui-radius-sm)] bg-[#e8f7f0] text-success flex items-center justify-center font-bold mb-3 border border-[#b2e5ce]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-ink-fg font-display">
              Leitner Spaced Repetition
            </h3>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              5-box Leitner scheduling with standard grades (Again, Hard, Good, Easy) to retain
              essential SAT high-frequency words.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Logged In Student Dashboard
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-ink-fg font-display">
            Welcome back, {session?.user?.name || "Student"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ink-muted flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{todayFormatted}</span>
          </p>
        </div>

        <Link href="/practice">
          <Button variant="primary" size="md" className="shadow-[var(--ui-shadow-xs)]">
            <Play className="w-4 h-4 mr-1.5 fill-current" />
            <span>Continue Practice</span>
          </Button>
        </Link>
      </div>

      {/* Error Banner */}
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
            label="Highest Score"
            value={stats.highestScore > 0 ? stats.highestScore : "—"}
            sublabel={
              stats.highestScore >= 400
                ? "Full-Length · 400-1600"
                : stats.testsTaken > 0
                ? `Across ${stats.testsTaken} tests taken`
                : "Take your first test"
            }
            icon={<Trophy className="w-4 h-4" />}
          />
          <StatCard
            label="Tests Completed"
            value={stats.testsTaken}
            sublabel="Full-length & Sectional"
            icon={<Target className="w-4 h-4" />}
          />
          <Link href="/error-log" className="block">
            <StatCard
              label="Mistakes to Review"
              value={stats.errorLogsToReview}
              sublabel="In your Error Log"
              icon={<AlertCircle className="w-4 h-4" />}
              className="hover:border-danger"
            />
          </Link>
          <Link href="/vocab" className="block">
            <StatCard
              label="Vocab Due Today"
              value={stats.vocabDueCount}
              sublabel="Cards in Leitner boxes"
              icon={<Sparkles className="w-4 h-4" />}
              className="hover:border-brand"
            />
          </Link>
        </div>
      )}

      {/* Active Session & Progress Ring Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Practice Hero Card */}
        <div className="lg:col-span-2 workbook-panel p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-surface-white to-brand-tint/30">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="brand">Practice Hub</Badge>
              <span className="text-xs text-ink-muted font-medium">Digital SAT Prep</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-ink-fg font-display tracking-tight">
              Ready for your next full-length exam?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-ink-muted max-w-xl leading-relaxed">
              Experience authentic test day conditions: 4 timed modules (2 Reading &amp; Writing,
              2 Math) with built-in Desmos graphing calculator, KaTeX equations, and automated scoring.
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
                Review Vocab ({stats.vocabDueCount} due)
              </Button>
            </Link>
          </div>
        </div>

        {/* Study Ring Progress Card */}
        <div className="workbook-panel p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.06em] text-ink-muted">
              Today&apos;s Memory Retention
            </span>
            <Sparkles className="w-4 h-4 text-brand-strong" />
          </div>

          <StudyRingProgress
            completed={Math.max(0, stats.vocabTotalCount - stats.vocabDueCount)}
            total={stats.vocabTotalCount}
            label="Vocab Cards Retained"
            sublabel="Leitner spaced repetition progress"
            size={110}
          />

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-ink-muted">{stats.vocabDueCount} cards due for review</span>
            <Link href="/vocab" className="font-bold text-brand-strong hover:underline flex items-center gap-1">
              <span>Study Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Improvement Trend Panel & Weekly Study Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Improvement Trend Panel (Full-Length Totals Only) */}
        <section className="lg:col-span-2 workbook-panel overflow-hidden">
          <div className="border-b border-border-strong bg-paper-bg px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight text-ink-fg">
                Improvement Trend
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Full-length practice test score trajectory (400–1600 scale)
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-strong">
              <TrendingUp className="w-4 h-4" />
              <span>Full-Length Only</span>
            </div>
          </div>

          {/* Metric Sub-header Strip */}
          <div className="grid grid-cols-3 border-b border-border-strong bg-surface-white px-5 py-3 text-center divide-x divide-border">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-ink-muted">
                Score Change
              </p>
              <p
                className={`mt-1 font-display text-xl sm:text-2xl font-black tabular-nums ${
                  scoreChange > 0 ? "text-success" : scoreChange < 0 ? "text-danger" : "text-ink-fg"
                }`}
              >
                {scoreChange > 0 ? `+${scoreChange}` : scoreChange || "0"}
              </p>
            </div>
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-ink-muted">
                Latest Score
              </p>
              <p className="mt-1 font-display text-xl sm:text-2xl font-black tabular-nums text-ink-fg">
                {stats.latestScore > 0 ? stats.latestScore : "—"}
              </p>
            </div>
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-ink-muted">
                Full Tests
              </p>
              <p className="mt-1 font-display text-xl sm:text-2xl font-black tabular-nums text-ink-fg">
                {fullLengthTrend.length}
              </p>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="p-4 sm:p-5 bg-surface-white">
            {fullLengthTrend.length >= 2 ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={fullLengthTrend}
                    margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="homeScoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="var(--color-ink-fg)"
                      strokeOpacity={0.07}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fontWeight: 600, fill: "var(--color-ink-muted)" }}
                      tickLine={false}
                      axisLine={{ stroke: "var(--color-border)" }}
                    />
                    <YAxis
                      domain={[400, 1600]}
                      ticks={[400, 800, 1200, 1600]}
                      tick={{ fontSize: 10, fontWeight: 600, fill: "var(--color-ink-muted)" }}
                      tickLine={false}
                      axisLine={{ stroke: "var(--color-border)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-surface-white)",
                        borderColor: "var(--color-border)",
                        borderRadius: "var(--ui-radius-sm)",
                        fontSize: "12px",
                        boxShadow: "var(--ui-shadow)",
                        fontWeight: 600,
                      }}
                      formatter={(val: any) => [`${val} / 1600`, "Scaled Score"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="var(--color-brand-strong)"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#homeScoreGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 rounded-[var(--ui-radius-sm)] bg-paper-bg">
                <TrendingUp className="w-8 h-8 text-ink-muted mb-2" />
                <p className="text-xs font-semibold text-ink-muted">
                  Complete at least two full-length SAT exams to display progression curve.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Weekly Study Activity Bars */}
        <section className="workbook-panel overflow-hidden flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-border-strong bg-paper-bg px-5 py-4">
            <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight text-ink-fg">
              Weekly Activity
            </h2>
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              Last 7 Days
            </span>
          </div>

          {/* Metric Sub-header Strip (Matches Improvement Trend Height & Layout) */}
          <div className="grid grid-cols-2 border-b border-border-strong bg-surface-white px-5 py-3 text-center divide-x divide-border">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-ink-muted">
                Total Attempts
              </p>
              <p className="mt-1 font-display text-xl sm:text-2xl font-black tabular-nums text-ink-fg">
                {weeklyStudyBars.totalCount}
              </p>
            </div>
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-ink-muted">
                Active Days
              </p>
              <p className="mt-1 font-display text-xl sm:text-2xl font-black tabular-nums text-ink-fg">
                {weeklyStudyBars.days.filter((d) => d.count > 0).length} / 7
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-surface-white flex-1 flex flex-col justify-between">
            {weeklyStudyBars.totalCount === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 rounded-[var(--ui-radius-sm)] bg-paper-bg">
                <Target className="w-8 h-8 text-ink-muted mb-2" />
                <p className="text-xs font-semibold text-ink-muted">
                  No practice activity logged in the last 7 days.
                </p>
              </div>
            ) : (
              <div className="h-44 flex flex-col justify-end">
                <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-full pb-1">
                  {weeklyStudyBars.days.map((day) => {
                    const ratio = day.count / weeklyStudyBars.maxCount;
                    const heightPct = day.count > 0 ? Math.max(ratio * 100, 16) : 4;
                    return (
                      <div key={day.dateKey} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] font-bold tabular-nums text-ink-fg h-4 flex items-center justify-center">
                          {day.count > 0 ? day.count : ""}
                        </span>
                        <div className="flex h-28 w-full items-end justify-center">
                          <div
                            className={`w-full max-w-[28px] rounded-t-sm border border-border transition-all duration-500 ${
                              day.count > 0
                                ? "bg-brand scheme-only-light brutal-shadow-sm"
                                : "bg-paper-bg"
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span
                          className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.06em] truncate ${
                            day.isToday ? "text-ink-fg font-black" : "text-ink-muted"
                          }`}
                        >
                          {day.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Recent Results Section */}
      <section className="workbook-panel overflow-hidden">
        <div className="border-b border-border-strong bg-paper-bg px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-xl font-black tracking-tight text-ink-fg">
              Recent Work
            </h2>
            <Badge variant="muted">{recentResults.length}</Badge>
          </div>
          <Link
            href="/results"
            className="text-xs font-bold text-brand-strong hover:underline flex items-center gap-1"
          >
            <span>View All Results</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-4 sm:p-5">
          {recentResults.length === 0 ? (
            <div className="rounded-[var(--ui-radius-sm)] border border-border bg-paper-bg p-8 text-center text-sm text-ink-muted">
              Complete your first practice test to start your visible results trail.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentResults.map((result) => {
                const title =
                  typeof result.testId === "object"
                    ? result.testId?.title
                    : result.isSectional
                    ? `${result.sectionalSubject || "Sectional"} (Module ${result.sectionalModule || 1})`
                    : "Digital SAT Practice Test";

                const isSectional = result.isSectional || result.mode === "sectional";

                return (
                  <Link
                    key={result._id}
                    href={`/results/${result._id}`}
                    className="group relative flex items-center justify-between gap-4 rounded-[var(--ui-radius-sm)] border border-border bg-surface-white p-4 transition-all duration-150 hover:border-brand shadow-[var(--ui-shadow-xs)]"
                  >
                    <CardHoverPlate />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={isSectional ? "info" : "brand"} size="sm">
                          {isSectional ? "Sectional" : "Full-Length"}
                        </Badge>
                        <span className="text-[11px] text-ink-muted">
                          {formatResultDate(result.createdAt || result.date)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-ink-fg truncate">{title}</p>
                      {result.sectionBreakdown && !isSectional && (
                        <p className="text-[11px] text-ink-muted mt-1 font-mono">
                          R&amp;W {result.sectionBreakdown.readingAndWriting || "—"} · Math{" "}
                          {result.sectionBreakdown.math || "—"}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-ink-muted block">
                        Score
                      </span>
                      <span className="font-display text-2xl sm:text-3xl font-black tracking-tight text-ink-fg tabular-nums leading-none">
                        {result.score || 0}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
