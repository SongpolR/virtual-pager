// web/src/components/ConfirmModal.jsx
import React from "react";
import Dialog from "./Dialog";

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,

  // optional
  variant = "danger", // 'danger' | 'primary' | 'neutral'
}) {
  const confirmBtnClass =
    variant === "primary"
      ? "bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/30 focus-visible:ring-indigo-300"
      : variant === "neutral"
      ? "bg-slate-900 hover:bg-slate-800 shadow-slate-900/20 focus-visible:ring-slate-300 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
      : "bg-red-500 hover:bg-red-400 shadow-red-500/30 focus-visible:ring-red-300";

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={message}
      size="sm"
      closeOnBackdrop={true}
      closeOnEsc={true}
      showCloseButton={false}
      ariaLabelledById="confirm-title"
      ariaDescribedById="confirm-desc"
    >
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="
            inline-flex items-center justify-center
            rounded-full px-4 py-2 text-sm font-medium
            border border-slate-300 bg-white text-slate-700
            shadow-sm transition
            hover:bg-slate-50
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300
            dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200
            dark:hover:bg-slate-800
          "
        >
          {cancelLabel}
        </button>

        <button
          type="button"
          onClick={onConfirm}
          className={[
            "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white",
            "shadow-md transition",
            "hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-2",
            confirmBtnClass,
          ].join(" ")}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
