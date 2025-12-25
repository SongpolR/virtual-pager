// web/src/pages/AccountSettings.jsx
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/ToastProvider";
import api from "../lib/api";

export default function AccountSettings() {
  const { t } = useTranslation(["account", "common"]);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const role = localStorage.getItem("tokenType") || "staff"; // fallback

  const logout = useCallback(async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      // read freshest role (avoid stale closure)
      const currentRole = localStorage.getItem("tokenType") || "staff";

      if (currentRole === "owner") {
        await api.post("/auth/logout");
      } else {
        await api.post("/staff/logout");
      }
    } catch {
      // ignore (best-effort logout)
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("tokenType");
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  }, [navigate, loggingOut]);

  const handleStaffClick = (e) => {
    e.preventDefault(); // block navigation
    showToast({
      type: "info",
      message:
        t("account:contact_owner_to_change_password") ||
        "Please contact the shop owner to change your password.",
    });
  };

  return (
    <div className="mt-4 space-y-4 text-slate-900 dark:text-slate-100">
      {/* Logout Confirmation Modal */}
      <ConfirmModal
        open={showLogoutConfirm}
        variant="error"
        title={t("common:logout_confirm_title") || "Log out?"}
        message={
          t("common:logout_confirm_message") ||
          "You will be signed out from this device."
        }
        cancelLabel={t("common:cancel") || "Cancel"}
        confirmLabel={
          loggingOut
            ? t("common:logging_out") || "Logging out..."
            : t("common:logout") || "Logout"
        }
        onCancel={() => {
          if (loggingOut) return;
          setShowLogoutConfirm(false);
        }}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
      />

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">
          {t("account:account_settings_title") || "Account Settings"}
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t("account:account_settings_subtitle") ||
            "Manage your session and basic account information."}
        </p>
      </div>

      {/* Card */}
      <div className="app-card-surface rounded-2xl border shadow-sm shadow-slate-900/5 dark:shadow-slate-900/40">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm dark:border-slate-800">
          <div className="font-semibold text-slate-800 dark:text-slate-100">
            {t("account:profile_section_title") || "Profile"}
          </div>

          {/* Role pill */}
          <span
            className={[
              "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
              role === "owner"
                ? "bg-indigo-500/10 text-indigo-700 ring-1 ring-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-200 dark:ring-indigo-400/20"
                : "bg-slate-500/10 text-slate-700 ring-1 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-200 dark:ring-slate-400/20",
            ].join(" ")}
          >
            {role === "owner"
              ? t("account:role_owner") || "Owner"
              : t("account:role_staff") || "Staff"}
          </span>
        </div>

        <div className="px-4 pb-4 pt-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3 text-slate-700 ring-1 ring-slate-100 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-slate-800">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {t("account:account_role") || "Role"}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-50">
              {role === "owner"
                ? t("account:role_owner") || "Owner"
                : t("account:role_staff") || "Staff"}
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t("account:account_settings_intro") ||
                "More options (like password change) will be available soon."}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {role === "owner" ? (
              <Link
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800"
                to="/settings/account/change-password"
              >
                {t("account:change_password") || "Change password"}
              </Link>
            ) : (
              <Link
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800"
                to="#"
                onClick={handleStaffClick}
                aria-disabled="true"
              >
                {t("account:change_password") || "Change password"}
              </Link>
            )}

            <button
              type="button"
              disabled={loggingOut}
              className={[
                "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md transition",
                "bg-red-500 hover:-translate-y-[1px] hover:bg-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 active:translate-y-0 active:scale-[0.99]",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
              ].join(" ")}
              onClick={() => setShowLogoutConfirm(true)}
            >
              {loggingOut
                ? t("common:logging_out") || "Logging out..."
                : t("common:logout") || "Logout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
