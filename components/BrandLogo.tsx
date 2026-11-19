import React from "react";
import Link from "next/link";

export default function BrandLogo({
  className = "",
  size = "md",
  href = "/",
  subtitle,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
  subtitle?: string;
}) {
  const iconSize = {
    sm: "w-7 h-7 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-9 h-9 text-base",
  }[size];

  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[size];

  const content = (
    <div className={`flex items-center gap-2.5 font-display select-none ${className}`}>
      {/* Refined Gold Geometric Mark */}
      <div
        className={`${iconSize} rounded-[var(--ui-radius-sm)] bg-brand text-ink-fg font-black flex items-center justify-center shadow-[var(--ui-shadow-xs)] shrink-0 border border-border`}
      >
        <span>R</span>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className={`font-bold tracking-tight text-ink-fg uppercase ${textSize}`}>
            Ronan <span className="text-brand-strong">SAT</span>
          </span>
          <span className="text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-brand-tint text-brand-strong border border-border">
            OOP
          </span>
        </div>
        {subtitle && (
          <span className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-brand-strong leading-none">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
