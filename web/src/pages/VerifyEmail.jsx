// web/src/pages/VerifyEmail.jsx
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import {
  mapFieldValidationErrors,
  getGlobalErrorFromAxios,
} from "../lib/errorHelpers";
import { Link } from "react-router-dom";
import { useToast } from "../components/ToastProvider";

export default function VerifyEmail() {
  const { t } = useTranslation("auth");
  const params = new URLSearchParams(location.search);
  const initialEmail = params.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [fieldErrors, setFieldErrors] = useState({});
  const canSubmit = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const { showToast } = useToast();

  const updateEmail = (value) => {
    setEmail(value);

    // Clear field error
    setFieldErrors((prev) => {
      if (!prev.email) return prev;
      const next = { ...prev };
      delete next.email;
      return next;
    });
  };

  const resend = async () => {
    setFieldErrors({});

    try {
      const res = await api.post("/auth/resend-verification", {
        email: email.trim(),
      });

      const data = res.data;

      if (data?.success) {
        showToast({ type: "success", message: t("link_sent") });
        return;
      }
    } catch (err) {
      if (!err.response) {
        showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
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
        return;
      }

      // Non-validation error with message as code
      if (data?.message) {
        showToast({ type: "error", message: data?.message });
        return;
      }

      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-[420px] bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-semibold">{t("verify_email_title")}</h1>
        <p className="text-sm text-gray-600 mt-2">{t("verify_email_desc")}</p>

        <label className="block mt-4 text-sm">
          {t("common:email_address")}
        </label>
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
            {t("common:back_to_login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
