// web/src/pages/ChangePassword.jsx
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

export default function ChangePassword() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState(""); // new password
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

  const handleOldPasswordChange = (value) => {
    setOldPassword(value);
    clearFieldError("old_password");
    clearAllErrors();
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

  const inputClass = (hasError) =>
    [
      "w-full rounded-lg border px-2.5 py-2 text-sm",
      "bg-white text-slate-900 placeholder:text-slate-400",
      "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
      "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500",
      "dark:border-slate-700 dark:focus:ring-offset-slate-900",
      hasError ? "border-red-500 dark:border-red-500/70" : "border-slate-300",
    ].join(" ");

  const submit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (!oldPassword || !allPwOk || !match) return;

    setSubmitting(true);

    try {
      // ✅ No token param needed here — user should already be authenticated
      // and your api client should attach Authorization header from localStorage.
      const res = await api.post("/auth/change-password", {
        old_password: oldPassword,
        password,
        confirm_password: confirmPassword,
      });

      const data = res.data;

      if (data?.success) {
        localStorage.setItem("token", data.data?.token);
        showToast({ type: "success", message: t("change_password_success") });
        navigate("/settings/account", { replace: true });
        return;
      }

      showToast({ type: "error", message: t("common:errors.9000") });
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 422 && data?.errors && typeof data.errors === "object") {
        const fe = mapFieldValidationErrors(data.errors, t);
        setFieldErrors(fe);
        return;
      }

      // Common case: wrong old password might be 401/403 or 400 depending on backend
      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || !oldPassword || !allPwOk || !match;

  return (
    <AuthLayout
      title={t("change_password_title")}
      subtitle={t("change_password_subtitle")}
      showToolbar={true}
      showAppHeader={true}
    >
      <form onSubmit={submit}>
        {/* Old password */}
        <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {t("old_password_label") || t("common:password") /* fallback */}
        </label>
        <input
          type="password"
          className={inputClass(!!fieldErrors.old_password)}
          value={oldPassword}
          onChange={(e) => handleOldPasswordChange(e.target.value)}
          required
          autoComplete="current-password"
        />
        {fieldErrors.old_password && (
          <div className="mt-1 text-xs text-red-600 dark:text-red-300">
            {fieldErrors.old_password}
          </div>
        )}

        {/* New password */}
        <label className="mb-1 mt-4 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {t("new_password_label") || t("common:password")}
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

        {/* Confirm new password */}
        <label className="mb-1 mt-4 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {t("confirm_new_password_label")}
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
          disabled={disabled}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/35 transition hover:-translate-y-[1px] hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("change_password_cta")}
        </button>

        <div className="mt-4 flex items-center justify-center">
          <Link
            to="/"
            className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {t("common:back") || t("common:back_to_home") || "Back"}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
