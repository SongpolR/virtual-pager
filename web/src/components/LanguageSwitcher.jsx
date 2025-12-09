// web/src/components/LanguageSwitcher.jsx
import React from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher({ className = "" }) {
  const { i18n, t } = useTranslation("common");
  const lang = i18n.resolvedLanguage || i18n.language || "en";

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem("lang", code);
    } catch {
      // ignore storage errors
    }
  };

  const Btn = ({ code, label }) => {
    const active = lang === code;

    return (
      <button
        type="button"
        onClick={() => changeLang(code)}
        aria-pressed={active}
        className={[
          "relative inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
          active
            ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/60"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-50 dark:hover:bg-slate-800",
        ].join(" ")}
      >
        <span className="xs:hidden uppercase">{code}</span>
      </button>
    );
  };

  return (
    <div
      className={[
        "inline-flex items-center gap-1 rounded-full border px-1 py-0.5 text-[11px]",
        "border-slate-200 bg-slate-50/90 text-slate-700 shadow-sm backdrop-blur-sm",
        "dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200",
        className,
      ].join(" ")}
    >
      <Btn code="en" label="english" />
      <Btn code="th" label="thai" />
    </div>
  );
}
