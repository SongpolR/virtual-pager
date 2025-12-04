// web/src/components/ToastProvider.jsx
import React, { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(
    ({
      type = "info", // 'info' | 'success' | 'warning' | 'error'
      message = "",
      duration = 5000,
      dismissible = true,
    }) => {
      if (!message) return;
      const id = ++toastIdCounter;

      const toast = { id, type, message, dismissible };
      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Toast viewport */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => {
          let theme = "bg-slate-50 border-slate-300 text-slate-800";
          if (toast.type === "success") {
            theme = "bg-emerald-50 border-emerald-400 text-emerald-800";
          } else if (toast.type === "error") {
            theme = "bg-red-50 border-red-400 text-red-800";
          } else if (toast.type === "warning") {
            theme = "bg-amber-50 border-amber-400 text-amber-900";
          } else if (toast.type === "info") {
            theme = "bg-blue-50 border-blue-400 text-blue-800";
          }

          return (
            <div
              key={toast.id}
              className={`shadow-md border px-3 py-2 rounded flex items-start gap-2 min-w-[220px] max-w-sm ${theme}`}
            >
              <div className="flex-1 text-sm">{toast.message}</div>
              {toast.dismissible && (
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="ml-2 text-xs font-semibold opacity-70 hover:opacity-100"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
