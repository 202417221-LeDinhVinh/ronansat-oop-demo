"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { TableSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import api from "@/lib/axios";

interface ScoreTrendPoint {
  date: string;
  score: number;
  testTitle?: string;
  mode?: string;
}

interface SectionalTrendPoint {
  attemptId: string;
  testTitle: string;
  section: string;
  module?: number;
  date: string;
  score: number;
}

interface SectionAccuracy {
  section: string;
  correct: number;
  total: number;
  percentage: number;
}

interface SkillPerformance {
  domain: string;
  skill: string;
  accuracy: number;
  questionsAnswered: number;
}

interface HeatmapItem {
  date: string;
  count: number;
}

interface AnalyticsSnapshot {
  totalTestsTaken: number;
  totalFullLengthTaken?: number;
  totalSectionalTaken?: number;
  highestScore: number;
  latestScore: number;
  averageScore: number;
  latestSectionalScore?: number;
  averageSectionalScore?: number;
  questionsAnswered: number;
  scoreTrend: ScoreTrendPoint[];
  sectionalTrend?: SectionalTrendPoint[];
  sectionAccuracy: SectionAccuracy[];
  strongestSkills: SkillPerformance[];
  weakestSkills: SkillPerformance[];
  activityHeatmap: HeatmapItem[];
}

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-ink-fg/[0.08]">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(value, value > 0 ? 5 : 0))}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function StatisticsPage() {
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/statistics");
      setData(res.data?.statistics || null);
    } catch (err: any) {
      console.error("Failed to load statistics:", err);
      setError("Failed to load performance analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  // Compute 12-week (84 days) Activity Heatmap Grid
  const heatmapGrid = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const countMap = new Map<string, number>();
    if (data?.activityHeatmap) {
      data.activityHeatmap.forEach((item) => {
        countMap.set(item.date, item.count);
      });
    }

    // 12 weeks = 84 days
    const days = Array.from({ length: 84 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (83 - i));
      const key = d.toISOString().split("T")[0];
      const count = countMap.get(key) || 0;
      return {
        date: d,
        dateKey: key,
        count,
      };
    });

    return days;
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Performance Analytics" description="Loading metrics..." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Performance Analytics" />
        <div className="p-4 rounded-[var(--ui-radius)] bg-[#fdede8] border border-[#f8c4b4] text-[#ab3d19] text-sm flex items-center justify-between">
          <span>{error || "Could not load statistics."}</span>
          <Button variant="secondary" size="sm" onClick={fetchStatistics}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const chartData = (data.scoreTrend || []).map((pt) => ({
    date: pt.date ? pt.date.slice(5) : "",
    score: pt.score,
    testTitle: pt.testTitle,
  }));

  const barData = (data.sectionAccuracy || []).map((sec) => ({
    name: sec.section === "Reading and Writing" ? "Reading & Writing" : "Math",
    accuracy: sec.percentage,
    correct: sec.correct,
    total: sec.total,
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Performance Analytics & Statistics"
        description="Detailed score trajectory, sectional accuracy benchmarks, and skill mastery breakdowns."
        badge={<Badge variant="brand">{data.totalTestsTaken} Tests Logged</Badge>}
      />

      {/* 4 Key Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Highest Scaled Score"
          value={data.highestScore >= 400 ? data.highestScore : "—"}
          sublabel="Full-Length (400-1600)"
          icon={<Trophy className="w-4 h-4" />}
        />
        <StatCard
          label="Average Score"
          value={data.averageScore >= 400 ? data.averageScore : "—"}
          sublabel={`Across ${data.totalFullLengthTaken ?? data.totalTestsTaken} full exams`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Latest Scaled Score"
          value={data.latestScore >= 400 ? data.latestScore : "—"}
          sublabel="Full-Length (400-1600)"
          icon={<Award className="w-4 h-4" />}
        />
        <StatCard
          label="Questions Answered"
          value={data.questionsAnswered || 0}
          sublabel="Total practice volume"
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
      </div>

      {/* Charts Grid: Score Trend + Section Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Trend Line Chart */}
        <section className="workbook-panel overflow-hidden flex flex-col justify-between">
          <div className="border-b border-border-strong bg-paper-bg px-5 py-4">
            <h2 className="font-display text-xl font-black tracking-tight text-ink-fg">
              Full-Length Score Trend
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Scaled total score trajectory across attempts (400–1600 scale)
            </p>
          </div>

          <div className="p-5 bg-surface-white">
            <div className="h-64 w-full">
              {chartData.length >= 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="statScoreGrad" x1="0" y1="0" x2="0" y2="1">
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
                      formatter={(val: any) => [`${val} pts`, "Score"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="var(--color-brand-strong)"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#statScoreGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-ink-muted">
                  Take at least 2 full-length tests to visualize score trend
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section Accuracy Bar Chart */}
        <section className="workbook-panel overflow-hidden flex flex-col justify-between">
          <div className="border-b border-border-strong bg-paper-bg px-5 py-4">
            <h2 className="font-display text-xl font-black tracking-tight text-ink-fg">
              Section Accuracy (%)
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Benchmark comparison between Reading &amp; Writing and Math
            </p>
          </div>

          <div className="p-5 bg-surface-white">
            <div className="h-64 w-full">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      stroke="var(--color-ink-fg)"
                      strokeOpacity={0.07}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fontWeight: 600, fill: "var(--color-ink-muted)" }}
                      tickLine={false}
                      axisLine={{ stroke: "var(--color-border)" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
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
                      formatter={(val: any, _name: any, item: any) => [
                        `${val}% (${item.payload.correct} / ${item.payload.total} questions)`,
                        "Accuracy",
                      ]}
                    />
                    <Bar
                      dataKey="accuracy"
                      fill="var(--color-brand)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-ink-muted">
                  No section attempts recorded yet
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Sectional Drills History (200-800 scale) */}
      {data.sectionalTrend && data.sectionalTrend.length > 0 && (
        <section className="workbook-panel overflow-hidden">
          <div className="border-b border-border-strong bg-paper-bg px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-black tracking-tight text-ink-fg">
                Targeted Sectional Drills (200–800 Scale)
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Focused modular practice scores
              </p>
            </div>
            <Badge variant="info">{data.sectionalTrend.length} Drills</Badge>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.sectionalTrend.map((sec, idx) => (
              <div
                key={sec.attemptId || idx}
                className="p-3.5 rounded-[var(--ui-radius-sm)] bg-paper-bg border border-border flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-ink-fg block truncate">
                    {sec.section}
                  </span>
                  <span className="text-[11px] text-ink-muted block mt-0.5">
                    Module {sec.module || 1} · {sec.date ? sec.date.slice(5) : ""}
                  </span>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className="text-lg font-display font-black text-ink-fg block tabular-nums leading-none">
                    {sec.score}
                  </span>
                  <span className="text-[10px] font-bold text-ink-muted block mt-0.5">
                    / 800
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 12-WEEK ACTIVITY HEATMAP (84 DAYS) */}
      <section className="workbook-panel overflow-hidden">
        <div className="border-b border-border-strong bg-paper-bg px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-black tracking-tight text-ink-fg flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-strong" />
              <span>Practice Activity Heatmap</span>
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Daily test sessions logged over the last 12 weeks (84 days)
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-ink-muted font-medium">
            <span>Less</span>
            <div className="w-3 h-3 rounded-xs bg-[#e7e3dd]/60" />
            <div className="w-3 h-3 rounded-xs bg-brand-tint border border-[#ecd49d]" />
            <div className="w-3 h-3 rounded-xs bg-[#f5e2b8]" />
            <div className="w-3 h-3 rounded-xs bg-[#e0b354]" />
            <span>More</span>
          </div>
        </div>

        <div className="p-5 overflow-x-auto">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[640px]">
            {heatmapGrid.map((day) => {
              let colorClass = "bg-[#e7e3dd]/60";
              if (day.count === 1) colorClass = "bg-brand-tint border border-[#ecd49d]";
              else if (day.count === 2) colorClass = "bg-[#f5e2b8]";
              else if (day.count >= 3) colorClass = "bg-[#e0b354]";

              return (
                <div
                  key={day.dateKey}
                  title={`${day.count} test attempts on ${day.dateKey}`}
                  className={`w-3.5 h-3.5 rounded-xs transition-colors ${colorClass}`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* DOMAIN & SKILL TABLE WITH MINI BARS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strongest Skills */}
        <section className="workbook-panel overflow-hidden">
          <div className="border-b border-border-strong bg-paper-bg px-5 py-4 flex items-center justify-between">
            <h2 className="font-display text-base font-black tracking-tight text-ink-fg flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-success" />
              <span>Top Mastery Skills</span>
            </h2>
            <Badge variant="success" size="sm">High Accuracy</Badge>
          </div>

          <div className="p-5 space-y-4">
            {data.strongestSkills && data.strongestSkills.length > 0 ? (
              data.strongestSkills.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="font-bold text-ink-fg truncate">{item.skill}</span>
                    <span className="font-bold tabular-nums text-success shrink-0">
                      {item.accuracy}% ({item.questionsAnswered} answered)
                    </span>
                  </div>
                  <StatBar value={item.accuracy} color="var(--color-success)" />
                  <p className="text-[10px] text-ink-muted truncate">{item.domain}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-muted text-center py-4">No skill data available yet.</p>
            )}
          </div>
        </section>

        {/* Weakest Skills */}
        <section className="workbook-panel overflow-hidden">
          <div className="border-b border-border-strong bg-paper-bg px-5 py-4 flex items-center justify-between">
            <h2 className="font-display text-base font-black tracking-tight text-ink-fg flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-danger" />
              <span>Focus Areas for Review</span>
            </h2>
            <Badge variant="danger" size="sm">Needs Practice</Badge>
          </div>

          <div className="p-5 space-y-4">
            {data.weakestSkills && data.weakestSkills.length > 0 ? (
              data.weakestSkills.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="font-bold text-ink-fg truncate">{item.skill}</span>
                    <span className="font-bold tabular-nums text-danger shrink-0">
                      {item.accuracy}% ({item.questionsAnswered} answered)
                    </span>
                  </div>
                  <StatBar value={item.accuracy} color="var(--color-danger)" />
                  <p className="text-[10px] text-ink-muted truncate">{item.domain}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-muted text-center py-4">No weak skills identified yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
