// web/src/pages/VerifyEmail.jsx
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import {
  mapFieldValidationErrors,
  getGlobalErrorFromAxios,
} from "../lib/errorHelpers";
import { Link } from "react-router-dom";

export default function VerifyEmail() {
  const { t } = useTranslation();
  const params = new URLSearchParams(location.search);
  const initialEmail = params.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState(null); // "sent" | null
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitErr, setSubmitErr] = useState("");

  const canSubmit = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);

  const updateEmail = (value) => {
    setEmail(value);

    // Clear field error
    setFieldErrors((prev) => {
      if (!prev.email) return prev;
      const next = { ...prev };
      delete next.email;
      return next;
    });

    // Clear global + status
    if (submitErr) setSubmitErr("");
    if (status) setStatus(null);
  };

  const resend = async () => {
    setStatus(null);
    setSubmitErr("");
    setFieldErrors({});

    try {
      const res = await api.post("/auth/resend-verification", {
        email: email.trim(),
      });

      const data = res.data;

      if (data?.success) {
        // Optionally you can use data.message as code, e.g. VERIFY_EMAIL_SENT
        setStatus("sent");
        return;
      }

      // 2xx but success=false
      if (data?.message) {
        const key = `errors.${data.message}`;
        const translated = t(key) !== key ? t(key) : data.message;
        setSubmitErr(translated);
      } else {
        setSubmitErr(t("errors.9000") || "Unexpected error");
      }
    } catch (err) {
      if (!err.response) {
        setSubmitErr(getGlobalErrorFromAxios(err, t));
        return;
      }

      const { status: httpStatus, data } = err.response;

      // Validation error: 422 with field errors
      if (
        httpStatus === 422 &&
        data?.errors &&
        typeof data.errors === "object"
      ) {
        const fe = mapFieldValidationErrors(data.errors, t);
        setFieldErrors(fe);

        const globalMsg = getGlobalErrorFromAxios(err, t, {
          defaultValidationCode: 1000,
        });
        setSubmitErr(globalMsg);
        return;
      }

      // Non-validation error with message as code
      if (data?.message) {
        const msg = getGlobalErrorFromAxios(err, t);
        setSubmitErr(msg);
        return;
      }

      setSubmitErr(getGlobalErrorFromAxios(err, t));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-[420px] bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-semibold">{t("verify_email_title")}</h1>
        <p className="text-sm text-gray-600 mt-2">{t("verify_email_desc")}</p>

        {/* Global error */}
        {submitErr && (
          <div className="mt-3 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {submitErr}
          </div>
        )}

        {/* Success state */}
        {status === "sent" && (
          <div className="mt-3 rounded border border-green-300 bg-green-50 p-2 text-sm text-green-700">
            {t("link_sent")}
          </div>
        )}

        <label className="block mt-4 text-sm">{t("email_address")}</label>
        <input
          type="email"
          className={`border p-2 rounded w-full ${
            fieldErrors.email ? "border-red-500" : ""
          }`}
          value={email}
          onChange={(e) => updateEmail(e.target.value)}
          placeholder="you@example.com"
        />
        {fieldErrors.email && (
          <div className="mt-1 text-xs text-red-600">{fieldErrors.email}</div>
        )}

        <button
          onClick={resend}
          disabled={!canSubmit}
          className="mt-3 w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {t("resend_link")}
        </button>

        <div className="mt-6 flex items-center justify-between text-sm">
          <a className="underline" href="mailto:">
            {t("open_email_app")}
          </a>
          <Link className="underline" to="/login">
            {t("back_to_login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
