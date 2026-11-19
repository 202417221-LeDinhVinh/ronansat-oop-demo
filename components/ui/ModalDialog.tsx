"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function ModalDialog({
  open,
  onClose,
  title,
  description,
  maxWidthClassName = "max-w-lg",
  closeDisabled = false,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  maxWidthClassName?: string;
  closeDisabled?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closeDisabled) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDisabled, open, onClose]);

  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="workbook-modal-backdrop fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4"
      role="presentation"
      onMouseDown={closeDisabled ? undefined : onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={`workbook-modal-card flex h-full max-h-full w-full flex-col overflow-hidden sm:h-auto sm:max-h-[min(90vh,42rem)] ${maxWidthClassName}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-paper-bg px-5 py-4">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink-fg">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Close dialog"
            className="rounded-[var(--ui-radius-sm)] border border-border bg-surface-white p-1.5 text-ink-fg workbook-press disabled:cursor-not-allowed disabled:opacity-50 hover:bg-canvas transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="workbook-scrollbar min-h-0 flex-1 overflow-y-auto p-5 text-sm">
          {children}
        </div>

        {footer ? (
          <footer className="shrink-0 border-t border-border bg-paper-bg px-5 py-3.5">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>,
    document.body
  );
}

export default ModalDialog;
