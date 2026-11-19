"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CompactPaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

type PaginationItem = number | "ellipsis";

function getPaginationItems(page: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages];
  }

  if (page >= totalPages - 2) {
    return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages].filter(
      (item, index, items) => item > 0 && items.indexOf(item) === index
    );
  }

  return [page - 2, page - 1, page, page + 1, "ellipsis", totalPages];
}

export function CompactPagination({
  page,
  totalPages,
  onChange,
  className = "",
}: CompactPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--ui-radius-sm)] border border-border bg-surface-white text-ink-fg transition-all active:bg-paper-bg disabled:cursor-not-allowed disabled:opacity-40 workbook-press"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getPaginationItems(page, totalPages).map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-sm font-semibold text-ink-muted">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={[
              "inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--ui-radius-sm)] border px-3 text-xs font-semibold transition-all workbook-press",
              item === page
                ? "border-brand bg-brand-tint text-ink-fg shadow-[var(--ui-shadow-xs)]"
                : "border-border bg-surface-white text-ink-muted hover:text-ink-fg hover:bg-paper-bg",
            ].join(" ")}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--ui-radius-sm)] border border-border bg-surface-white text-ink-fg transition-all active:bg-paper-bg disabled:cursor-not-allowed disabled:opacity-40 workbook-press"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
