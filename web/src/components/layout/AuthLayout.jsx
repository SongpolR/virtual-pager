// web/src/components/layout/AuthLayout.jsx
import React from "react";
import AppShell from "./AppShell.jsx";
import ThemeSwitcher from "../ThemeSwitcher.jsx";
import LanguageSwitcher from "../LanguageSwitcher.jsx";
import { useTranslation } from "react-i18next";

/**
 * AuthLayout
 * - Uses AppShell with optional glow + optional toolbar (Theme + Language)
 * - Optional card header (title + subtitle + optional right-side slot)
 * - Children are the form content (fields, errors, buttons, footer)
 */
export default function AuthLayout({
  title,
  subtitle,
  headerRight = null, // e.g. mode toggle buttons
  children,

  // ✅ new controls
  showToolbar = true,
  showAppHeader = true, // brand row (icon + app name)
  showCardHeader = true, // title/subtitle row inside the card
  withGlow = true,

  // optional overrides
  toolbar = null, // if provided, will be used instead of default (Language + Theme)
  className = "",
  contentClassName = "",
}) {
  const { t } = useTranslation("");

  const defaultToolbar = (
    <>
      <LanguageSwitcher />
      <ThemeSwitcher />
    </>
  );

  return (
    <AppShell
      withGlow={withGlow}
      toolbar={showToolbar ? (toolbar ?? defaultToolbar) : null}
      className={className}
      contentClassName={contentClassName}
    >
      <div className="w-full max-w-md">
        {/* App header (brand row) */}
        {showAppHeader && (
          <div className="mb-3 flex items-center gap-3">
            <div className="relative h-8 w-8 shrink-0">
              <span
                aria-hidden="true"
                className="animate-pulse-ring absolute inset-0 rounded-full border border-indigo-400/60 dark:border-indigo-300/50"
              />
              <img
                src="/app-icon.svg"
                alt="App Icon"
                width={32}
                height={32}
                className="relative h-8 w-8 rounded-full bg-indigo-600 dark:bg-indigo-500 dark:ring-slate-700"
              />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-medium sm:text-lg text-slate-500 dark:text-slate-400">
                <span>{t("app_name")}</span>
              </h1>
              <p className="truncate text-xs font-medium text-slate-400">
                <span>{t("full_app_name")}</span>
              </p>
            </div>
          </div>
        )}

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
            {/* Card header (title/subtitle + right slot) */}
            {showCardHeader && (title || subtitle || headerRight) && (
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  {title && (
                    <h1 className="text-lg font-semibold sm:text-xl">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="app-text-muted text-xs">{subtitle}</p>
                  )}
                </div>
                {headerRight && <div>{headerRight}</div>}
              </div>
            )}

            {/* Auth content (form, errors, etc.) */}
            {children}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
