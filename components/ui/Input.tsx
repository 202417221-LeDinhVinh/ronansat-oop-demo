"use client";

import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, label, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={`workbook-input ${error ? "!border-[var(--state-danger)] focus:!ring-[var(--state-danger)]/20" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[var(--state-danger)] font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
