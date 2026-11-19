"use client";

import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { ModalDialog } from "./ModalDialog";
import { Button } from "./Button";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary" | "brand";
  isConfirming?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  isConfirming = false,
  onConfirm,
}: ConfirmDialogProps) {
  const iconTone =
    tone === "danger"
      ? "bg-[#fdede8] text-[var(--state-danger)] border-[#f8c4b4]"
      : "bg-brand-tint text-brand-strong border-[#ecd49d]";

  return (
    <ModalDialog
      open={open}
      onClose={() => !isConfirming && onOpenChange(false)}
      title={title}
      maxWidthClassName="max-w-md"
      closeDisabled={isConfirming}
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            disabled={isConfirming}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            size="sm"
            disabled={isConfirming}
            onClick={onConfirm}
          >
            {isConfirming ? "Processing..." : confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${iconTone}`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-1 pt-0.5">
          <p className="text-sm text-ink-muted leading-relaxed">
            {description || "Are you sure you want to proceed with this action?"}
          </p>
        </div>
      </div>
    </ModalDialog>
  );
}
