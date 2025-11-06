import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function VerifyEmail() {
  const { t } = useTranslation();
  const params = new URLSearchParams(location.search);
  const initialEmail = params.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState(null); // "sent" | "error" | null
  const canSubmit = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);

  const resend = async () => {
    setStatus(null);
    const r = await fetch(`${API}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    // Always OK by design (no user enumeration)
    if (r.ok) setStatus("sent");
    else setStatus("error");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-[420px] bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-semibold">{t("verify_email_title")}</h1>
        <p className="text-sm text-gray-600 mt-2">{t("verify_email_desc")}</p>

        <label className="block mt-4 text-sm">{t("email_address")}</label>
        <input
          type="email"
          className="border p-2 rounded w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <button
          onClick={resend}
          disabled={!canSubmit}
          className="mt-3 w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {t("resend_link")}
        </button>

        {status === "sent" && (
          <div className="mt-3 text-sm text-green-700">{t("link_sent")}</div>
        )}
        {status === "error" && (
          <div className="mt-3 text-sm text-red-600">{t("errors.1999")}</div>
        )}

        <div className="mt-6 flex items-center justify-between text-sm">
          <a className="underline" href="mailto:">
            {t("open_email_app")}
          </a>
          <a className="underline" href="/login">
            {t("back_to_login")}
          </a>
        </div>
      </div>
    </div>
  );
}
