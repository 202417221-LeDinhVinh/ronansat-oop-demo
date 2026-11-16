"use client";

import React from "react";

export interface TabItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ items, activeKey, onChange, className = "" }: TabsProps) {
  return (
    <div
      className={`flex items-center gap-1 border-b border-[var(--border-subtle)] overflow-x-auto ${className}`}
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors cursor-pointer ${
              isActive
                ? "border-[var(--accent-brand)] text-[var(--text-primary)] bg-[var(--accent-brand-tint)]/40 rounded-t-[var(--ui-radius-sm)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] rounded-t-[var(--ui-radius-sm)]"
            }`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge && <span className="ml-1">{item.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
