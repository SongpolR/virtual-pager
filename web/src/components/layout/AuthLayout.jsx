// web/src/components/layout/AuthLayout.jsx
import React from "react";
import AppShell from "./AppShell.jsx";
import ThemeSwitcher from "../ThemeSwitcher.jsx";
import LanguageSwitcher from "../LanguageSwitcher.jsx";
import { useTranslation } from "react-i18next";

/**
 * AuthLayout:
 * - Uses AppShell with glow + toolbar (Theme + Language)
 * - Shows brand row "ViPa · Virtual Pager"
 * - Renders a card with header (title + subtitle + optional right-side slot)
 * - Children are the form content (fields, errors, buttons, footer)
 */
export default function AuthLayout({
  title,
  subtitle,
  headerRight = null, // e.g. mode toggle buttons
  children,
}) {
  const { t } = useTranslation("");
  return (
    <AppShell
      withGlow
      toolbar={
        <>
          <LanguageSwitcher />
          <ThemeSwitcher />
        </>
      }
    >
      <div className="w-full max-w-md">
        {/* Brand row */}
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700/70">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          </div>
          <span>{t("app_name")}</span> · <span>{t("full_app_name")}</span>
        </div>

        {/* Card */}
        <section
          className={[
            "app-card-surface relative overflow-hidden rounded-2xl border shadow-xl backdrop-blur-sm",
            "dark:shadow-2xl",
            "p-6 sm:p-7",
          ].join(" ")}
        >
          {/* Inner glow only in dark mode */}
          <div className="pointer-events-none absolute inset-x-0 -top-24 hidden h-40 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.28),_transparent_60%)] dark:block" />

          <div className="relative">
            {/* Header row */}
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-lg font-semibold sm:text-xl">{title}</h1>
                {subtitle && (
                  <p className="app-text-muted text-xs">{subtitle}</p>
                )}
              </div>
              {headerRight && <div>{headerRight}</div>}
            </div>

            {/* Auth content (form, errors, etc.) */}
            {children}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
