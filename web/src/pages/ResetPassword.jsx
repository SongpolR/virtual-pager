// web/src/pages/ResetPassword.jsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";
import ChecklistItem from "../components/ChecklistItem.jsx";
import {
  mapFieldValidationErrors,
  getGlobalErrorFromAxios,
} from "../lib/errorHelpers";
import { useToast } from "../components/ToastProvider";
import AuthLayout from "../components/layout/AuthLayout.jsx";

const pwOk = (pw) => ({
  length: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  number: /[0-9]/.test(pw),
  allowed: /[!@#$%^&*._-]/.test(pw),
});

export default function ResetPassword() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const params = new URLSearchParams(location.search);
  const tokenParam = params.get("token") || "";
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const checks = useMemo(() => pwOk(password), [password]);
  const allPwOk =
    password &&
    checks.length &&
    checks.upper &&
    checks.number &&
    checks.allowed;

  const match = password && confirmPassword && password === confirmPassword;

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const clearAllErrors = () => {
    setFieldErrors((prev) => (Object.keys(prev).length ? {} : prev));
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    clearFieldError("password");
    clearAllErrors();
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    clearFieldError("confirm_password");
    clearAllErrors();
  };

  const submit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (!allPwOk || !match || !tokenParam || !email) return;

    setSubmitting(true);

    try {
      const res = await api.post("/auth/reset-password", {
        email,
        token: tokenParam,
        password,
        confirm_password: confirmPassword,
      });

      const data = res.data;

      if (data?.success) {
        const apiToken = data.data?.token ?? data.token;
        if (apiToken) {
          localStorage.setItem("token", apiToken);
          localStorage.setItem("tokenType", "owner");
          navigate("/", { replace: true });
          return;
        }

        showToast({ type: "success", message: t("reset_password_success") });
        navigate(`/login?mode=owner&email=${email}`, { replace: true });
        return;
      }

      showToast({ type: "error", message: t("errors.9000") });
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 422 && data?.errors && typeof data.errors === "object") {
        const fe = mapFieldValidationErrors(data.errors, t);
        setFieldErrors(fe);
        return;
      }

      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError) =>
    [
      "w-full rounded-lg border px-2.5 py-2 text-sm",
      "bg-white text-slate-900 placeholder:text-slate-400",
      "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
      "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500",
      "dark:border-slate-700 dark:focus:ring-offset-slate-900",
      hasError ? "border-red-500 dark:border-red-500/70" : "border-slate-300",
    ].join(" ");

  return (
    <AuthLayout
      title={t("reset_password_title")}
      subtitle={t("reset_password_subtitle")}
    >
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

        {/* Missing token/email hint */}
        {(!tokenParam || !email) && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200">
            {t("reset_password_invalid_link") ||
              "This reset link is invalid or missing required parameters. Please request a new reset link."}
            <div className="mt-2">
              <Link
                to="/forgot-password"
                className="font-medium underline underline-offset-2"
              >
                {t("reset_request_title") || "Request reset link"}
              </Link>
            </div>
          </div>
        )}

        {/* Password */}
        <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {t("common:password")}
        </label>
        <input
          type="password"
          className={inputClass(!!fieldErrors.password)}
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          required
          autoComplete="new-password"
        />
        {fieldErrors.password && (
          <div className="mt-1 text-xs text-red-600 dark:text-red-300">
            {fieldErrors.password}
          </div>
        )}

        {/* Confirm */}
        <label className="mb-1 mt-4 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {t("common:confirm_password")}
        </label>
        <input
          type="password"
          className={inputClass(!!fieldErrors.confirm_password)}
          value={confirmPassword}
          onChange={(e) => handleConfirmPasswordChange(e.target.value)}
          required
          autoComplete="new-password"
        />
        {fieldErrors.confirm_password && (
          <div className="mt-1 text-xs text-red-600 dark:text-red-300">
            {fieldErrors.confirm_password}
          </div>
        )}

        {/* Password requirements */}
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {t("password_requirements_title")}
          </div>
          <ul className="mt-1 list-disc pl-5 text-xs text-slate-600 dark:text-slate-300">
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
          disabled={!allPwOk || !match || submitting || !tokenParam || !email}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/35 transition hover:-translate-y-[1px] hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("reset_password_cta")}
        </button>

        <div className="mt-4 flex items-center justify-center">
          <Link
            to="/login"
            className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {t("common:back_to_login")}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
