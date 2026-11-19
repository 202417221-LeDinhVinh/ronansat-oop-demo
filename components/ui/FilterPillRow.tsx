"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";

export type FilterPillProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (nextValue: string) => void;
  onClear?: () => void;
  className?: string;
};

export function FilterPill({
  label,
  value,
  options,
  onChange,
  onClear,
  className = "",
}: FilterPillProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);
  const displaySummary = selectedOption?.label || value || "Any";
  const hasValue = Boolean(value && value !== "" && value !== "all");

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <div className="group flex items-center rounded-[var(--ui-radius-sm)] border border-border bg-surface-white text-xs font-semibold text-ink-fg transition hover:border-border-strong">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`flex h-7 items-center gap-1.5 px-2.5 workbook-press ${hasValue ? "pr-1" : "pr-2"}`}
        >
          <span className="text-ink-muted font-normal">{label}</span>
          <span className="text-ink-muted">·</span>
          <span className="max-w-[8rem] truncate font-semibold text-ink-fg">{displaySummary}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-ink-muted" />
        </button>

        {hasValue && onClear && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            aria-label={`Clear ${label} filter`}
            className="flex h-7 w-6 items-center justify-center text-ink-muted hover:text-ink-fg cursor-pointer rounded-r-[var(--ui-radius-sm)]"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[12rem] rounded-[var(--ui-radius-sm)] border border-border bg-surface-white p-1 shadow-[var(--ui-shadow-md)]">
          <div className="max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-[calc(var(--ui-radius-sm)-0.1rem)] px-2.5 py-1.5 text-left text-xs font-medium transition ${
                    isSelected
                      ? "bg-brand-tint text-ink-fg font-semibold"
                      : "text-ink-fg hover:bg-paper-bg"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-brand-strong" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterPillRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
    </div>
  );
}
