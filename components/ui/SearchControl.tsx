"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export type SearchControlProps = {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
};

export function SearchControl({
  query,
  onQueryChange,
  placeholder = "Search...",
  "aria-label": ariaLabel = "Search",
  className = "",
}: SearchControlProps) {
  const [isOpen, setIsOpen] = useState(Boolean(query.trim()));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !query.trim()
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, query]);

  return (
    <div ref={containerRef} className={`relative flex h-8 items-center justify-end ${className}`}>
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !query.trim()) {
            setIsOpen(false);
          }
        }}
        placeholder={placeholder}
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        className={`h-8 border-0 border-b bg-transparent pl-2 pr-8 text-xs font-medium text-ink-fg outline-none transition-all duration-200 focus:outline-none ${
          isOpen
            ? "w-44 border-border-strong opacity-100 sm:w-60 focus:border-brand"
            : "w-0 border-transparent px-0 opacity-0"
        }`}
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            onQueryChange("");
            setIsOpen(false);
          }}
          aria-label="Clear search"
          className="absolute right-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--ui-radius-sm)] text-ink-muted hover:text-ink-fg transition-colors workbook-press"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-label={isOpen ? "Close search" : ariaLabel}
          aria-pressed={isOpen}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--ui-radius-sm)] transition-colors workbook-press ${
            isOpen ? "text-ink-fg" : "text-ink-muted hover:text-ink-fg"
          }`}
        >
          <Search className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
