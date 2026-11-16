"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3 p-8">
      <div className="w-10 h-10 rounded-full bg-[var(--accent-brand-tint)] flex items-center justify-center text-[var(--accent-brand-strong)] shadow-[var(--ui-shadow-xs)]">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
      <p className="text-sm font-medium text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
