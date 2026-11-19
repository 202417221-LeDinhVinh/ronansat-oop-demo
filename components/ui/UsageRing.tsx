"use client";

import React from "react";

export type UsageRingTone = "default" | "brand" | "warn" | "danger" | "success";

export function UsageRing({
  pct,
  tone = "brand",
  size = 24,
  strokeWidth = 2.5,
  className = "",
}: {
  pct: number;
  tone?: UsageRingTone;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / 100) * circumference;

  const strokeColor =
    tone === "danger"
      ? "stroke-[var(--state-danger)]"
      : tone === "warn"
      ? "stroke-amber-500"
      : tone === "success"
      ? "stroke-[var(--state-success)]"
      : "stroke-[var(--accent-brand)]";

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={`shrink-0 -rotate-90 ${className}`}
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-[var(--border-subtle)]"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={`transition-all duration-500 ${strokeColor}`}
        strokeDasharray={`${filled} ${circumference}`}
      />
    </svg>
  );
}

export function StudyRingProgress({
  completed,
  total,
  label,
  sublabel,
  size = 110,
}: {
  completed: number;
  total: number;
  label: string;
  sublabel?: string;
  size?: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.min(100, pct) / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          className="-rotate-90 shrink-0"
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-[var(--border-subtle)]"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="stroke-[var(--accent-brand)] transition-all duration-700 ease-out"
            strokeDasharray={`${filled} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-2xl font-black text-ink-fg leading-none tabular-nums">
            {completed}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mt-0.5">
            of {total}
          </span>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold text-ink-fg leading-snug">{label}</h4>
        {sublabel && <p className="mt-0.5 text-xs text-ink-muted">{sublabel}</p>}
        <div className="mt-2 inline-flex items-center gap-1 rounded-[var(--ui-radius-sm)] bg-brand-tint px-2 py-0.5 text-[11px] font-bold text-ink-fg">
          {pct}% done
        </div>
      </div>
    </div>
  );
}
