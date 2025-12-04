// web/src/pages/ResetPassword.jsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import ChecklistItem from "../components/ChecklistItem.jsx";
import {
  mapFieldValidationErrors,
  getGlobalErrorFromAxios,
} from "../lib/errorHelpers";
import { useToast } from "../components/ToastProvider";

const pwOk = (pw) => ({
  length: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  number: /[0-9]/.test(pw),
  allowed: /^[A-Za-z0-9!@#$%^&*._-]+$/.test(pw),
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

  const handlePasswordChange = (value) => {
    setPassword(value);
    setFieldErrors((prev) => {
      if (!prev.password) return prev;
      const next = { ...prev };
      delete next.password;
      return next;
    });
    clearErrors();
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    // confirm password mismatch is local only
    clearErrors();
  };

  const handleMessageCode = (code) => {
    // Generic: try errors.<CODE> in i18n; else fallback to generic error
    const key = `errors.${code}`;
    const translated = t(key) !== key ? t(key) : t("errors.9000");
  };

  const submit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    // Frontend guard (button already disabled, but just in case)
    if (!allPwOk || !match) return;

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
        // If backend returns token, log owner in immediately
        const apiToken = data.data?.token ?? data.token;
        if (apiToken) {
          localStorage.setItem("token", apiToken);
          localStorage.setItem("tokenType", "owner");

          navigate("/", { replace: true });
          return;
        }
        showToast({
          type: "success",
          message: t("reset_password_success"),
        });
        // Otherwise, just send them to login
        navigate("/login", { replace: true });
        return;
      }
    } catch (err) {
      const { status, data } = err.response;

      if (status === 422 && data?.errors && typeof data.errors === "object") {
        const fe = mapFieldValidationErrors(data.errors, t);
        setFieldErrors(fe);
        setSubmitting(false);
        return;
      }

      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <LanguageSwitcher className="fixed top-4 right-4" />
      <form
        onSubmit={submit}
        className="w-[420px] bg-white rounded-xl shadow p-6"
      >
        <h1 className="text-xl font-semibold">{t("reset_password_title")}</h1>

        {email && (
          <div className="mt-3 text-sm text-gray-600">
            {t("common:email")}: <span className="font-mono">{email}</span>
          </div>
        )}

        <label className="block mt-4 text-sm">{t("common:password")}</label>
        <input
          type="password"
          className={`border p-2 rounded w-full ${
            fieldErrors.password ? "border-red-500" : ""
          }`}
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          required
        />
        {fieldErrors.password && (
          <div className="mt-1 text-xs text-red-600">
            {fieldErrors.password}
          </div>
        )}

        <label className="block mt-4 text-sm">
          {t("common:confirm_password")}
        </label>
        <input
          type="password"
          className={`border p-2 rounded w-full ${
            fieldErrors.confirm_password ? "border-red-500" : ""
          }`}
          value={confirmPassword}
          onChange={(e) => handleConfirmPasswordChange(e.target.value)}
          required
        />
        {fieldErrors.confirm_password && (
          <div className="mt-1 text-xs text-red-600">
            {fieldErrors.confirm_password}
          </div>
        )}

        <div className="mt-2">
          <div className="text-xs text-gray-500 font-medium">
            {t("password_requirements_title")}
          </div>
          <ul className="mt-1 text-xs list-disc pl-5">
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

        <button
          disabled={!allPwOk || !match || submitting}
          className="mt-4 w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {t("reset_password_cta")}
        </button>
      </form>
    </div>
  );
}
