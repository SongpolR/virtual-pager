// web/src/components/LoadingSpinner.jsx
import React from "react";

export default function LoadingSpinner({
  label = "Loading...",
  fullscreen = false,
}) {
  const containerClasses = fullscreen
    ? "fixed inset-0 z-40 flex items-center justify-center bg-white/60"
    : "flex items-center justify-center";

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-3 text-gray-600 text-sm">
        <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}
