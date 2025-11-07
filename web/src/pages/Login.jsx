// web/src/pages/Login.jsx
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function Login() {
  const { t } = useTranslation();
  const [mode, setMode] = React.useState("owner"); // 'owner' | 'staff'
  const [errBlock, setErrBlock] = React.useState(null); // { code, email, mode }
  const emailRef = React.useRef(null);

  // Preselect mode & email via URL params
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const m = p.get("mode");
    const e = p.get("email");
    if (m === "staff" || m === "owner") setMode(m);
    if (e && emailRef.current) emailRef.current.value = e;
  }, []);

  useEffect(() => {
    const handler = (ev) => {
      if (ev.data?.type === "google-auth-result") {
        const { payload } = ev.data;
        if (payload?.token) {
          localStorage.setItem("token", payload.token);
          localStorage.setItem("tokenType", "owner");
          location.href = "/";
        } else if (payload?.errors) {
          alert(payload.errors.map((code) => t(`errors.${code}`)).join("\n"));
        } else {
          alert(t("errors.1999"));
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [t]);

  const loginGoogle = () => {
    // open popup to backend redirect endpoint
    window.open(
      `${API}/auth/google/redirect`,
      "google",
      "width=520,height=640"
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setErrBlock(null);

    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    const endpoint = mode === "owner" ? "/auth/login" : "/staff/login";

    const r = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!r.ok) {
      const data = await r.json().catch(() => ({ errors: [1999] }));
      const code = Array.isArray(data.errors) ? data.errors[0] : 1999;
      setErrBlock({ code, email, mode });
      return;
    }

    const { token } = await r.json();
    localStorage.setItem("token", token);
    localStorage.setItem("tokenType", mode); // 'owner' | 'staff'
    // Land on appropriate dashboard
    location.href = mode === "owner" ? "/" : "/staff";
  };

  return (
    <div className="min-h-screen relative bg-gray-50 flex items-center justify-center px-4">
      <LanguageSwitcher className="fixed top-4 right-4" />

      <form
        onSubmit={submit}
        className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8"
      >
        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("owner")}
            className={`flex-1 py-2 rounded-md border text-sm font-medium transition ${
              mode === "owner"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            {t("login_type_owner")}
          </button>
          <button
            type="button"
            onClick={() => setMode("staff")}
            className={`flex-1 py-2 rounded-md border text-sm font-medium transition ${
              mode === "staff"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            {t("login_type_staff")}
          </button>
        </div>

        <h1 className="text-2xl font-semibold mb-2">{t("login")}</h1>

        {/* Error panel */}
        {errBlock && <LoginErrorPanel {...errBlock} t={t} />}

        <label className="block text-sm mt-3">{t("email")}</label>
        <input
          name="email"
          type="email"
          required
          ref={emailRef}
          className="mt-1 border rounded-md w-full p-2 focus:ring-2 focus:ring-black focus:outline-none"
          placeholder="name@example.com"
        />

        <label className="block text-sm mt-4">{t("password")}</label>
        <input
          name="password"
          type="password"
          required
          className="mt-1 border rounded-md w-full p-2 focus:ring-2 focus:ring-black focus:outline-none"
          placeholder="••••••••"
        />

        <button
          type="submit"
          className="mt-6 w-full py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
        >
          {t("login")}
        </button>

        {/* Google sign-in (owner only) */}
        {mode === "owner" && (
          <button
            type="button"
            className="mt-3 w-full py-2 border border-gray-300 rounded-md flex items-center justify-center gap-2 text-sm hover:bg-gray-50 transition"
            onClick={loginGoogle}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            {t("sign_in_google")}
          </button>
        )}

        {/* Footer links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {mode === "owner" ? (
            <>
              {t("create_account")}?{" "}
              <a href="/signup" className="text-blue-600 underline">
                {t("signup")}
              </a>
            </>
          ) : (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setMode("owner");
              }}
              className="text-blue-600 underline"
            >
              {t("switch_to_owner_login")}
            </a>
          )}
        </div>
      </form>
    </div>
  );
}

/** Inline error box renderer */
function LoginErrorPanel({ code, email, mode, t }) {
  const wrap = (node) => (
    <div className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
      {node}
    </div>
  );

  // ==== OWNER MODE ====
  if (mode === "owner") {
    if (code === 1200) {
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
    return wrap(t("errors.1999"));
  }

  // ==== STAFF MODE (Hybrid): no self-resend; only self-reset for wrong password) ====
  if (mode === "staff") {
    if (code === 1007) {
      // no staff & no invite
      return wrap(
        <>
          {t("login_staff_not_found")} {t("login_staff_contact_owner")}
        </>
      );
    }
    if (code === 1403) {
      // invited but not activated
      return wrap(
        <>
          {t("login_staff_invite_pending") || t("login_staff_contact_owner")}{" "}
          {t("login_staff_contact_owner")}
        </>
      );
    }
    if (code === 1300) {
      // inactive
      return wrap(
        <>
          {t("login_staff_inactive")} {t("login_staff_contact_owner")}
        </>
      );
    }
    if (code === 1003) {
      // wrong password → self-serve reset
      return wrap(
        <>
          {t("login_staff_bad_password")}{" "}
          <a
            className="underline"
            href={`/staff-reset?email=${encodeURIComponent(email)}`}
          >
            {t("reset_password")}
          </a>
        </>
      );
    }
    return wrap(
      <>
        {t("errors.1999")} {t("login_staff_contact_owner")}
      </>
    );
  }

  // fallback
  return wrap(t("errors.1999"));
}
