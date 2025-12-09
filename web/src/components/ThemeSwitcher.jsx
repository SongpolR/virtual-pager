// web/src/components/ThemeSwitcher.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "theme"; // 'light' | 'dark'

function applyTheme(value) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.dataset.theme = value;

  if (value === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore storage errors
  }
}

export default function ThemeSwitcher({ className = "" }) {
  const { t } = useTranslation("common");
  const [theme, setTheme] = useState("dark");

  // Initialize from localStorage or system preference
  useEffect(() => {
    let initial = "dark";

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        initial = stored;
      } else if (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        initial = "dark";
      } else {
        initial = "light";
      }
    } catch {
      initial = "dark";
    }

    setTheme(initial);
    applyTheme(initial);
  }, []);

  const setThemeAndApply = (value) => {
    setTheme(value);
    applyTheme(value);
  };

  const isDark = theme === "dark";

  return (
    <div
      className={[
        "inline-flex items-center gap-1 rounded-full border px-1 py-0.5 text-[11px] font-medium",
        "border-slate-200 bg-slate-50/90 text-slate-700 shadow-sm backdrop-blur-sm",
        "dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200",
        className,
      ].join(" ")}
    >
      {/* Light */}
      <button
        type="button"
        onClick={() => setThemeAndApply("light")}
        aria-pressed={!isDark}
        className={[
          "inline-flex items-center gap-1 rounded-full px-2 py-1 transition-all",
          !isDark
            ? "bg-white text-slate-900 shadow-sm shadow-indigo-300/60 dark:bg-slate-100 dark:text-slate-900"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100",
        ].join(" ")}
      >
        <span aria-hidden="true" className="text-xs">
          ☀️
        </span>
        <span className="hidden sm:inline">{t("light")}</span>
      </button>

      {/* Dark */}
      <button
        type="button"
        onClick={() => setThemeAndApply("dark")}
        aria-pressed={isDark}
        className={[
          "inline-flex items-center gap-1 rounded-full px-2 py-1 transition-all",
          isDark
            ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/60 dark:bg-indigo-500 dark:text-white"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100",
        ].join(" ")}
      >
        <span aria-hidden="true" className="text-xs">
          🌙
        </span>
        <span className="hidden sm:inline">{t("dark")}</span>
      </button>
    </div>
  );
}
