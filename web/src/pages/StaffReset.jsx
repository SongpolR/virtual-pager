// web/src/pages/StaffReset.jsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ChecklistItem from "../components/ChecklistItem.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import api from "../lib/api";
import {
  mapFieldValidationErrors,
  getGlobalErrorFromAxios,
} from "../lib/errorHelpers";
import { useNavigate } from "react-router-dom";

const pwOk = (pw) => ({
  length: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  number: /[0-9]/.test(pw),
  allowed: /^[A-Za-z0-9!@#$%^&*._-]+$/.test(pw),
});

export default function StaffReset() {
  const { t } = useTranslation();
  const p = new URLSearchParams(location.search);

  const [email] = useState(p.get("email") || "");
  const [token] = useState(p.get("token") || "");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [resetStatus, setResetStatus] = useState(null); // 'invalid' | 'expired' | null
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitErr, setSubmitErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const checks = useMemo(() => pwOk(password), [password]);
  const allPwOk =
    password &&
    checks.length &&
    checks.upper &&
    checks.number &&
    checks.allowed;
  const match = password && confirm && password === confirm;
  const navigate = useNavigate();

  const clearStatusAndErrors = () => {
    if (resetStatus) setResetStatus(null);
    if (submitErr) setSubmitErr("");
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setFieldErrors((prev) => {
      if (!prev.new_password && !prev.password) return prev;
      const next = { ...prev };
      delete next.new_password;
      delete next.password;
      return next;
    });
    clearStatusAndErrors();
  };

  const handleConfirmChange = (value) => {
    setConfirm(value);
    clearStatusAndErrors();
  };

  const handleMessageCode = (code) => {
    // Depends on how backend is implemented; assume message codes:
    // RESET_INVALID, RESET_EXPIRED
    if (code === "RESET_INVALID") {
      setResetStatus("invalid");
      return;
    }
    if (code === "RESET_EXPIRED") {
      setResetStatus("expired");
      return;
    }

    // Fallback: try errors.<CODE> or generic
    const key = `errors.${code}`;
    const translated = t(key) !== key ? t(key) : t("errors.9000");
    setSubmitErr(translated);
  };

  const submit = async (e) => {
    e.preventDefault();
    setResetStatus(null);
    setFieldErrors({});
    setSubmitErr("");

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
        // success → show green message; user can go back to login
        navigate("/", { replace: true });
        setSubmitting(false);
        return;
      }

      // 2xx but success=false
      if (data?.message) {
        handleMessageCode(data.message);
      } else {
        setSubmitErr(t("errors.9000") || "Unexpected error");
      }
    } catch (err) {
      if (!err.response) {
        setSubmitErr(getGlobalErrorFromAxios(err, t));
        setSubmitting(false);
        return;
      }

      const { status, data } = err.response;

      // Validation errors from backend
      if (status === 422 && data?.errors && typeof data.errors === "object") {
        const fe = mapFieldValidationErrors(data.errors, t);
        setFieldErrors(fe);

        const globalMsg = getGlobalErrorFromAxios(err, t, {
          defaultValidationCode: 1000,
        });
        setSubmitErr(globalMsg);
        setSubmitting(false);
        return;
      }

      // Business errors: invalid/expired token etc.
      if (data?.message) {
        handleMessageCode(data.message);
        setSubmitting(false);
        return;
      }

      setSubmitErr(getGlobalErrorFromAxios(err, t));
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
        <h1 className="text-xl font-semibold">{t("reset_password")}</h1>

        {/* Error status from business rules */}
        {resetStatus && resetStatus !== "ok" && (
          <div className="mt-3 text-sm rounded border border-red-300 bg-red-50 p-3 text-red-800">
            {resetStatus === "invalid" && t("staff_reset_invalid")}
            {resetStatus === "expired" && t("staff_reset_expired")}
          </div>
        )}

        {/* Generic submit error */}
        {submitErr && (
          <div className="mt-3 text-sm rounded border border-red-300 bg-red-50 p-3 text-red-800">
            {submitErr}
          </div>
        )}

        {/* Success message */}
        {resetStatus === "ok" && (
          <div className="mt-3 text-sm rounded border border-green-300 bg-green-50 p-3 text-green-800">
            {t("staff_reset_password_success")}
          </div>
        )}

        <label className="block mt-3 text-sm">{t("email")}</label>
        <input
          className="border p-2 rounded w-full bg-gray-100"
          type="email"
          value={email}
          disabled
        />

        <label className="block mt-3 text-sm">Token</label>
        <input
          className="border p-2 rounded w-full bg-gray-100"
          value={token}
          disabled
        />

        <label className="block mt-3 text-sm">{t("password")}</label>
        <input
          className={`border p-2 rounded w-full ${
            fieldErrors.new_password || fieldErrors.password
              ? "border-red-500"
              : ""
          }`}
          type="password"
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          required
        />
        {(fieldErrors.new_password || fieldErrors.password) && (
          <div className="mt-1 text-xs text-red-600">
            {fieldErrors.new_password || fieldErrors.password}
          </div>
        )}

        <label className="block mt-3 text-sm">{t("confirm_password")}</label>
        <input
          className="border p-2 rounded w-full"
          type="password"
          value={confirm}
          onChange={(e) => handleConfirmChange(e.target.value)}
          required
        />

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
          {t("reset_password")}
        </button>

        {resetStatus === "ok" && (
          <Link
            className="mt-3 inline-block underline text-sm"
            to={`/login?mode=staff&email=${encodeURIComponent(email)}`}
          >
            {t("continue_login")}
          </Link>
        )}
      </form>
    </div>
  );
}
