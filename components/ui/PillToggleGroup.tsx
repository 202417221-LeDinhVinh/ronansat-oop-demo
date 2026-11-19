"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

export type PillToggleOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

export function PillToggleGroup<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = "",
  scrollable = false,
}: {
  options: readonly PillToggleOption<T>[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel?: string;
  layoutIdPrefix?: string;
  className?: string;
  scrollable?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`items-center gap-1 rounded-[var(--ui-radius)] border border-border bg-surface-white p-1 ${
        scrollable
          ? "no-scrollbar flex w-fit max-w-full justify-start overflow-x-auto"
          : "inline-flex"
      } ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`relative inline-flex h-7 items-center gap-1.5 rounded-[var(--ui-radius-sm)] px-3 text-xs font-semibold transition-all duration-150 workbook-press ${
              scrollable ? "shrink-0 whitespace-nowrap" : ""
            } ${
              active
                ? "border border-brand bg-brand-tint text-ink-fg shadow-[var(--ui-shadow-xs)]"
                : "border border-transparent text-ink-muted hover:text-ink-fg hover:bg-paper-bg"
            }`}
          >
            {Icon ? <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" /> : null}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
