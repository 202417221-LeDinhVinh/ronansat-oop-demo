"use client";

import React, { forwardRef } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", error, label, id, options, children, ...props }, ref) => {
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
        <select
          id={id}
          ref={ref}
          className={`workbook-input ${error ? "!border-[var(--state-danger)]" : ""} ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && (
          <p className="mt-1 text-xs text-[var(--state-danger)] font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
