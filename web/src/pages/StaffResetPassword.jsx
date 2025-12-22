// web/src/pages/StaffResetPassword.jsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ChecklistItem from "../components/ChecklistItem.jsx";
import api from "../lib/api";
import {
  mapFieldValidationErrors,
  getGlobalErrorFromAxios,
} from "../lib/errorHelpers";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import AuthLayout from "../components/layout/AuthLayout.jsx";

const pwOk = (pw) => ({
  length: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  number: /[0-9]/.test(pw),
  // keep consistent with your reset/setup validations
  allowed: /[!@#$%^&*._-]/.test(pw),
});

export default function StaffResetPassword() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const params = new URLSearchParams(location.search);
  const email = params.get("email") || "";
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // lock submit when reset link not usable
  const [resetBlock, setResetBlock] = useState(null); // 'invalid' | 'expired' | null

  const checks = useMemo(() => pwOk(password), [password]);
  const allPwOk =
    password &&
    checks.length &&
    checks.upper &&
    checks.number &&
    checks.allowed;

  const match = password && confirm && password === confirm;

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    clearFieldError("new_password");
    clearFieldError("password");
    if (resetBlock) setResetBlock(null);
  };

  const handleConfirmChange = (value) => {
    setConfirm(value);
    if (resetBlock) setResetBlock(null);
  };

  const toastResetBlock = (code) => {
    if (code === "RESET_INVALID") {
      setResetBlock("invalid");
      showToast({
        type: "error",
        message:
          t("staff_reset_invalid") ||
          "This reset link is not valid. Please request a new reset email.",
      });
      return;
    }
    if (code === "RESET_EXPIRED") {
      setResetBlock("expired");
      showToast({
        type: "warning",
        message:
          t("staff_reset_expired") ||
          "This reset link has expired. Please request a new reset email.",
      });
      return;
    }

    const key = `errors.${code}`;
    const msg = t(key) !== key ? t(key) : t("errors.9000");
    showToast({ type: "error", message: msg });
  };

  const submit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setResetBlock(null);

    // Guard missing params
    if (!email || !token) {
      setResetBlock("invalid");
      showToast({
        type: "error",
        message:
          t("staff_reset_invalid") ||
          "This reset link is not valid. Please request a new reset email.",
      });
      return;
    }

    // Guard password mismatch/rules
    if (!allPwOk || !match) return;

    setSubmitting(true);

    try {
      const res = await api.post("/staff/reset", {
        email,
        token,
        new_password: password,
      });

      const data = res.data;

      if (data?.success) {
        showToast({
          type: "success",
          message:
            t("staff_reset_password_success") ||
            "Password updated successfully.",
        });

        // go to staff login prefilled
        navigate(`/login?mode=staff&email=${encodeURIComponent(email)}`, {
          replace: true,
        });
        return;
      }

      if (data?.message) {
        toastResetBlock(data.message);
        return;
      }

      showToast({ type: "error", message: t("errors.9000") });
    } catch (err) {
      if (!err.response) {
        showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
        return;
      }

      const { status, data } = err.response;

      // Validation
      if (status === 422 && data?.errors && typeof data.errors === "object") {
        const fe = mapFieldValidationErrors(data.errors, t);
        setFieldErrors(fe);

        const globalMsg = getGlobalErrorFromAxios(err, t, {
          defaultValidationCode: 1000,
        });
        showToast({ type: "error", message: globalMsg });
        return;
      }

      // Business codes
      if (data?.message) {
        toastResetBlock(data.message);
        return;
      }

      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    } finally {
      setSubmitting(false);
    }
  };

  const subtitle =
    t("staff_reset_subtitle") ||
    "Set a new password to regain access to your staff account";

  return (
    <AuthLayout title={t("reset_password")} subtitle={subtitle}>
      <form onSubmit={submit}>
        {/* Email pill */}
        {email && (
          <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            <span className="text-slate-500 dark:text-slate-400">
              {t("common:email") || "Email"}:
            </span>{" "}
            <span className="font-mono">{email}</span>
          </div>
        )}

        {/* Password */}
        <div className="mt-2">
          <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
            {t("common:password") || "Password"}
          </label>
          <input
            type="password"
            className={[
              "w-full rounded-lg border p-2.5 text-sm",
              "bg-white text-slate-900 placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
              "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500",
              "dark:focus:ring-offset-slate-900",
              fieldErrors.new_password || fieldErrors.password
                ? "border-red-500 focus:ring-red-500"
                : "border-slate-300 dark:border-slate-700",
            ].join(" ")}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
            autoComplete="new-password"
          />
          {(fieldErrors.new_password || fieldErrors.password) && (
            <div className="mt-1 text-xs text-red-500 dark:text-red-400">
              {fieldErrors.new_password || fieldErrors.password}
            </div>
          )}
        </div>

        {/* Confirm */}
        <div className="mt-4">
          <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
            {t("common:confirm_password") || "Confirm password"}
          </label>
          <input
            type="password"
            className={[
              "w-full rounded-lg border p-2.5 text-sm",
              "bg-white text-slate-900 placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
              "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500",
              "dark:focus:ring-offset-slate-900",
              "border-slate-300 dark:border-slate-700",
            ].join(" ")}
            value={confirm}
            onChange={(e) => handleConfirmChange(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        {/* Requirements */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {t("password_requirements_title") || "Password requirements"}
          </div>
          <ul className="mt-2 space-y-1 text-xs">
            <ChecklistItem
              ok={checks.length}
              label={t("password_rule_length")}
            />
            <ChecklistItem
              ok={checks.upper}
              label={t("password_rule_uppercase")}
            />
            <ChecklistItem
              ok={checks.number}
              label={t("password_rule_number")}
            />
            <ChecklistItem
              ok={checks.allowed}
              label={t("password_rule_symbol")}
            />
            <ChecklistItem ok={match} label={t("password_rule_match")} />
          </ul>
        </div>

        {/* CTA */}
        <button
          disabled={!allPwOk || !match || submitting || !!resetBlock}
          className={[
            "mt-6 flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium text-white",
            "bg-indigo-500 shadow-lg shadow-indigo-500/40 transition",
            "hover:-translate-y-[1px] hover:bg-indigo-400 active:translate-y-0 active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
            "disabled:cursor-not-allowed disabled:opacity-60",
          ].join(" ")}
        >
          {t("reset_password")}
        </button>

        {/* Footer hint + link */}
        <div className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
          {t("staff_reset_footer_hint") ||
            "If this link doesn’t work, request a new reset email from the login page."}

          {(resetBlock === "invalid" || resetBlock === "expired") && (
            <div className="mt-2">
              <Link
                className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
                to={`/login?mode=staff&email=${encodeURIComponent(email)}`}
              >
                {t("common:back_to_login") || "Back to login"}
              </Link>
            </div>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}
