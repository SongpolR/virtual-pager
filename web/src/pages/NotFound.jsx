// web/src/pages/NotFound.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation(["common", "auth"]);
  const location = useLocation();

  return (
    <AuthLayout
      title={t("common:not_found_title") || "Page not found"}
      subtitle={
        t("common:not_found_subtitle") ||
        "The page you’re looking for doesn’t exist or has been moved."
      }
      showToolbar
      showAppHeader
      withGlow
    >
      <div className="space-y-4">
        {/* 404 badge */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
          <span className="font-mono">404</span>
          <span className="truncate">
            {t("common:path") || "Path"}:{" "}
            <span className="font-mono">{location.pathname}</span>
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
          {t("common:not_found_hint") ||
            "If you followed a link, it might be outdated. Try going back to the home page or login."}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/35 transition hover:-translate-y-[1px] hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 active:translate-y-0 active:scale-[0.98]"
          >
            {t("common:go_home") || "Go to Home"}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
