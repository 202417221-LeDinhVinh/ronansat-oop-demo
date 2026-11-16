import React from "react";
import { Card } from "./Card";

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
    <Card
      onClick={onClick}
      className={`transition-all duration-150 ${onClick ? "cursor-pointer hover:border-[var(--accent-brand)] hover:shadow-[var(--ui-shadow-md)]" : ""} ${className}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </span>
        {icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-[var(--ui-radius-sm)] bg-[var(--accent-brand-tint)] text-[var(--accent-brand-strong)]">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trend.positive ? "text-[var(--state-success)]" : "text-[var(--state-danger)]"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {sublabel && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">{sublabel}</p>
      )}
    </Card>
  );
}
