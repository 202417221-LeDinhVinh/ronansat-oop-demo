import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "brand" | "success" | "danger" | "info" | "muted" | "neutral";
  size?: "sm" | "md";
}

export function Badge({
  className = "",
  variant = "brand",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  }[size];

  const variantClasses = {
    brand: "bg-[var(--accent-brand-tint)] text-[#8c6b1f] border border-[#ecd49d]",
    success: "bg-[#e8f7f0] text-[#166e4b] border border-[#b2e5ce]",
    danger: "bg-[#fdede8] text-[#ab3d19] border border-[#f8c4b4]",
    info: "bg-[#ebf2fe] text-[#1d50b3] border border-[#bdd5fc]",
    muted: "bg-[var(--bg-canvas)] text-[var(--text-muted)] border border-[var(--border-subtle)]",
    neutral: "bg-white text-[var(--text-primary)] border border-[var(--border-strong)]",
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-[var(--ui-radius-sm)] transition-colors select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
