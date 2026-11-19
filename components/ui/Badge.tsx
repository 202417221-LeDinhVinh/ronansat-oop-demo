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
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-0.5 text-xs",
  }[size];

  const variantClasses = {
    brand: "bg-brand-tint text-brand-strong border border-[#ecd49d] font-bold",
    success: "bg-[#e8f7f0] text-success border border-[#b2e5ce] font-bold",
    danger: "bg-[#fdede8] text-danger border border-[#f8c4b4] font-bold",
    info: "bg-[#ebf2fe] text-[var(--state-info)] border border-[#bdd5fc] font-bold",
    muted: "bg-paper-bg text-ink-muted border border-border font-medium",
    neutral: "bg-surface-white text-ink-fg border border-border-strong font-medium",
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-[var(--ui-radius-sm)] transition-colors select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
