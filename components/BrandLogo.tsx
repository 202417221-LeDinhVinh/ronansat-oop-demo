import React from "react";
import Link from "next/link";

export default function BrandLogo({
  className = "",
  size = "md",
  href = "/",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
}) {
  const iconSize = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  }[size];

  const textSize = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  }[size];

  const content = (
    <div className={`flex items-center gap-2.5 font-display select-none ${className}`}>
      {/* Refined Gold Geometric Mark */}
      <div
        className={`${iconSize} rounded-[var(--ui-radius-sm)] bg-[var(--accent-brand)] text-[var(--text-on-brand)] font-black flex items-center justify-center shadow-[var(--ui-shadow-xs)] shrink-0`}
      >
        <span>R</span>
      </div>
      <div className="flex items-baseline gap-1.5 leading-none">
        <span className={`font-bold tracking-tight text-[var(--text-primary)] ${textSize}`}>
          Ronan<span className="text-[#967324] ml-0.5">SAT</span>
        </span>
        <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-[var(--accent-brand-tint)] text-[#8c6b1f] border border-[#ecd49d]">
          OOP v2
        </span>
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
