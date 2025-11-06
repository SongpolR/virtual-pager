// Login.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function Login() {
  const { t } = useTranslation();
  const [errBlock, setErrBlock] = React.useState(null); // { code, email }

  const submit = async (e) => {
    e.preventDefault();
    setErrBlock(null);

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    const r = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!r.ok) {
      const data = await r
        .json()
        .catch(() => ({ message: "", errors: [1999] }));
      const code = Array.isArray(data.errors) ? data.errors[0] : 1999;
      setErrBlock({ code, email });
      return;
    }

    const { token } = await r.json();
    localStorage.setItem("token", token);
    location.href = "/";
  };

  return (
    <div className="min-h-screen relative">
      <LanguageSwitcher className="fixed top-4 right-4" />
      <div className="min-h-screen flex items-center justify-center">
        <form onSubmit={submit} className="bg-white p-6 rounded-xl shadow w-80">
          <h1 className="text-xl font-semibold">{t("login")}</h1>

          {/* Inline error panel */}
          {errBlock && <LoginErrorPanel {...errBlock} t={t} />}

          <input
            name="email"
            type="email"
            className="mt-4 w-full border p-2 rounded"
            placeholder={t("email")}
            required
          />
          <input
            name="password"
            type="password"
            className="mt-2 w-full border p-2 rounded"
            placeholder={t("password")}
            required
          />
          <button className="mt-3 w-full bg-black text-white rounded py-2">
            {t("login")}
          </button>

          <div className="mt-4 text-center text-sm">
            {t("create_account")}?{" "}
            <a className="text-blue-600 underline" href={`/signup`}>
              {t("signup")}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoginErrorPanel({ code, email, t }) {
  const wrap = (node) => (
    <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
      {node}
    </div>
  );

  if (code === 1200) {
    // email not verified
    return wrap(
      <>
        {t("login_error_unverified")}{" "}
        <a
          className="underline"
          href={`/verify-email?email=${encodeURIComponent(email)}`}
        >
          {t("verify_now")}
        </a>
      </>
    );
  }
  if (code === 1003) {
    // incorrect password
    return wrap(
      <>
        {t("login_error_bad_password")}{" "}
        <a
          className="underline"
          href={`/reset-password?email=${encodeURIComponent(email)}`}
        >
          {t("reset_password")}
        </a>
      </>
    );
  }
  if (code === 1007) {
    // account not found
    return wrap(
      <>
        {t("login_error_no_account")}{" "}
        <a
          className="underline"
          href={`/signup?email=${encodeURIComponent(email)}`}
        >
          {t("create_account")}
        </a>
      </>
    );
  }
  // fallback
  return wrap(t("errors.1999"));
}
