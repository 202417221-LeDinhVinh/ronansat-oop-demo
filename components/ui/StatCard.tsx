import React from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  trend,
  className = "",
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`workbook-panel p-5 transition-all duration-150 ${
        onClick
          ? "cursor-pointer hover:border-brand hover:shadow-[var(--ui-shadow-md)]"
          : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.06em] text-ink-muted">
          {label}
        </span>
        {icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-[var(--ui-radius-sm)] border border-border bg-brand-tint text-brand-strong shrink-0">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-3xl sm:text-4xl font-black tracking-tight text-ink-fg leading-none tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trend.positive ? "text-success" : "text-danger"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {sublabel && (
        <p className="mt-1.5 text-xs text-ink-muted leading-snug">{sublabel}</p>
      )}
    </div>
  );
}
