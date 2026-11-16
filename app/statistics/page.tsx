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
  LineChart,
  Line,
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
import { Card } from "@/components/ui/Card";
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

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Highest Scaled Score"
          value={data.highestScore >= 400 ? data.highestScore : "—"}
          sublabel="Full-Length (400-1600)"
          icon={<Trophy className="w-4 h-4" />}
        />
        <StatCard
          label="Average Full-Length"
          value={data.averageScore >= 400 ? data.averageScore : "—"}
          sublabel={`Full-length avg (${data.totalFullLengthTaken ?? data.totalTestsTaken} tests)`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Latest Full-Length"
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
        <Card className="flex flex-col justify-between">
          <div className="mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Trajectory Over Time
            </span>
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
              Total Score Trend (400-1600)
            </h3>
          </div>

          <div className="h-64 w-full">
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-brand)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--accent-brand)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e3dd" vertical={false} />
                  <XAxis dataKey="date" stroke="#78716c" fontSize={11} tickLine={false} />
                  <YAxis domain={["dataMin - 60", "dataMax + 60"]} stroke="#78716c" fontSize={11} tickLine={false} />
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
                    fill="url(#scoreColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                Take at least 2 tests to visualize score trend
              </div>
            )}
          </div>
        </Card>

        {/* Section Accuracy Bar Chart */}
        <Card className="flex flex-col justify-between">
          <div className="mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Domain Balance
            </span>
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
              Section Accuracy (%)
            </h3>
          </div>

          <div className="h-64 w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e3dd" vertical={false} />
                  <XAxis dataKey="name" stroke="#78716c" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#78716c" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-subtle)",
                      borderRadius: "var(--ui-radius-sm)",
                      fontSize: "12px",
                      boxShadow: "var(--ui-shadow)",
                    }}
                    formatter={(val: any, _name: any, item: any) => [
                      `${val}% (${item.payload.correct}/${item.payload.total} questions)`,
                      "Accuracy",
                    ]}
                  />
                  <Bar dataKey="accuracy" fill="var(--accent-brand)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                No section attempts recorded yet
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Sectional Drills History (200-800 scale) */}
      {data.sectionalTrend && data.sectionalTrend.length > 0 && (
        <Card>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-subtle)]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Targeted Practice
              </span>
              <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                Sectional Drills (200-800 Scale)
              </h3>
            </div>
            <Badge variant="info">
              {data.sectionalTrend.length} Drills Taken
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.sectionalTrend.map((sec, idx) => (
              <div
                key={sec.attemptId || idx}
                className="p-3.5 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-[var(--text-primary)] block">
                    {sec.section}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                    Module {sec.module || 1} · {sec.date ? sec.date.slice(5) : ""}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-[var(--text-primary)] block">
                    {sec.score}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] block">
                    / 800
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* -------------------------------------------------------------------
          12-WEEK ACTIVITY HEATMAP (84 DAYS)
      -------------------------------------------------------------------- */}
      <Card>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--accent-brand-strong)]" />
              Practice Activity Heatmap (Last 12 Weeks)
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Daily test sessions completed over the last 84 days.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
            <span>Less</span>
            <div className="w-3 h-3 rounded-xs bg-[#e7e3dd]/60" />
            <div className="w-3 h-3 rounded-xs bg-[#faf1de] border border-[#ecd49d]" />
            <div className="w-3 h-3 rounded-xs bg-[#f5e2b8]" />
            <div className="w-3 h-3 rounded-xs bg-[#e0b354]" />
            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[640px]">
            {heatmapGrid.map((day) => {
              let colorClass = "bg-[#e7e3dd]/60";
              if (day.count === 1) colorClass = "bg-[#faf1de] border border-[#ecd49d]";
              else if (day.count === 2) colorClass = "bg-[#f5e2b8]";
              else if (day.count >= 3) colorClass = "bg-[#e0b354]";

              return (
                <div
                  key={day.dateKey}
                  title={`${day.count} tests on ${day.dateKey}`}
                  className={`w-3.5 h-3.5 rounded-xs transition-colors ${colorClass}`}
                />
              );
            })}
          </div>
        </div>
      </Card>

      {/* -------------------------------------------------------------------
          STRONGEST & WEAKEST SKILLS CARDS
      -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strongest Skills */}
        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-[var(--state-success)]" />
              Strongest SAT Skills (Highest Accuracy)
            </h3>
            <Badge variant="success" size="sm">Top Mastery</Badge>
          </div>

          <div className="space-y-3">
            {data.strongestSkills && data.strongestSkills.length > 0 ? (
              data.strongestSkills.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {item.skill}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {item.domain} · {item.questionsAnswered} questions
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-[var(--state-success)] shrink-0">
                    {item.accuracy}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-muted)]">No skill data available yet.</p>
            )}
          </div>
        </Card>

        {/* Weakest Skills */}
        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-[var(--state-danger)]" />
              Skills to Improve (Recommended Review)
            </h3>
            <Badge variant="danger" size="sm">Focus Areas</Badge>
          </div>

          <div className="space-y-3">
            {data.weakestSkills && data.weakestSkills.length > 0 ? (
              data.weakestSkills.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {item.skill}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {item.domain} · {item.questionsAnswered} questions
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-[var(--state-danger)] shrink-0">
                    {item.accuracy}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-muted)]">No weak skills identified yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
