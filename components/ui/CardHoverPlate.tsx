"use client";

import React from "react";

export function CardHoverPlate({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -inset-2.5 -z-10 rounded-[calc(var(--ui-radius)+0.25rem)] bg-ink-fg/[0.045] opacity-0 scale-95 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:scale-100 ${className}`}
    />
  );
}

export default CardHoverPlate;
