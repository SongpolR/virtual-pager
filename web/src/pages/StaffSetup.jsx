import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ChecklistItem from "../components/ChecklistItem.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const pwOk = (pw) => ({
  length: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  number: /[0-9]/.test(pw),
  allowed: /^[A-Za-z0-9!@#$%^&*._-]+$/.test(pw),
});

export default function StaffSetup() {
  const { t } = useTranslation();
  const params = new URLSearchParams(location.search);
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(null); // 'ok' | 'invalid' | 'expired' | 'used' | 'error'

  const checks = useMemo(() => pwOk(password), [password]);
  const allPwOk =
    password &&
    checks.length &&
    checks.upper &&
    checks.number &&
    checks.allowed;
  const match = password && confirm && password === confirm;

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);
    const r = await fetch(`${API}/staff/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({ errors: [1999] }));
      const code = (data.errors || [])[0];
      if (code === 1400) setStatus("invalid");
      else if (code === 1401) setStatus("expired");
      else if (code === 1402) setStatus("used");
      else setStatus("error");
      return;
    }
    setStatus("ok");
    const data = await r.json();
    localStorage.setItem("token", data.token);
    localStorage.setItem("tokenType", "staff");
    location.href = "/staff";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <LanguageSwitcher className="fixed top-4 right-4" />
      <form
        onSubmit={submit}
        className="w-[420px] bg-white rounded-xl shadow p-6"
      >
        <h1 className="text-xl font-semibold">{t("staff_setup_title")}</h1>
        <p className="text-sm text-gray-600 mt-1">{t("staff_setup_desc")}</p>
        <div className="mt-3 text-sm text-gray-600">
          Email: <span className="font-mono">{email}</span>
        </div>

        {status && status !== "ok" && (
          <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {status === "invalid" && t("invite_invalid")}
            {status === "expired" && t("invite_expired")}
            {status === "used" && t("invite_used")}
            {status === "error" && t("errors.1999")}
          </div>
        )}

        <label className="block mt-4 text-sm">{t("password")}</label>
        <input
          type="password"
          className="border p-2 rounded w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label className="block mt-4 text-sm">{t("confirm_password")}</label>
        <input
          type="password"
          className="border p-2 rounded w-full"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <div className="mt-2">
          <div className="text-xs text-gray-500 font-medium">
            {t("password_requirements_title")}
          </div>
          <ul className="mt-1 text-xs list-disc pl-5">
            <ChecklistItem ok={checks.length} label={t("pw_req_length")} />
            <ChecklistItem ok={checks.upper} label={t("pw_req_upper")} />
            <ChecklistItem ok={checks.number} label={t("pw_req_number")} />
            <ChecklistItem ok={checks.allowed} label={t("pw_req_chars")} />
            <ChecklistItem ok={match} label={t("pw_req_match")} />
          </ul>
        </div>

        <button
          disabled={!allPwOk || !match}
          className="mt-4 w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {t("set_password")}
        </button>

        {status === "ok" && (
          <a className="mt-3 inline-block underline text-sm" href="/login">
            {t("continue_login")}
          </a>
        )}
      </form>
    </div>
  );
}
