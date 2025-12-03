// web/src/pages/StaffSetup.jsx
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

export default function StaffSetup() {
  const { t } = useTranslation();
  const params = new URLSearchParams(location.search);
  const tokenParam = params.get("token") || "";
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [inviteStatus, setInviteStatus] = useState(null); // 'invalid' | 'expired' | 'used' | null
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

  const clearErrors = () => {
    if (submitErr) setSubmitErr("");
    if (inviteStatus) setInviteStatus(null);
  };

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

  const handleConfirmChange = (value) => {
    setConfirm(value);
    // confirm mismatch is local; backend doesn’t validate this field
    clearErrors();
  };

  const handleMessageCode = (code) => {
    // Handle specific invite error codes as special states
    if (code === "INVITE_INVALID") {
      setInviteStatus("invalid");
      return;
    }
    if (code === "INVITE_EXPIRED") {
      setInviteStatus("expired");
      return;
    }
    if (code === "INVITE_USED") {
      setInviteStatus("used");
      return;
    }

    // Fallback: try errors.<CODE> in i18n; else generic
    const key = `errors.${code}`;
    const translated = t(key) !== key ? t(key) : t("errors.9000");
    setSubmitErr(translated);
  };

  const submit = async (e) => {
    e.preventDefault();
    setInviteStatus(null);
    setFieldErrors({});
    setSubmitErr("");

    // Frontend guard (button is already disabled, but just in case)
    if (!allPwOk || !match) return;

    setSubmitting(true);

    try {
      const res = await api.post("/staff/accept", {
        email,
        token: tokenParam,
        password,
      });

      const data = res.data;

      if (data?.success) {
        const apiToken = data.data?.token ?? data.token;
        if (apiToken) {
          localStorage.setItem("token", apiToken);
          localStorage.setItem("tokenType", "staff");
        }
        // Staff main area → same Orders page as owner
        navigate("/", { replace: true });
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

      // Validation errors (e.g. password rules)
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

      // Business errors: invite invalid/expired/used, etc.
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
        <h1 className="text-xl font-semibold">{t("staff_setup_title")}</h1>
        <div className="mt-3 text-sm text-gray-600">
          {t("email")}: <span className="font-mono">{email}</span>
        </div>

        {/* Invite status panel (invalid/expired/used) */}
        {inviteStatus && (
          <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {inviteStatus === "invalid" && t("invite_invalid")}
            {inviteStatus === "expired" && t("invite_expired")}
            {inviteStatus === "used" && t("invite_used")}
          </div>
        )}

        {/* Generic submit error */}
        {submitErr && (
          <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {submitErr}
          </div>
        )}

        <label className="block mt-4 text-sm">{t("password")}</label>
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

        <label className="block mt-4 text-sm">{t("confirm_password")}</label>
        <input
          type="password"
          className="border p-2 rounded w-full"
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
          {t("staff_set_password")}
        </button>
      </form>
    </div>
  );
}
