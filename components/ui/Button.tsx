"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ink" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      icon,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-8 px-2.5 text-xs rounded-[var(--ui-radius-sm)]",
      md: "h-9.5 px-3.5 text-sm rounded-[var(--ui-radius-sm)]",
      lg: "h-11 px-5 text-base rounded-[var(--ui-radius)]",
    }[size];

    const variantClasses = {
      primary: "workbook-button",
      secondary: "workbook-button-secondary",
      ink: "workbook-button-ink",
      danger: "bg-[var(--state-danger)] text-white hover:bg-[#c94a24] shadow-[var(--ui-shadow-xs)] font-semibold transition-colors duration-150",
      ghost: "text-[var(--text-primary)] hover:bg-[#faf1de] hover:text-[var(--text-primary)] font-medium transition-colors duration-150",
      outline: "border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface)] hover:border-[var(--accent-brand)] font-medium transition-colors duration-150",
    }[variant];

    const baseClasses =
      "inline-flex items-center justify-center font-medium gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-brand)]";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
