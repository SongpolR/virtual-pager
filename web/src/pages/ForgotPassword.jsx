// web/src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../lib/api.js";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import {
  mapFieldValidationErrors,
  getGlobalErrorFromAxios,
} from "../lib/errorHelpers.js";
import { useToast } from "../components/ToastProvider";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const { t } = useTranslation("auth");
  const params = new URLSearchParams(location.search);
  const initialEmail = params.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const clearErrors = () => {
    if (Object.keys(fieldErrors).length > 0) setFieldErrors({});
  };

  const submit = async (e) => {
    e.preventDefault();
    clearErrors();

    if (!email) return;

    setSubmitting(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      const data = res.data;

      // Common security pattern: respond with generic success message
      if (data?.success) {
        // You can ignore data.message and always show generic hint
        showToast({ type: "success", message: t("reset_request_success") });
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
      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={submit}>
          <h1 className="text-xl font-semibold">{t("reset_request_title")}</h1>

          <p className="mt-2 text-sm text-gray-600">
            {t("reset_request_intro")}
          </p>

          <label className="block mt-4 text-sm">{t("common:email")}</label>
          <input
            type="email"
            className={`border p-2 rounded w-full ${
              fieldErrors.email ? "border-red-500" : ""
            }`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearErrors();
            }}
            required
          />
          {fieldErrors.email && (
            <div className="mt-1 text-xs text-red-600">{fieldErrors.email}</div>
          )}

          <button
            disabled={!email || submitting}
            className="mt-4 w-full bg-black text-white rounded py-2 disabled:opacity-50"
          >
            {t("reset_request_submit")}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-end text-sm">
          <Link className="underline" to="/login">
            {t("common:back_to_login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
