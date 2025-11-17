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

export default function StaffReset() {
  const { t } = useTranslation();
  const p = new URLSearchParams(location.search);
  const [email, setEmail] = useState(p.get("email") || "");
  const [token, setToken] = useState(p.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(null); // 'ok' | 'invalid' | 'expired' | 'error'

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
    const r = await fetch(`${API}/staff/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, new_password: password }),
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({ errors: [1999] }));
      const code = (data.errors || [])[0];
      if (code === 1202) setStatus("invalid");
      else if (code === 1203) setStatus("expired");
      else setStatus("error");
      return;
    }
    setStatus("ok");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <LanguageSwitcher className="fixed top-4 right-4" />
      <form
        onSubmit={submit}
        className="w-[420px] bg-white rounded-xl shadow p-6"
      >
        <h1 className="text-xl font-semibold">{t("reset_password")}</h1>

        {status && status !== "ok" && (
          <div className="mt-3 text-sm rounded border border-red-300 bg-red-50 p-3 text-red-800">
            {status === "invalid" && t("errors.1202")}
            {status === "expired" && t("errors.1203")}
            {status === "error" && t("errors.1999")}
          </div>
        )}
        {status === "ok" && (
          <div className="mt-3 text-sm rounded border border-green-300 bg-green-50 p-3 text-green-800">
            {t("reset_password_success")}
          </div>
        )}

        <label className="block mt-3 text-sm">{t("email")}</label>
        <input
          className="border p-2 rounded w-full"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled
        />

        <label className="block mt-3 text-sm">Token</label>
        <input
          className="border p-2 rounded w-full"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          disabled
        />

        <label className="block mt-3 text-sm">{t("password")}</label>
        <input
          className="border p-2 rounded w-full"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label className="block mt-3 text-sm">{t("confirm_password")}</label>
        <input
          className="border p-2 rounded w-full"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
          disabled={!allPwOk || !match}
          className="mt-4 w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {t("reset_password")}
        </button>

        {status === "ok" && (
          <a
            className="mt-3 inline-block underline text-sm"
            href="/login?mode=staff&email=${encodeURIComponent(email)}"
          >
            {t("continue_login")}
          </a>
        )}
      </form>
    </div>
  );
}
