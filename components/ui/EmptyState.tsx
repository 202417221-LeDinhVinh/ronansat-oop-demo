import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-[var(--ui-radius)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-canvas)]/60 ${className}`}
    >
      {icon && (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-brand-tint)] text-[var(--accent-brand-strong)] mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-[var(--text-muted)] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
